'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, Clock, Tag, TrendingUp, Search, Filter } from 'lucide-react'

interface ConversationMemory {
  id: number
  conversation_id: string
  message: string
  response: string
  context_tags: string[]
  interaction_type: string
  business_stage?: string
  key_insights?: Record<string, any>
  priority_score: number
  created_at: string
}

interface ConversationTag {
  tag_name: string
  tag_category: string
  color_hex: string
  description: string
}

export default function ConversationMemoryViewer() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationMemory[]>([])
  const [tags, setTags] = useState<ConversationTag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [selectedInteractionType, setSelectedInteractionType] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'priority'>('recent')

  useEffect(() => {
    if (user?.id) {
      loadConversationMemory()
      loadTags()
    }
  }, [user?.id])

  const loadConversationMemory = async () => {
    try {
      setLoading(true)
      // This would need to be implemented as an API endpoint
      const response = await fetch(`/api/conversation-memory?user_id=${user?.id}`)
      if (response.ok) {
        const result = await response.json()
        setConversations(result.conversations || [])
      }
    } catch (error) {
      console.error('Error loading conversation memory:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTags = async () => {
    try {
      // This would need to be implemented as an API endpoint
      const response = await fetch('/api/conversation-tags')
      if (response.ok) {
        const result = await response.json()
        setTags(result.tags || [])
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const filteredConversations = conversations
    .filter(conv => {
      const matchesSearch = searchTerm === '' || 
        conv.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.response.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTag = selectedTag === '' || 
        conv.context_tags.includes(selectedTag)
      
      const matchesInteractionType = selectedInteractionType === '' || 
        conv.interaction_type === selectedInteractionType
      
      return matchesSearch && matchesTag && matchesInteractionType
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priority_score - a.priority_score
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const getTagColor = (tagName: string) => {
    const tag = tags.find(t => t.tag_name === tagName)
    return tag?.color_hex || '#6B7280'
  }

  const getPriorityLabel = (score: number) => {
    if (score >= 4) return { label: 'High', color: 'text-red-600 bg-red-50' }
    if (score >= 3) return { label: 'Medium', color: 'text-yellow-600 bg-yellow-50' }
    return { label: 'Low', color: 'text-green-600 bg-green-50' }
  }

  const getInteractionTypeIcon = (type: string) => {
    switch (type) {
      case 'strategic_advice': return '🎯'
      case 'asset_generation': return '✨'
      case 'sprint_guidance': return '🚀'
      case 'troubleshooting': return '🔧'
      default: return '💬'
    }
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500">Please sign in to view conversation memory</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <MessageSquare className="w-6 h-6 text-indigo-600 mr-3" />
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Conversation Memory</h3>
          <p className="text-sm text-gray-600">
            {conversations.length} conversations tracked with context and insights
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Topics</option>
            {tags.filter(tag => tag.tag_category === 'topic').map(tag => (
              <option key={tag.tag_name} value={tag.tag_name}>
                {tag.tag_name.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={selectedInteractionType}
            onChange={(e) => setSelectedInteractionType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="strategic_advice">Strategic Advice</option>
            <option value="asset_generation">Asset Generation</option>
            <option value="sprint_guidance">Sprint Guidance</option>
            <option value="troubleshooting">Troubleshooting</option>
            <option value="general">General</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'priority')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="priority">Highest Priority</option>
          </select>
        </div>
      </div>

      {/* Conversation List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredConversations.length > 0 ? (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => {
            const priority = getPriorityLabel(conversation.priority_score)
            
            return (
              <div key={conversation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {getInteractionTypeIcon(conversation.interaction_type)}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {conversation.interaction_type.replace('_', ' ')}
                      </span>
                      {conversation.business_stage && (
                        <span className="text-xs text-gray-500 ml-2">
                          • {conversation.business_stage} Stage
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                      {priority.label} Priority
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {conversation.context_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {conversation.context_tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: getTagColor(tag) }}
                      >
                        {tag.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Message:</div>
                    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">
                      {conversation.message.length > 200 
                        ? `${conversation.message.substring(0, 200)}...` 
                        : conversation.message}
                    </p>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Response:</div>
                    <p className="text-sm text-gray-800 bg-blue-50 p-3 rounded">
                      {conversation.response.length > 300 
                        ? `${conversation.response.substring(0, 300)}...` 
                        : conversation.response}
                    </p>
                  </div>
                </div>

                {/* Key Insights */}
                {conversation.key_insights && Object.keys(conversation.key_insights).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-600 mb-2">Key Insights:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(conversation.key_insights).map(([key, value], index) => (
                        <span key={index} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || selectedTag || selectedInteractionType 
              ? 'No conversations match your filters' 
              : 'No conversation memory found'}
          </p>
        </div>
      )}

      {/* Memory Stats */}
      {conversations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{conversations.length}</div>
              <div className="text-xs text-gray-600">Total Conversations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {conversations.filter(c => c.priority_score >= 4).length}
              </div>
              <div className="text-xs text-gray-600">High Priority</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set(conversations.flatMap(c => c.context_tags)).size}
              </div>
              <div className="text-xs text-gray-600">Unique Topics</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {conversations.filter(c => c.interaction_type === 'asset_generation').length}
              </div>
              <div className="text-xs text-gray-600">Assets Created</div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-indigo-50 rounded-lg p-4">
        <h5 className="font-medium text-indigo-900 mb-2">🧠 About Conversation Memory</h5>
        <ul className="text-sm text-indigo-800 space-y-1">
          <li>• Every AI conversation is stored with context tags and priority scoring</li>
          <li>• Key insights are extracted and referenced in future conversations</li>
          <li>• Your business evolution is tracked over time for better strategic advice</li>
          <li>• This memory system makes the AI smarter about your specific situation</li>
        </ul>
      </div>
    </div>
  )
}