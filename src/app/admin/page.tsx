'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Sprint {
  id: number
  sprint_key: string
  name: string
  full_title: string
  description: string
  methodology: string
}

interface StrategicGuidance {
  id: number
  guidance_type: 'challenge' | 'solution' | 'methodology' | 'best_practice'
  category: string
  title: string
  content: string
  context_tags: string[]
  priority: number
}

interface Personality {
  id: number
  personality_key: 'savage' | 'strategic' | 'creative' | 'analytical' | 'supportive'
  name: string
  description: string
  system_prompt: string
  style_guidelines: string
  example_response: string
}

export default function AdminFrameworks() {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [guidance, setGuidance] = useState<StrategicGuidance[]>([])
  const [personalities, setPersonalities] = useState<Personality[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'sprints' | 'guidance' | 'personalities'>('sprints')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [sprintsResult, guidanceResult, personalitiesResult] = await Promise.all([
        supabase.from('sprints').select('*').order('sprint_key'),
        supabase.from('strategic_guidance').select('*').order('priority'),
        supabase.from('ai_personalities').select('*').order('personality_key')
      ])
      
      if (sprintsResult.data) setSprints(sprintsResult.data)
      if (guidanceResult.data) setGuidance(guidanceResult.data)
      if (personalitiesResult.data) setPersonalities(personalitiesResult.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateSprint(sprint: Sprint) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('sprints')
        .update({
          full_title: sprint.full_title,
          description: sprint.description,
          methodology: sprint.methodology
        })
        .eq('id', sprint.id)
      
      if (error) throw error
      alert('Sprint updated successfully!')
    } catch (error) {
      console.error('Error updating sprint:', error)
      alert('Error updating sprint')
    } finally {
      setSaving(false)
    }
  }

  async function updateGuidance(item: StrategicGuidance) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('strategic_guidance')
        .update({
          title: item.title,
          content: item.content,
          category: item.category,
          context_tags: item.context_tags,
          priority: item.priority
        })
        .eq('id', item.id)
      
      if (error) throw error
      alert('Guidance updated successfully!')
    } catch (error) {
      console.error('Error updating guidance:', error)
      alert('Error updating guidance')
    } finally {
      setSaving(false)
    }
  }

  async function addNewGuidance() {
    const newGuidance: Omit<StrategicGuidance, 'id'> = {
      guidance_type: 'solution',
      category: 'positioning',
      title: 'New Guidance',
      content: 'Enter your guidance content here...',
      context_tags: ['positioning'],
      priority: 1
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('strategic_guidance')
        .insert(newGuidance)
        .select()
        .single()
      
      if (error) throw error
      if (data) setGuidance([...guidance, data])
      alert('New guidance added!')
    } catch (error) {
      console.error('Error adding guidance:', error)
      alert('Error adding guidance')
    } finally {
      setSaving(false)
    }
  }

  async function updatePersonality(personality: Personality) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('ai_personalities')
        .update({
          name: personality.name,
          description: personality.description,
          system_prompt: personality.system_prompt,
          style_guidelines: personality.style_guidelines,
          example_response: personality.example_response
        })
        .eq('id', personality.id)
      
      if (error) throw error
      alert('Personality updated successfully!')
    } catch (error) {
      console.error('Error updating personality:', error)
      alert('Error updating personality')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading frameworks...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Framework Administration</h1>
          <p className="text-gray-600">Update your AI strategist frameworks and methodology without code</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('sprints')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sprints'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sprints ({sprints.length})
            </button>
            <button
              onClick={() => setActiveTab('guidance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'guidance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Strategic Guidance ({guidance.length})
            </button>
            <button
              onClick={() => setActiveTab('personalities')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'personalities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              AI Personalities ({personalities.length})
            </button>
          </nav>
        </div>

        {/* Sprints Tab */}
        {activeTab === 'sprints' && (
          <div className="space-y-6">
            {sprints.map((sprint) => (
              <div key={sprint.id} className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sprint: {sprint.sprint_key} - {sprint.name}
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Title</label>
                    <input
                      type="text"
                      value={sprint.full_title}
                      onChange={(e) => setSprints(sprints.map(s => 
                        s.id === sprint.id ? { ...s, full_title: e.target.value } : s
                      ))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={sprint.description}
                      onChange={(e) => setSprints(sprints.map(s => 
                        s.id === sprint.id ? { ...s, description: e.target.value } : s
                      ))}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Methodology</label>
                    <textarea
                      value={sprint.methodology}
                      onChange={(e) => setSprints(sprints.map(s => 
                        s.id === sprint.id ? { ...s, methodology: e.target.value } : s
                      ))}
                      rows={2}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => updateSprint(sprint)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Update Sprint'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strategic Guidance Tab */}
        {activeTab === 'guidance' && (
          <div className="space-y-6">
            <div className="flex justify-end mb-6">
              <button
                onClick={addNewGuidance}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add New Guidance'}
              </button>
            </div>

            {guidance.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => setGuidance(guidance.map(g => 
                        g.id === item.id ? { ...g, title: e.target.value } : g
                      ))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={item.category}
                      onChange={(e) => setGuidance(guidance.map(g => 
                        g.id === item.id ? { ...g, category: e.target.value } : g
                      ))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="positioning">Positioning</option>
                      <option value="sales">Sales</option>
                      <option value="delivery">Delivery</option>
                      <option value="systems">Systems</option>
                      <option value="scaling">Scaling</option>
                      <option value="buyer_journey">Buyer Journey</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={item.guidance_type}
                      onChange={(e) => setGuidance(guidance.map(g => 
                        g.id === item.id ? { ...g, guidance_type: e.target.value as StrategicGuidance['guidance_type'] } : g
                      ))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="challenge">Challenge</option>
                      <option value="solution">Solution</option>
                      <option value="methodology">Methodology</option>
                      <option value="best_practice">Best Practice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={item.priority}
                      onChange={(e) => setGuidance(guidance.map(g => 
                        g.id === item.id ? { ...g, priority: parseInt(e.target.value) } : g
                      ))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>High (1)</option>
                      <option value={2}>Medium (2)</option>
                      <option value={3}>Low (3)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={item.content}
                    onChange={(e) => setGuidance(guidance.map(g => 
                      g.id === item.id ? { ...g, content: e.target.value } : g
                    ))}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Context Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={item.context_tags.join(', ')}
                    onChange={(e) => setGuidance(guidance.map(g => 
                      g.id === item.id ? { 
                        ...g, 
                        context_tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                      } : g
                    ))}
                    placeholder="positioning, pricing, scaling"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => updateGuidance(item)}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Update Guidance'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Personalities Tab */}
        {activeTab === 'personalities' && (
          <div className="space-y-6">
            {personalities.map((personality) => (
              <div key={personality.id} className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {personality.personality_key.toUpperCase()} MODE
                    </h3>
                    <p className="text-sm text-gray-600">
                      Customize how your AI behaves in {personality.personality_key} mode
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={personality.name}
                      onChange={(e) => setPersonalities(personalities.map(p => 
                        p.id === personality.id ? { ...p, name: e.target.value } : p
                      ))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={personality.description}
                      onChange={(e) => setPersonalities(personalities.map(p => 
                        p.id === personality.id ? { ...p, description: e.target.value } : p
                      ))}
                      rows={2}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of this personality mode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      System Prompt
                    </label>
                    <textarea
                      value={personality.system_prompt}
                      onChange={(e) => setPersonalities(personalities.map(p => 
                        p.id === personality.id ? { ...p, system_prompt: e.target.value } : p
                      ))}
                      rows={6}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="The core system prompt that defines how this personality responds..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Style Guidelines
                    </label>
                    <textarea
                      value={personality.style_guidelines}
                      onChange={(e) => setPersonalities(personalities.map(p => 
                        p.id === personality.id ? { ...p, style_guidelines: e.target.value } : p
                      ))}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Specific style rules, tone guidelines, formatting preferences..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Example Response
                    </label>
                    <textarea
                      value={personality.example_response}
                      onChange={(e) => setPersonalities(personalities.map(p => 
                        p.id === personality.id ? { ...p, example_response: e.target.value } : p
                      ))}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Example of how this personality should respond to show the style..."
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => updatePersonality(personality)}
                      disabled={saving}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Update Personality'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}