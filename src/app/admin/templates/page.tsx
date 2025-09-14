'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function TemplateManager() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    category: '',
    content: '',
    resource_url: ''
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('template_library')
        .select('*')
        .order('template_name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      alert('Error loading templates')
    } finally {
      setLoading(false)
    }
  }

  async function addTemplate() {
    if (!newTemplate.template_name.trim()) {
      alert('Template name is required')
      return
    }

    setSaving(true)
    try {
      console.log('[TEMPLATE-ADD] Attempting to add template:', newTemplate)
      
      // Use minimal insert without .single() to avoid hanging
      const { data, error } = await supabase
        .from('template_library')
        .insert({
          template_name: newTemplate.template_name.trim(),
          category: newTemplate.category?.trim() || null,
          content: newTemplate.content?.trim() || null
        })

      console.log('[TEMPLATE-ADD] Insert result:', { data, error })

      if (error) {
        console.error('[TEMPLATE-ADD] Insert error:', error)
        throw error
      }
      
      // Reload templates instead of trying to append
      loadTemplates()
      setNewTemplate({ template_name: '', category: '', content: '', resource_url: '' })
      alert('Template added successfully!')
      
    } catch (error) {
      console.error('[TEMPLATE-ADD] Full error:', error)
      alert('Error adding template: ' + (error?.message || 'Unknown error'))
    } finally {
      console.log('[TEMPLATE-ADD] Setting saving to false')
      setSaving(false)
    }
  }

  async function deleteTemplate(templateId: number, templateName: string) {
    if (!confirm(`Delete "${templateName}"? This cannot be undone.`)) return
    
    try {
      const { error } = await supabase
        .from('template_library')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      
      setTemplates(templates.filter(t => t.id !== templateId))
      alert('Template deleted successfully!')
      
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template: ' + error.message)
    }
  }

  if (loading) return <div className="p-8">Loading templates...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Manager</h1>
          <p className="text-gray-600">Add and manage your framework templates</p>
        </div>

        {/* Add New Template */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
              <input
                type="text"
                value={newTemplate.template_name}
                onChange={(e) => setNewTemplate({...newTemplate, template_name: e.target.value})}
                placeholder="e.g., Decision Call Structure"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                placeholder="e.g., Sales Scripts"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Resource URL</label>
            <input
              type="url"
              value={newTemplate.resource_url}
              onChange={(e) => setNewTemplate({...newTemplate, resource_url: e.target.value})}
              placeholder="https://docs.google.com/... or Excel link"
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description/Content</label>
            <textarea
              value={newTemplate.content}
              onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
              placeholder="Describe what this template does and how to use it..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={addTemplate}
              disabled={saving}
              className={`px-6 py-3 rounded-md font-semibold text-white ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? 'Adding...' : 'Add Template'}
            </button>
            
            <button
              onClick={async () => {
                if (!newTemplate.template_name.trim()) {
                  alert('Template name is required')
                  return
                }
                
                setSaving(true)
                try {
                  const response = await fetch('/api/add-template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newTemplate)
                  })
                  
                  const result = await response.json()
                  
                  if (response.ok) {
                    loadTemplates()
                    setNewTemplate({ template_name: '', category: '', content: '', resource_url: '' })
                    alert(result.message)
                  } else {
                    alert('Error: ' + result.error)
                  }
                  
                } catch (err) {
                  alert('Error: ' + err.message)
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving}
              className={`px-4 py-3 rounded-md font-semibold text-white ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Add via API
            </button>
          </div>
        </div>

        {/* Existing Templates */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Existing Templates ({templates.length})</h2>
            <button
              onClick={async () => {
                if (!confirm('Remove duplicate templates? This cannot be undone.')) return
                try {
                  const response = await fetch('/api/clean-duplicates', { method: 'POST' })
                  const result = await response.json()
                  if (response.ok) {
                    alert(result.message)
                    loadTemplates() // Reload the list
                  } else {
                    alert('Cleanup failed: ' + result.error)
                  }
                } catch (err) {
                  alert('Cleanup failed: ' + err.message)
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium mr-2"
            >
              Clean Duplicates
            </button>
            
            <button
              onClick={async () => {
                if (!confirm('Remove placeholder templates without content? This will only keep templates with resource links or substantial content. This cannot be undone.')) return
                try {
                  const response = await fetch('/api/cleanup-placeholder-templates', { method: 'POST' })
                  const result = await response.json()
                  if (response.ok) {
                    alert(result.message)
                    loadTemplates() // Reload the list
                  } else {
                    alert('Cleanup failed: ' + result.error)
                  }
                } catch (err) {
                  alert('Cleanup failed: ' + err.message)
                }
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium mr-2"
            >
              🧹 Remove Placeholders
            </button>
            
            <button
              onClick={async () => {
                if (!confirm('Add Ruth\'s Decision Call Structure template?')) return
                try {
                  const response = await fetch('/api/add-template', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      template_name: 'Decision Call Structure',
                      category: 'Sales Scripts',
                      content: 'How to lead sales calls with an evaluation approach',
                      resource_url: 'https://docs.google.com/document/d/1sbyaaiisR91XEeXGooAQ9xVo0e2iyTFg/edit?usp=sharing'
                    })
                  })
                  const result = await response.json()
                  if (response.ok) {
                    alert(result.message)
                    loadTemplates()
                  } else {
                    alert('Add failed: ' + result.error)
                  }
                } catch (err) {
                  alert('Add failed: ' + err.message)
                }
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium mr-2"
            >
              Add Decision Call
            </button>
            
            <button
              onClick={async () => {
                if (!confirm('Fix existing Decision Call Structure template (ID 161) with resource URL?')) return
                try {
                  const response = await fetch('/api/fix-decision-call', { method: 'POST' })
                  const result = await response.json()
                  if (response.ok) {
                    alert(result.message)
                    loadTemplates()
                  } else {
                    alert('Fix failed: ' + result.error)
                  }
                } catch (err) {
                  alert('Fix failed: ' + err.message)
                }
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium mr-2"
            >
              Fix Decision Call URL
            </button>
            
            <button
              onClick={async () => {
                if (!confirm('Add full Decision Call Structure content to the template so AI can use it directly?')) return
                try {
                  const response = await fetch('/api/update-decision-call-content', { method: 'POST' })
                  const result = await response.json()
                  if (response.ok) {
                    alert(result.message)
                    loadTemplates()
                  } else {
                    alert('Update failed: ' + result.error)
                  }
                } catch (err) {
                  alert('Update failed: ' + err.message)
                }
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium mr-2"
            >
              Add Generic Content
            </button>
            
            <button
              onClick={async () => {
                if (!confirm('Update with Ruth\'s ACTUAL Decision Call Structure (6-step framework)?')) return
                try {
                  const response = await fetch('/api/update-real-decision-call', { method: 'POST' })
                  const result = await response.json()
                  if (response.ok) {
                    alert(result.message)
                    loadTemplates()
                  } else {
                    alert('Update failed: ' + result.error)
                  }
                } catch (err) {
                  alert('Update failed: ' + err.message)
                }
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium mr-2"
            >
              🎯 Add REAL Decision Call
            </button>
            
            <button
              onClick={async () => {
                if (!confirm('Import all AI prompts from your Airtable setup? This will add ~12 AI prompt templates with variables and resource links.')) return
                try {
                  const response = await fetch('/api/bulk-import-frameworks', { method: 'POST' })
                  const result = await response.json()
                  if (response.ok) {
                    alert(result.message)
                    loadTemplates()
                  } else {
                    alert('Import failed: ' + result.error)
                  }
                } catch (err) {
                  alert('Import failed: ' + err.message)
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
            >
              📚 Import Airtable AI Prompts
            </button>
          </div>
          
          {/* Sprint Steps Import Section */}
          <div className="bg-gray-50 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Sprint Steps Management</h2>
            <p className="text-gray-600 mb-4">Import your detailed Airtable steps with resource links, deliverables, and AI prompt connections.</p>
            
            <div className="flex space-x-4">
              <button
                onClick={async () => {
                  if (!confirm('Create enhanced steps table? This will create the database structure for your rich Airtable steps data.')) return
                  try {
                    const response = await fetch('/api/create-enhanced-steps-table', { method: 'POST' })
                    const result = await response.json()
                    if (response.ok) {
                      alert(result.message)
                    } else {
                      alert('Table creation failed: ' + result.error)
                    }
                  } catch (err) {
                    alert('Table creation failed: ' + err.message)
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium"
              >
                🏗️ Create Steps Table
              </button>
              
              <button
                onClick={async () => {
                  if (!confirm('Import all 17 detailed steps from your Airtable? This includes resource links, deliverables, sprint outcomes, and AI prompt connections.')) return
                  try {
                    const response = await fetch('/api/import-airtable-steps', { method: 'POST' })
                    const result = await response.json()
                    if (response.ok) {
                      alert(result.message)
                    } else {
                      alert('Steps import failed: ' + result.error)
                    }
                  } catch (err) {
                    alert('Steps import failed: ' + err.message)
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
              >
                📋 Import Airtable Steps
              </button>
              
              <button
                onClick={async () => {
                  if (!confirm('Import 5 sprint categories with descriptions and outcomes? This creates the complete sprint structure with phase progression.')) return
                  try {
                    const response = await fetch('/api/import-sprint-categories', { method: 'POST' })
                    const result = await response.json()
                    if (response.ok) {
                      alert(result.message)
                    } else {
                      alert('Categories import failed: ' + result.error)
                    }
                  } catch (err) {
                    alert('Categories import failed: ' + err.message)
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
              >
                🎯 Import Sprint Categories
              </button>
            </div>
          </div>
          
          {templates.length === 0 ? (
            <p className="text-gray-500">No templates found. Add your first template above.</p>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{template.template_name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Category: {
                          template.category?.length > 20 
                            ? 'Legacy ID - Needs Update' 
                            : template.category || 'Uncategorized'
                        }
                      </p>
                      <p className="text-xs text-gray-500 mb-2">ID: {template.id}</p>
                      {template.resource_link && (
                        <p className="text-sm mb-2">
                          <span className="text-gray-600">Resource: </span>
                          <a 
                            href={template.resource_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {template.resource_link.length > 50 
                              ? template.resource_link.substring(0, 47) + '...'
                              : template.resource_link}
                          </a>
                        </p>
                      )}
                      {template.content && (
                        <p className="text-sm text-gray-700 mb-2">{template.content}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        <p>All fields: {Object.keys(template).join(', ')}</p>
                        {template.template_name && (
                          <p className="mt-1">Raw data: {JSON.stringify(template, null, 2).substring(0, 200)}...</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => {
                          const details = `Template: ${template.template_name}\n` +
                            `Category: ${template.category}\n` +
                            `ID: ${template.id}\n` +
                            `Resource Link: ${template.resource_link || 'None'}\n` +
                            `Content: ${template.content || 'None'}\n` +
                            `Description: ${template.description || 'None'}\n` +
                            `All Fields: ${Object.keys(template).join(', ')}\n` +
                            `Raw JSON: ${JSON.stringify(template, null, 2)}`
                          alert(details)
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id, template.template_name)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex space-x-4">
          <a
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ← Back to Admin
          </a>
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            → Main Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}