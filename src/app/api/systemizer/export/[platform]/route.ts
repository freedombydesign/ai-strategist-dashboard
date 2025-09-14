import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

interface ExportConfig {
  includeTemplates: boolean
  includeTimelines: boolean
  includeAssignments: boolean
  customFields?: Record<string, any>
  exportFormat: 'json' | 'csv' | 'native'
}

interface PlatformSettings {
  projectName?: string
  workspaceId?: string
  teamId?: string
  boardId?: string
  listId?: string
  apiKey?: string
  accessToken?: string
  [key: string]: any
}

interface ExportRequest {
  workflowId: string
  exportConfig: ExportConfig
  platformSettings: PlatformSettings
}

const SUPPORTED_PLATFORMS = ['asana', 'clickup', 'monday', 'trello', 'notion']

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform

    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported platform: ${platform}. Supported platforms: ${SUPPORTED_PLATFORMS.join(', ')}`
      }, { status: 400 })
    }

    const body: ExportRequest = await request.json()
    const { workflowId, exportConfig, platformSettings } = body

    if (!workflowId) {
      return NextResponse.json({
        success: false,
        error: 'workflowId is required'
      }, { status: 400 })
    }

    console.log(`[EXPORT-${platform.toUpperCase()}] Starting export for workflow ${workflowId}`)

    // Get OAuth connection for this platform
    const { data: connection, error: connectionError } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true)
      .order('last_used_at', { ascending: false })
      .limit(1)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json({
        success: false,
        error: `No active ${platform} connection found. Please connect to ${platform} first.`,
        requiresConnection: true
      }, { status: 401 })
    }

    // Update platform settings with OAuth credentials
    const enhancedPlatformSettings = {
      ...platformSettings,
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token,
      tokenType: connection.token_type || 'Bearer',
      apiKey: connection.access_token, // Some platforms use apiKey instead
      // Platform-specific settings
      workspaceId: connection.platform_workspace_id,
      workspaceName: connection.platform_workspace_name,
      platformUserId: connection.platform_user_id,
      platformUsername: connection.platform_username
    }

    // Fetch workflow data
    const { data: workflow, error: workflowError } = await supabase
      .from('service_workflow_templates')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json({
        success: false,
        error: 'Workflow not found'
      }, { status: 404 })
    }

    // Fetch workflow steps
    const { data: steps, error: stepsError } = await supabase
      .from('service_workflow_steps')
      .select('*')
      .eq('workflow_template_id', workflowId)
      .order('step_order')

    if (stepsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch workflow steps'
      }, { status: 500 })
    }

    // Fetch templates if requested
    let templates = []
    if (exportConfig.includeTemplates) {
      const { data: templateData, error: templateError } = await supabase
        .from('service_template_assets')
        .select('*')
        .eq('workflow_template_id', workflowId)

      if (!templateError && templateData) {
        templates = templateData
      }
    }

    // Export to the specified platform using OAuth credentials
    const exportResult = await exportToPlatform(platform, {
      workflow,
      steps,
      templates,
      exportConfig,
      platformSettings: enhancedPlatformSettings
    })

    // Update last_used_at timestamp for this connection
    await supabase
      .from('platform_connections')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', connection.id)

    console.log(`[EXPORT-${platform.toUpperCase()}] Export completed successfully`)

    return NextResponse.json({
      success: true,
      exportId: exportResult.exportId,
      platform,
      exportedAt: new Date().toISOString(),
      summary: {
        workflowName: workflow.name,
        totalSteps: steps.length,
        templatesIncluded: exportConfig.includeTemplates ? templates.length : 0,
        exportFormat: exportConfig.exportFormat
      },
      platformResponse: exportResult.platformResponse,
      downloadUrl: exportResult.downloadUrl,
      externalUrl: exportResult.externalUrl
    })

  } catch (error) {
    console.error(`[EXPORT] Error exporting to ${params.platform}:`, error)
    return NextResponse.json({
      success: false,
      error: 'Export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function exportToPlatform(platform: string, data: {
  workflow: any
  steps: any[]
  templates: any[]
  exportConfig: ExportConfig
  platformSettings: PlatformSettings
}) {
  const { workflow, steps, templates, exportConfig, platformSettings } = data

  switch (platform) {
    case 'asana':
      return await exportToAsana(workflow, steps, templates, exportConfig, platformSettings)

    case 'clickup':
      return await exportToClickUp(workflow, steps, templates, exportConfig, platformSettings)

    case 'monday':
      return await exportToMonday(workflow, steps, templates, exportConfig, platformSettings)

    case 'trello':
      return await exportToTrello(workflow, steps, templates, exportConfig, platformSettings)

    case 'notion':
      return await exportToNotion(workflow, steps, templates, exportConfig, platformSettings)

    default:
      throw new Error(`Platform ${platform} not implemented`)
  }
}

async function exportToAsana(workflow: any, steps: any[], templates: any[], exportConfig: ExportConfig, platformSettings: PlatformSettings) {
  const { projectName, accessToken, workspaceId } = platformSettings

  if (!accessToken) {
    throw new Error('Asana access token is required')
  }

  try {
    // Create project in Asana
    const projectResponse = await fetch('https://app.asana.com/api/1.0/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          name: projectName || workflow.name,
          notes: workflow.description || '',
          workspace: workspaceId,
          public: false
        }
      })
    })

    if (!projectResponse.ok) {
      throw new Error(`Asana API error: ${projectResponse.statusText}`)
    }

    const project = await projectResponse.json()
    const projectId = project.data.gid

    // Create tasks for each workflow step
    const taskPromises = steps.map(async (step, index) => {
      const taskResponse = await fetch('https://app.asana.com/api/1.0/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            name: step.step_name,
            notes: step.description || '',
            projects: [projectId],
            completed: false
          }
        })
      })

      if (!taskResponse.ok) {
        console.warn(`Failed to create task for step ${step.step_name}`)
        return null
      }

      return await taskResponse.json()
    })

    const tasks = await Promise.all(taskPromises)
    const successfulTasks = tasks.filter(Boolean)

    return {
      exportId: `asana_${Date.now()}`,
      platformResponse: {
        project: project.data,
        tasks: successfulTasks,
        totalTasks: successfulTasks.length
      },
      externalUrl: `https://app.asana.com/0/${projectId}`,
      downloadUrl: null
    }

  } catch (error) {
    throw new Error(`Asana export failed: ${error.message}`)
  }
}

