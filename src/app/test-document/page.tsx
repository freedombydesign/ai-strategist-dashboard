'use client'

import { useState } from 'react'

export default function TestDocumentPage() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])

  const detectDocumentGeneration = (content: string) => {
    const documentTriggers = [
      { pattern: /(?:create|generate|build|develop|make|write).*(?:action.*plan|implementation.*plan)/i, type: 'action_plan', title: 'Action Plan' },
      { pattern: /(?:create|generate|build|develop|make|write).*(?:sop|standard.*operating.*procedure|process.*document)/i, type: 'sop', title: 'Standard Operating Procedure' },
      { pattern: /(?:create|generate|build|develop|make|write).*(?:strategy|strategic.*plan|business.*plan)/i, type: 'strategy_document', title: 'Strategy Document' },
      { pattern: /(?:create|generate|build|develop|make|write).*(?:document|report|guide|manual|list)/i, type: 'document', title: 'Business Document' },
      { pattern: /(?:can you|could you|would you).*(?:create|generate|build|make|write).*(?:document|list|guide|plan)/i, type: 'document', title: 'Business Document' },
      { pattern: /(?:create|make|generate).*(?:quick|simple).*document/i, type: 'document', title: 'Business Document' },
      { pattern: /document.*(?:of|with|about|for).*(?:objections|sales|challenges|processes)/i, type: 'document', title: 'Business Document' },
      { pattern: /(?:list|document).*(?:typical|common).*(?:objections|challenges|issues)/i, type: 'document', title: 'Business Document' },
      { pattern: /I'll create.*(?:plan|document|strategy|report)/i, type: 'document', title: 'Generated Document' },
    ]

    for (const trigger of documentTriggers) {
      if (trigger.pattern.test(content)) {
        console.log(`[DOC-TEST] Document trigger matched: ${trigger.pattern}`)
        return trigger
      }
    }
    return null
  }

  const generateDocument = async (content: string, type: string) => {
    try {
      console.log(`[DOC-TEST] Generating document of type: ${type}`)
      
      // Simple document generation for testing
      const docContent = `# ${type.replace('_', ' ').toUpperCase()}\n\nBased on: ${content}\n\nGenerated on: ${new Date().toISOString()}\n\nThis is a test document generated from your conversation.`
      
      const blob = new Blob([docContent], { type: 'text/markdown' })
      const downloadUrl = URL.createObjectURL(blob)
      
      return {
        title: `${type.replace('_', ' ')} Document`,
        type: 'markdown',
        downloadUrl
      }
    } catch (error) {
      console.error('[DOC-TEST] Document generation error:', error)
      return null
    }
  }

  const testDocumentGeneration = async () => {
    if (!message.trim()) return
    
    setIsLoading(true)
    setDocuments([])
    
    try {
      console.log('[DOC-TEST] Testing message:', message)
      
      // Step 1: Send to AI strategist API
      const response = await fetch('/api/ai-strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'test-user',
          message: message,
          is_fresh_start: false
        })
      })

      const data = await response.json()
      console.log('[DOC-TEST] AI response:', data)
      
      setResponse(data.reply || 'No response')
      
      // Step 2: Check if user requested document creation OR if AI response suggests document generation
      const userDocumentRequest = detectDocumentGeneration(message)
      const aiDocumentSuggestion = detectDocumentGeneration(data.reply || '')
      const documentDetection = userDocumentRequest || aiDocumentSuggestion
      
      console.log('[DOC-TEST] User request detection:', userDocumentRequest)
      console.log('[DOC-TEST] AI suggestion detection:', aiDocumentSuggestion)
      console.log('[DOC-TEST] Final detection:', documentDetection)
      
      // Step 3: Generate document if detected
      if (documentDetection) {
        console.log(`[DOC-TEST] Document creation triggered: ${documentDetection.type}`)
        const generatedDoc = await generateDocument(
          userDocumentRequest ? message : data.reply || '', 
          documentDetection.type
        )
        if (generatedDoc) {
          setDocuments([generatedDoc])
          console.log('[DOC-TEST] Document generated:', generatedDoc)
        } else {
          console.log('[DOC-TEST] Document generation failed')
        }
      } else {
        console.log('[DOC-TEST] No document generation triggered')
      }
      
    } catch (error) {
      console.error('[DOC-TEST] Test error:', error)
      setResponse(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Document Generation Test</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Test Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Try: 'Can you create an action plan for improving my pricing strategy?'"
            className="w-full p-3 border border-gray-300 rounded-md h-24"
          />
        </div>
        
        <button
          onClick={testDocumentGeneration}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Document Generation'}
        </button>
        
        {response && (
          <div>
            <h2 className="text-lg font-semibold mb-2">AI Response:</h2>
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <pre className="whitespace-pre-wrap text-sm">{response}</pre>
            </div>
          </div>
        )}
        
        {documents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Generated Documents:</h2>
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-green-200 rounded-md bg-green-50">
                  <span className="font-medium text-green-800">{doc.title}</span>
                  <a
                    href={doc.downloadUrl}
                    download={`${doc.title}.${doc.type === 'markdown' ? 'md' : 'txt'}`}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 p-4 border border-blue-200 rounded-md bg-blue-50">
        <h3 className="font-semibold mb-2">Test Phrases:</h3>
        <ul className="text-sm space-y-1">
          <li>• "Can you create an action plan for improving my pricing strategy?"</li>
          <li>• "Generate a document about common sales objections"</li>
          <li>• "Build me a strategy document for scaling my business"</li>
          <li>• "Create a simple document listing typical challenges"</li>
        </ul>
      </div>
    </div>
  )
}