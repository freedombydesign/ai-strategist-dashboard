'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { 
  SparklesIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  DocumentIcon,
  ChatBubbleLeftRightIcon,
  StopIcon
} from '@heroicons/react/24/outline'
import { 
  SparklesIcon as SparklesIconSolid
} from '@heroicons/react/24/solid'
import { formatRelativeTime, getInitials } from '@/lib/utils'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  typing?: boolean
}

interface PremiumAIChatProps {
  userId: string
}

export function PremiumAIChat({ userId }: PremiumAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Welcome! I'm your AI Business Strategist. I've analyzed your Freedom Score and I'm ready to help you scale your business with confidence. What would you like to discuss today?",
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    // Simulate API call
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "That's an excellent question! Based on your Freedom Score analysis, I can see some opportunities for improvement. Let me provide you with a strategic recommendation tailored to your business...",
        role: 'assistant',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
      setIsLoading(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // In real implementation, handle voice recording here
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <motion.div 
        className="bg-surface/90 backdrop-blur-elegant border-b border-black/5 px-6 py-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rich-gold to-rose-gold flex items-center justify-center">
            <SparklesIconSolid className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-display text-xl font-bold text-foreground">
              AI Business Strategist
            </h2>
            <p className="text-body text-sm text-medium-gray">
              Your premium business intelligence advisor
            </p>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex items-start gap-4 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-elegant-silver to-medium-gray'
                  : 'bg-gradient-to-br from-rich-gold to-rose-gold'
              }`}>
                {message.role === 'user' ? (
                  <span className="text-white font-medium text-sm">
                    {getInitials('User')}
                  </span>
                ) : (
                  <SparklesIcon className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex-1 max-w-3xl ${
                message.role === 'user' ? 'flex justify-end' : ''
              }`}>
                <Card 
                  variant={message.role === 'user' ? 'default' : 'gold'}
                  className={`${message.role === 'user' ? 'bg-light-gray/30' : ''}`}
                >
                  <CardContent className="p-4">
                    <p className="text-body text-foreground leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <div className={`flex items-center gap-2 mt-3 text-xs text-medium-gray ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{formatRelativeTime(message.timestamp)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rich-gold to-rose-gold flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <Card variant="gold" className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-rich-gold rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        delay: i * 0.2 
                      }}
                    />
                  ))}
                </div>
                <span className="text-body text-sm text-medium-gray ml-2">
                  AI is thinking...
                </span>
              </div>
            </Card>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div 
        className="bg-surface/90 backdrop-blur-elegant border-t border-black/5 px-6 py-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-medium-gray hover:text-rich-gold"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
            Strategy Session
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-medium-gray hover:text-rich-gold"
          >
            <DocumentIcon className="w-4 h-4 mr-2" />
            Business Analysis
          </Button>
        </div>

        {/* Input Field */}
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your business strategy..."
              className="w-full px-4 py-3 pr-12 bg-light-gray/30 border border-black/10 rounded-xl focus:ring-2 focus:ring-rich-gold focus:border-rich-gold transition-all resize-none text-body text-foreground placeholder-medium-gray font-medium"
              rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 4) : 1}
              disabled={isLoading}
            />
            
            {/* Character count */}
            <div className="absolute bottom-2 right-2 text-xs text-medium-gray">
              {input.length}/2000
            </div>
          </div>

          {/* Voice Recording Button */}
          <Button
            variant={isRecording ? "error" : "ghost"}
            size="icon"
            onClick={toggleRecording}
            className={`flex-shrink-0 ${
              isRecording 
                ? 'bg-error text-white animate-pulse' 
                : 'text-medium-gray hover:text-rich-gold'
            }`}
          >
            {isRecording ? (
              <StopIcon className="w-5 h-5" />
            ) : (
              <MicrophoneIcon className="w-5 h-5" />
            )}
          </Button>

          {/* Send Button */}
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            loading={isLoading}
            className="btn-gradient-gold flex-shrink-0"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mt-3 text-xs text-medium-gray">
          <div className="flex items-center gap-4">
            <span>✨ Premium AI Model Active</span>
            <span>🔒 End-to-end Encrypted</span>
          </div>
          <div className="text-right">
            {isRecording && (
              <span className="text-error font-medium animate-pulse">
                🔴 Recording...
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}