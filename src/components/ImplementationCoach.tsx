'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { implementationService } from '../services/implementationService'
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

export default function ImplementationCoach() {
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
      const [analytics, streak] = await Promise.all([
        implementationService.getImplementationAnalytics(user!.id),
        implementationService.calculateStreakDays(user!.id)
      ])

      const context = {
        streak,
        totalCheckins: analytics.totalCheckins,
        avgEnergy: analytics.averageEnergyLevel
      }

      setCoachingContext(context)
    } catch (error) {
      console.error('[IMPLEMENTATION-COACH] Error loading context:', error)
    }
  }

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      content: `👋 Hey there! I'm your Implementation Coach - here to help you accelerate your progress and overcome obstacles.

I've analyzed your recent check-ins and I'm ready to help you:
• Build consistency and momentum
• Identify and solve implementation barriers  
• Connect your daily actions to business results
• Optimize your energy and productivity patterns

What's on your mind today? Any challenges you're facing with implementation?`,
      role: 'assistant',
      timestamp: new Date()
    }

    setMessages([welcomeMessage])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || isLoading || !user?.id) return

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/implementation-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: user.id
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Update coaching context if provided
      if (data.coachingContext) {
        setCoachingContext(data.coachingContext)
      }

      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('[IMPLEMENTATION-COACH] Error sending message:', error)
      
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-sm border">
      {/* Header with Context Stats */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center">
          <Bot className="text-purple-600 mr-3" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Implementation Coach</h3>
            <p className="text-sm text-gray-600">Data-driven accountability & progress acceleration</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        {coachingContext && (
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center">
                <Flame className="text-orange-500 mr-1" size={16} />
                <span className="text-lg font-bold text-gray-900">{coachingContext.streak}</span>
              </div>
              <div className="text-xs text-gray-500">Streak</div>
            </div>
            <div className="text-center">
              <div className="flex items-center">
                <Target className="text-blue-500 mr-1" size={16} />
                <span className="text-lg font-bold text-gray-900">{coachingContext.totalCheckins}</span>
              </div>
              <div className="text-xs text-gray-500">Check-ins</div>
            </div>
            <div className="text-center">
              <div className="flex items-center">
                <Zap className="text-green-500 mr-1" size={16} />
                <span className="text-lg font-bold text-gray-900">{coachingContext.avgEnergy}</span>
              </div>
              <div className="text-xs text-gray-500">Energy</div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-purple-100 text-purple-600'
              }`}
            >
              {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div
              className={`max-w-[75%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
              <div
                className={`text-xs mt-1 opacity-70 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">Analyzing your progress...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about obstacles, energy, progress patterns, or get accountability tips..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <Send size={16} />
          </button>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={() => setInputMessage("I'm struggling to stay consistent with my daily tasks. What patterns do you see?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
            disabled={isLoading}
          >
            💡 Consistency help
          </button>
          <button
            type="button"
            onClick={() => setInputMessage("My energy levels seem low lately. Any insights from my check-ins?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
            disabled={isLoading}
          >
            🔋 Energy analysis
          </button>
          <button
            type="button"
            onClick={() => setInputMessage("What obstacles am I facing most often and how can I overcome them?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
            disabled={isLoading}
          >
            🛠️ Obstacle solutions
          </button>
        </div>
      </form>
    </div>
  )
}