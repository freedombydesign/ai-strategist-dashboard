'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NavigationHeader from '../../components/NavigationHeader'

interface Template {
  id: string
  workflow_template_id: string
  workflow_step_id: string
  asset_type: string
  asset_name: string
  content: string
  metadata: {
    ai_model: string
    step_title: string
    step_number: number
    tokens_used: number
    generated_at: string
  }
  status: string
  created_at: string
}

interface Workflow {
  id: string
  name: string
}

export default function TemplateManagerPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // New personalization states
  const [personalityMode, setPersonalityMode] = useState<string>('professional')
  const [companyName, setCompanyName] = useState<string>('')
  const [brandVoice, setBrandVoice] = useState<string>('')
  const [industryTerms, setIndustryTerms] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchWorkflows()
  }, [])

  useEffect(() => {
    if (selectedWorkflow) {
      fetchTemplates(selectedWorkflow)
    }
  }, [selectedWorkflow])

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/service-delivery-systemizer')
      const data = await response.json()
      if (data.success) {
        setWorkflows(data.data)
      }
    } catch (err) {
      setError('Failed to fetch workflows')
    }
  }

  const fetchTemplates = async (workflowId: string) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/systemizer/generate-templates?workflowId=${workflowId}`)
      const data = await response.json()
      if (data.success) {
        setTemplates(data.data)
      } else {
        setTemplates([])
      }
    } catch (err) {
      setError('Failed to fetch templates')
      setTemplates([])
    } finally {
      setIsLoading(false)
    }
  }

  const generateTemplates = async () => {
    if (!selectedWorkflow) return

    setIsGenerating(true)
    setError('')

    try {
      const customization = {
        ...(companyName && { companyName }),
        ...(brandVoice && { brandVoice }),
        ...(industryTerms && { industryTerms: industryTerms.split(',').map(term => term.trim()).filter(Boolean) })
      }

      const response = await fetch('/api/systemizer/generate-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: selectedWorkflow,
          templateTypes: ['email', 'document', 'checklist', 'task_list'],
          personalityMode,
          customization
        })
      })

      const data = await response.json()
      if (data.success) {
        // Show success message
        setSuccessMessage('Templates generated successfully! Redirecting to analytics...')
        setError('')

        // Refresh templates list
        await fetchTemplates(selectedWorkflow)

        // Auto-redirect to analytics after successful template generation
        // Use a more robust redirect method
        setTimeout(() => {
          try {
            router.push('/workflow-analytics')
          } catch (error) {
            console.error('Navigation error:', error)
            // Fallback to window.location if router fails
            window.location.href = '/workflow-analytics'
          }
        }, 3000)
      } else {
        setError('Template generation failed')
        setSuccessMessage('')
      }
    } catch (err) {
      setError('Failed to generate templates')
      setSuccessMessage('')
    } finally {
      setIsGenerating(false)
    }
  }

  const getTemplateTypeIcon = (type: string) => {
    switch (type) {
      case 'email_template': return '📧'
      case 'document_template': return '📄'
      case 'checklist_template': return '☑️'
      case 'task_list_template': return '📝'
      default: return '📋'
    }
  }

  const getTemplateTypeLabel = (type: string) => {
    return type.replace('_template', '').replace('_', ' ').toUpperCase()
  }

  const formatContent = (contentString: string) => {
    try {
      const parsed = JSON.parse(contentString)

      // Handle the case where AI returned text with parsing_note
      if (parsed.parsing_note && parsed.raw_content) {
        // Try to extract JSON from markdown code blocks
        const codeBlockMatch = parsed.raw_content.match(/```json\n([\s\S]*?)\n```/)
        if (codeBlockMatch) {
          try {
            return JSON.parse(codeBlockMatch[1])
          } catch {
            return { raw: parsed.raw_content }
          }
        }
        return { raw: parsed.raw_content }
      }

      return parsed
    } catch {
      return { raw: contentString }
    }
  }

  // Helper function to safely render content as string
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return '[Complex Object]'
      }
    }
    return String(value)
  }

  const renderTemplateContent = (template: Template) => {
    const content = formatContent(template.content)

    switch (template.asset_type) {
      case 'email_template':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Subject</label>
              <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white">
                {safeRender(content.subject)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Body</label>
              <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white whitespace-pre-wrap">
                {safeRender(content.body)}
              </div>
            </div>
          </div>
        )

      case 'document_template':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Title</label>
              <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white font-semibold">
                {safeRender(content.title)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Introduction</label>
              <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white">
                {safeRender(content.introduction)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Main Content</label>
              <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white whitespace-pre-wrap">
                {safeRender(content.main_content)}
              </div>
            </div>
            {content.notes && (
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Notes</label>
                <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white">
                  {safeRender(content.notes)}
                </div>
              </div>
            )}
          </div>
        )

      case 'checklist_template':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Checklist Title</label>
              <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white font-semibold">
                {safeRender(content.title)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Items</label>
              <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white">
                <ul className="space-y-2">
                  {content.items?.map((item: string, index: number) => (
                    <li key={index} className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" />
                      <span>{safeRender(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {content.notes && (
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Notes</label>
                <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white">
                  {safeRender(content.notes)}
                </div>
              </div>
            )}
          </div>
        )

      case 'task_list_template':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Main Task</label>
              <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white font-semibold">
                {safeRender(content.main_task)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Sub Tasks</label>
              <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white">
                <div className="space-y-3">
                  {content.sub_tasks?.map((task: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 p-3 rounded border border-white/10">
                      <span className="flex-1">{safeRender(task.task)}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.priority === 'high' ? 'bg-red-500/20 text-red-200' :
                          task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-200' :
                          'bg-green-500/20 text-green-200'
                        }`}>
                          {safeRender(task.priority)}
                        </span>
                        <span className="text-purple-300">{safeRender(task.estimated_minutes)}min</span>
                      </div>
                    </div>
                  ))}
                </div>
                {content.total_estimated_minutes && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-purple-200 font-medium">
                    Total Estimated Time: {safeRender(content.total_estimated_minutes)} minutes ({Math.round(Number(content.total_estimated_minutes || 0) / 60 * 10) / 10} hours)
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="bg-black/30 border border-white/20 rounded-lg p-3 text-white">
            <pre className="whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>
          </div>
        )
    }
  }

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">🔄</div>
            <p className="text-purple-200">Loading Template Manager...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <NavigationHeader
        title="📋 Template Manager"
        subtitle="Manage and view AI-generated templates for your workflows"
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workflow Selection */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Select Workflow</h2>

            <div className="space-y-4">
              <select
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a workflow...</option>
                {workflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>

              {selectedWorkflow && (
                <div className="space-y-4">
                  {/* Personality Mode */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Personality Mode
                    </label>
                    <select
                      value={personalityMode}
                      onChange={(e) => setPersonalityMode(e.target.value)}
                      className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="technical">Technical</option>
                      <option value="executive">Executive</option>
                      <option value="creative">Creative</option>
                    </select>
                  </div>

                  {/* Advanced Options Toggle */}
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full text-sm text-purple-300 hover:text-purple-100 border border-purple-500/30 hover:border-purple-400/50 px-3 py-2 rounded-lg transition-all duration-200"
                  >
                    {showAdvanced ? '🔽 Hide Advanced Options' : '🔧 Advanced Options'}
                  </button>

                  {/* Advanced Customization Options */}
                  {showAdvanced && (
                    <div className="space-y-3 bg-black/20 p-4 rounded-lg border border-white/10">
                      <div>
                        <label className="block text-sm font-medium text-purple-200 mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g., Acme Consulting"
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-purple-200 mb-2">
                          Brand Voice
                        </label>
                        <input
                          type="text"
                          value={brandVoice}
                          onChange={(e) => setBrandVoice(e.target.value)}
                          placeholder="e.g., professional but approachable"
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-purple-200 mb-2">
                          Industry Terms (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={industryTerms}
                          onChange={(e) => setIndustryTerms(e.target.value)}
                          placeholder="e.g., stakeholder, deliverable, milestone"
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={generateTemplates}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? '🤔 Generating...' : `🚀 Generate ${personalityMode.charAt(0).toUpperCase() + personalityMode.slice(1)} Templates`}
                  </button>

                  {templates.length > 0 && (
                    <button
                      onClick={() => router.push('/workflow-analytics')}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                    >
                      📊 View Analytics & Impact
                    </button>
                  )}

                  <div className="text-sm text-purple-200 text-center">
                    {templates.length} templates found
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-500/20 border border-green-400/30 text-green-200 p-4 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 text-red-200 p-4 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Templates List */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Templates</h2>

            {!selectedWorkflow && (
              <div className="text-center text-purple-300 py-12">
                <div className="text-6xl mb-4">📋</div>
                <p>Select a workflow to view templates</p>
              </div>
            )}

            {selectedWorkflow && isLoading && (
              <div className="text-center text-purple-300 py-12">
                <div className="animate-spin text-6xl mb-4">🔄</div>
                <p>Loading templates...</p>
              </div>
            )}

            {selectedWorkflow && !isLoading && templates.length === 0 && (
              <div className="text-center text-purple-300 py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p>No templates found for this workflow</p>
                <p className="text-sm mt-2">Click "Generate New Templates" to create some</p>
              </div>
            )}

            {templates.length > 0 && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedTemplate?.id === template.id
                        ? 'bg-purple-500/20 border-purple-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTemplateTypeIcon(template.asset_type)}</span>
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {getTemplateTypeLabel(template.asset_type)}
                        </div>
                        <div className="text-purple-200 text-sm truncate">
                          Step {template.metadata.step_number}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-purple-300">
                      Generated: {new Date(template.metadata.generated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Template Preview */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Template Preview</h2>

            {!selectedTemplate && (
              <div className="text-center text-purple-300 py-12">
                <div className="text-6xl mb-4">👁️</div>
                <p>Select a template to preview</p>
              </div>
            )}

            {selectedTemplate && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <span className="text-3xl">{getTemplateTypeIcon(selectedTemplate.asset_type)}</span>
                  <div>
                    <div className="text-white font-semibold">
                      {getTemplateTypeLabel(selectedTemplate.asset_type)}
                    </div>
                    <div className="text-purple-200 text-sm">
                      Step {selectedTemplate.metadata.step_number} • {selectedTemplate.metadata.tokens_used} tokens
                    </div>
                  </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  {renderTemplateContent(selectedTemplate)}
                </div>

                <div className="pt-4 border-t border-white/10 text-xs text-purple-300 space-y-1">
                  <div>Generated: {new Date(selectedTemplate.metadata.generated_at).toLocaleString()}</div>
                  <div>Model: {selectedTemplate.metadata.ai_model}</div>
                  <div>Status: {selectedTemplate.status}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}