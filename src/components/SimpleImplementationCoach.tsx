'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { MessageCircle, Send, Bot, User, TrendingUp, Flame, Target, Zap } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface CoachingContext {
  streak: number
  totalCheckins: number
  avgEnergy: number
}

export default function SimpleImplementationCoach() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [coachingContext, setCoachingContext] = useState<CoachingContext | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id) {
      loadInitialContext()
      addWelcomeMessage()
    }
  }, [user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadInitialContext = async () => {
    try {
      // Load check-ins from localStorage instead of database
      const checkinKeys = Object.keys(localStorage).filter(key => key.startsWith(`checkin_${user!.id}_`))
      const totalCheckins = checkinKeys.length
      
      let totalEnergy = 0
      let streak = 0
      
      if (totalCheckins > 0) {
        // Calculate average energy from check-ins
        checkinKeys.forEach(key => {
          const checkinData = JSON.parse(localStorage.getItem(key) || '{}')
          if (checkinData.energy_level) {
            totalEnergy += checkinData.energy_level
          }
        })
        
        // Simple streak calculation - check if there's a recent check-in
        const recentCheckin = localStorage.getItem(`checkin_${user!.id}_${new Date().toISOString().split('T')[0]}`)
        if (recentCheckin) {
          streak = 1 // Simple streak for now
        }
      }

      const context = {
        streak,
        totalCheckins,
        avgEnergy: totalCheckins > 0 ? Math.round(totalEnergy / totalCheckins) : 0
      }

      setCoachingContext(context)
    } catch (error) {
      console.error('[IMPLEMENTATION-COACH] Error loading context:', error)
      // Set default context if loading fails
      setCoachingContext({
        streak: 0,
        totalCheckins: 0,
        avgEnergy: 0
      })
    }
  }

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      content: `👋 Hey there! I'm your Implementation Coach - here to help you accelerate your progress and overcome obstacles.

I can see your recent activity and I'm ready to help you:
• Build consistency and momentum
• Identify and solve implementation barriers  
• Connect your daily actions to business results
• Optimize your energy and productivity patterns

What's on your mind today? How can I help you move forward?`,
      role: 'assistant',
      timestamp: new Date()
    }

    setMessages([welcomeMessage])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Create coaching context for the AI
      const contextSummary = coachingContext ? `
Current coaching context:
- Total check-ins completed: ${coachingContext.totalCheckins}
- Current streak: ${coachingContext.streak} days
- Average energy level: ${coachingContext.avgEnergy}/10
- User ID: ${user?.id}
` : 'Loading user context...'

      const response = await fetch('/api/implementation-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: contextSummary,
          userId: user?.id
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString() + '-assistant',
        content: data.response || 'I apologize, but I encountered an issue. Please try again or let me know how else I can help you stay on track with your implementation goals.',
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        content: 'I\'m having trouble connecting right now. But I\'m here to help! You can tell me about your current challenges, what you\'ve accomplished today, or what obstacles you\'re facing with your business implementation.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Coaching Stats Header */}
      {coachingContext && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b p-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Flame className="w-4 h-4 text-orange-500 mr-1" />
                <span className="font-medium">{coachingContext.streak}</span>
                <span className="text-gray-600 ml-1">day streak</span>
              </div>
              
              <div className="flex items-center">
                <Target className="w-4 h-4 text-blue-500 mr-1" />
                <span className="font-medium">{coachingContext.totalCheckins}</span>
                <span className="text-gray-600 ml-1">check-ins</span>
              </div>
              
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-green-500 mr-1" />
                <span className="font-medium">{coachingContext.avgEnergy}/10</span>
                <span className="text-gray-600 ml-1">avg energy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-3xl ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-green-600 text-white'
              }`}>
                {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse">Thinking...</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me about your progress, challenges, or ask for implementation advice..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              isLoading || !inputMessage.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}