async function exportToClickUp(workflow: any, steps: any[], templates: any[], exportConfig: ExportConfig, platformSettings: PlatformSettings) {
  const { apiKey, listId, teamId } = platformSettings

  if (!apiKey) {
    throw new Error('ClickUp API key is required')
  }

  try {
    // Create tasks in ClickUp
    const taskPromises = steps.map(async (step) => {
      const taskResponse = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: step.step_name,
          description: step.description || '',
          status: 'to do',
          priority: step.priority || 3,
          tags: ['workflow', workflow.category || 'general']
        })
      })

      if (!taskResponse.ok) {
        console.warn(`Failed to create ClickUp task for step ${step.step_name}`)
        return null
      }

      return await taskResponse.json()
    })

    const tasks = await Promise.all(taskPromises)
    const successfulTasks = tasks.filter(Boolean)

    return {
      exportId: `clickup_${Date.now()}`,
      platformResponse: {
        tasks: successfulTasks,
        totalTasks: successfulTasks.length
      },
      externalUrl: `https://app.clickup.com/${teamId}/v/li/${listId}`,
      downloadUrl: null
    }

  } catch (error) {
    throw new Error(`ClickUp export failed: ${error.message}`)
  }
}

async function exportToMonday(workflow: any, steps: any[], templates: any[], exportConfig: ExportConfig, platformSettings: PlatformSettings) {
  const { apiKey, boardId } = platformSettings

  if (!apiKey) {
    throw new Error('Monday.com API key is required')
  }

  try {
    // Create items in Monday.com board
    const itemPromises = steps.map(async (step, index) => {
      const mutation = `
        mutation {
          create_item (
            board_id: ${boardId}
            item_name: "${step.step_name.replace(/"/g, '\\"')}"
          ) {
            id
            name
            url
          }
        }
      `

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: mutation })
      })

      if (!response.ok) {
        console.warn(`Failed to create Monday.com item for step ${step.step_name}`)
        return null
      }

      const result = await response.json()
      return result.data?.create_item || null
    })

    const items = await Promise.all(itemPromises)
    const successfulItems = items.filter(Boolean)

    return {
      exportId: `monday_${Date.now()}`,
      platformResponse: {
        items: successfulItems,
        totalItems: successfulItems.length
      },
      externalUrl: `https://view.monday.com/boards/${boardId}`,
      downloadUrl: null
    }

  } catch (error) {
    throw new Error(`Monday.com export failed: ${error.message}`)
  }
}

async function exportToTrello(workflow: any, steps: any[], templates: any[], exportConfig: ExportConfig, platformSettings: PlatformSettings) {
  const { apiKey, accessToken, boardId, listId } = platformSettings

  if (!apiKey || !accessToken) {
    throw new Error('Trello API key and access token are required')
  }

  try {
    // Create cards in Trello
    const cardPromises = steps.map(async (step) => {
      const response = await fetch(`https://api.trello.com/1/cards?key=${apiKey}&token=${accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: step.step_name,
          desc: step.description || '',
          idList: listId,
          pos: 'bottom'
        })
      })

      if (!response.ok) {
        console.warn(`Failed to create Trello card for step ${step.step_name}`)
        return null
      }

      return await response.json()
    })

    const cards = await Promise.all(cardPromises)
    const successfulCards = cards.filter(Boolean)

    return {
      exportId: `trello_${Date.now()}`,
      platformResponse: {
        cards: successfulCards,
        totalCards: successfulCards.length
      },
      externalUrl: `https://trello.com/b/${boardId}`,
      downloadUrl: null
    }

  } catch (error) {
    throw new Error(`Trello export failed: ${error.message}`)
  }
}

async function exportToNotion(workflow: any, steps: any[], templates: any[], exportConfig: ExportConfig, platformSettings: PlatformSettings) {
  const { accessToken, databaseId } = platformSettings

  if (!accessToken) {
    throw new Error('Notion access token is required')
  }

  try {
    // Create pages in Notion database
    const pagePromises = steps.map(async (step) => {
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: {
            database_id: databaseId
          },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: step.step_name
                  }
                }
              ]
            },
            Status: {
              select: {
                name: 'Not started'
              }
            },
            Description: {
              rich_text: [
                {
                  text: {
                    content: step.description || ''
                  }
                }
              ]
            }
          }
        })
      })

      if (!response.ok) {
        console.warn(`Failed to create Notion page for step ${step.step_name}`)
        return null
      }

      return await response.json()
    })

    const pages = await Promise.all(pagePromises)
    const successfulPages = pages.filter(Boolean)

    return {
      exportId: `notion_${Date.now()}`,
      platformResponse: {
        pages: successfulPages,
        totalPages: successfulPages.length
      },
      externalUrl: `https://notion.so/${databaseId}`,
      downloadUrl: null
    }

  } catch (error) {
    throw new Error(`Notion export failed: ${error.message}`)
  }
}