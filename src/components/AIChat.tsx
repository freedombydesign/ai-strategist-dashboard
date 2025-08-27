import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import FileUpload from './FileUpload' // Import your existing FileUpload component
import { FreedomScoreResult } from '../utils/freedomScoring'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  hasFiles?: boolean
  files?: string[] // Store processed file content
}

interface AIChatProps {
  freedomScore: FreedomScoreResult
  userId: string
  isExpanded?: boolean
}

export default function AIChat({ freedomScore, userId, isExpanded = false }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(!isExpanded)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initial AI greeting when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      sendInitialGreeting()
    }
  }, [])

  const sendInitialGreeting = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: "Hello",
          freedom_score: freedomScore,
          is_fresh_start: true
        })
      })

      const data = await response.json()
      
      if (data.reply) {
        setMessages([{
          id: crypto.randomUUID(),
          content: data.reply,
          isUser: false,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Error getting AI greeting:', error)
      setMessages([{
        id: crypto.randomUUID(),
        content: "Hi! I'm your AI strategist. I can see you just completed your Freedom Score diagnostic. How can I help you understand your results and next steps?",
        isUser: false,
        timestamp: new Date()
      }])
    }
    setIsLoading(false)
  }

  // NEW: Handle file uploads and processing
  // Test this by replacing your current handleFilesSelected function in AIChat component

const handleFilesSelected = async (files: File[]) => {
  if (files.length === 0) return;

  console.log('=== STARTING FILE UPLOAD TEST ===');
  console.log('Files to upload:', files.map(f => f.name));

  setIsUploadingFiles(true);
  setShowFileUpload(false);

  // Add user message showing files being uploaded
  const fileMessage: Message = {
    id: crypto.randomUUID(),
    content: `Uploading ${files.length} file(s): ${files.map(f => f.name).join(', ')}`,
    isUser: true,
    timestamp: new Date(),
    hasFiles: true
  };
  setMessages(prev => [...prev, fileMessage]);

  try {
    // Step 1: Process the files
    console.log('Step 1: Creating FormData...');
    const formData = new FormData();
    files.forEach(file => {
      console.log(`Adding file: ${file.name} (${file.type})`);
      formData.append('files', file);
    });

    console.log('Step 2: Calling upload-and-process API...');
    const uploadResponse = await fetch('/api/upload-and-process', {
      method: 'POST',
      body: formData,
    });

    console.log('Step 3: Upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed with response:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('Step 4: Upload result:', uploadResult);
    
    if (!uploadResult.success) {
      console.error('Upload result indicates failure:', uploadResult);
      throw new Error(uploadResult.error || 'File processing failed');
    }

    console.log('Step 5: Successfully processed files:', uploadResult.processedFiles);

    // Step 2: Send processed content to AI strategist
    const processedContent = uploadResult.processedFiles.join('\n\n---\n\n');
    console.log('Step 6: Sending to AI with content length:', processedContent.length);

    const contextMessage = `I've uploaded ${files.length} document(s) for you to analyze. Here's what I found in them:\n\n${processedContent}\n\nPlease analyze these documents in the context of my business and Freedom Score results. What insights and recommendations do you have?`;

    console.log('Step 7: Calling AI strategist API...');
    const aiResponse = await fetch('/api/ai-strategist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        message: contextMessage,
        freedom_score: freedomScore,
        is_fresh_start: false,
        file_context: processedContent // Add file context
      })
    });

    console.log('Step 8: AI response status:', aiResponse.status);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI response failed:', errorText);
      throw new Error(`AI response failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('Step 9: AI response data:', aiData);
    
    if (aiData.reply) {
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: aiData.reply,
        isUser: false,
        timestamp: new Date(),
        files: uploadResult.processedFiles
      };
      setMessages(prev => [...prev, aiMessage]);
      console.log('Step 10: SUCCESS - AI response added to chat');
    } else {
      throw new Error('No AI response received');
    }

  } catch (error) {
    console.error('=== FILE UPLOAD ERROR ===', error);
    const errorMessage: Message = {
      id: crypto.randomUUID(),
      content: `Sorry, there was an error processing your files: ${(error as Error).message}. Check the browser console for details.`,
      isUser: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errorMessage]);
  }

  setIsUploadingFiles(false);
  console.log('=== FILE UPLOAD TEST COMPLETE ===');
};
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: inputMessage,
          freedom_score: freedomScore,
          is_fresh_start: false
        })
      })

      const data = await response.json()
      
      if (data.reply) {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          content: data.reply,
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error('No reply from AI')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-105"
          title="Chat with AI Strategist"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
          {messages.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {messages.filter(m => !m.isUser).length}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className={`${isExpanded ? 'w-full h-full' : 'fixed bottom-4 right-4 w-96 h-[500px]'} bg-white rounded-lg shadow-xl border z-50 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">AI Strategist</h3>
            <p className="text-xs opacity-90">Freedom Score: {freedomScore.percent}%</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard"
            className="text-white hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded text-xs underline transition-colors"
          >
            Dashboard
          </Link>
          <button
            onClick={() => setIsMinimized(true)}
            className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H5v-2h14v2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isUser
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              {message.hasFiles && (
                <div className="text-xs mt-2 opacity-75">
                  📎 Files uploaded
                </div>
              )}
              <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {(isLoading || isUploadingFiles) && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-sm p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-600">
                  {isUploadingFiles ? 'Processing files...' : 'Thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="absolute inset-0 bg-white rounded-lg z-10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Upload Documents</h3>
            <button
              onClick={() => setShowFileUpload(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <FileUpload 
            onFilesSelect={handleFilesSelected}
            maxFiles={3}
          />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex items-end space-x-2">
          <button
            onClick={() => setShowFileUpload(true)}
            disabled={isLoading || isUploadingFiles}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Upload files"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </button>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your results, next steps, or implementation..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading || isUploadingFiles}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || isUploadingFiles}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}