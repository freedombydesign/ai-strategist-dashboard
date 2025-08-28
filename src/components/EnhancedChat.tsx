import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Mic, Paperclip, Bot, User, Sparkles, Edit2, Check, X, Download, FileText, Plus, MessageSquare, Trash2 } from 'lucide-react';
import WhisperVoiceChat from './WhisperVoiceChat';
import FileUpload from './FileUpload';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  files?: string[];
  audioUrl?: string;
  insights?: string[];
  suggestions?: string[];
  timestamp: Date | string;
  isEditing?: boolean;
  originalContent?: string;
  downloadableDocuments?: {
    title: string;
    type: string;
    downloadUrl: string;
  }[];
}

interface EnhancedChatProps {
  userId: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

type PersonalityType = 'strategic' | 'creative' | 'analytical' | 'supportive';

interface Personality {
  key: PersonalityType;
  name: string;
  icon: string;
}

export default function EnhancedChat({ userId }: EnhancedChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [aiPersonality, setAiPersonality] = useState<PersonalityType>('strategic');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [userName, setUserName] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('default');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Save current session before starting new one
  const saveCurrentSession = () => {
    if (messages.length > 1) { // Only save if there's actual conversation
      const currentSession: ChatSession = {
        id: sessionId,
        title: generateSessionTitle(messages),
        messages: [...messages],
        timestamp: new Date()
      };
      
      setChatSessions(prev => {
        const updated = [currentSession, ...prev.filter(s => s.id !== sessionId)];
        localStorage.setItem('chatSessions', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const generateSessionTitle = (msgs: Message[]): string => {
    const userMessages = msgs.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const firstMessage = userMessages[0].content;
      return firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
    }
    return 'New conversation';
  };

  const startNewChat = () => {
    console.log('[CHAT] Starting new chat session');
    saveCurrentSession(); // Save current session first
    
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    setMessages([]);
    setInput('');
    setSelectedFiles([]);
    setShowFileUpload(false);
    setEditingMessageId(null);
    setEditingContent('');
    
    // Show initial greeting for new session
    const greeting = userName 
      ? `Welcome back, ${userName}! Ready to start a new conversation? How can I help you with your business today?`
      : `Hi! I'm your AI business strategist. I'm here to help you grow your business and achieve more freedom. What's your name, and what brings you here today?`;
    
    const initialMessage: Message = {
      id: Date.now(),
      role: 'assistant',
      content: greeting,
      timestamp: new Date()
    };
    
    setTimeout(() => {
      setMessages([initialMessage]);
    }, 100);
  };

  const loadSession = (session: ChatSession) => {
    saveCurrentSession(); // Save current before switching
    setSessionId(session.id);
    setMessages(session.messages);
    setInput('');
    setSelectedFiles([]);
    setShowFileUpload(false);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      localStorage.setItem('chatSessions', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save conversation to localStorage for immediate persistence
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_history_${userId}`, JSON.stringify(messages));
    }
  }, [messages, userId]);

  // Load user profile and conversation history on component mount
  useEffect(() => {
    const loadUserData = async () => {
      console.log(`[CHAT] Loading user data for: ${userId}`);
      
      // Load user name from localStorage first for immediate display
      const localUserName = localStorage.getItem(`user_name_${userId}`);
      if (localUserName) {
        console.log(`[CHAT] Found local user name: ${localUserName}`);
        setUserName(localUserName);
      }

      // Load saved chat sessions
      const savedSessions = localStorage.getItem('chatSessions');
      if (savedSessions) {
        try {
          const sessions = JSON.parse(savedSessions);
          setChatSessions(sessions);
          console.log('[CHAT] Loaded saved sessions:', sessions.length);
        } catch (error) {
          console.error('[CHAT] Error parsing saved sessions:', error);
        }
      }

      // Load conversation history from localStorage first for immediate display
      const localHistory = localStorage.getItem(`chat_history_${userId}`);
      if (localHistory) {
        try {
          const parsedHistory = JSON.parse(localHistory);
          console.log(`[CHAT] Loaded ${parsedHistory.length} messages from localStorage`);
          setMessages(parsedHistory);
        } catch (error) {
          console.error('Error parsing local chat history:', error);
          localStorage.removeItem(`chat_history_${userId}`); // Clean up corrupted data
        }
      }

      // Try to get user profile from server
      try {
        console.log('[CHAT] Fetching user profile from server...');
        const profileResponse = await fetch(`/api/user-profile?user_id=${encodeURIComponent(userId)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.profile?.name) {
            console.log(`[CHAT] Server user name: ${profileData.profile.name}`);
            if (profileData.profile.name !== localUserName) {
              setUserName(profileData.profile.name);
              localStorage.setItem(`user_name_${userId}`, profileData.profile.name);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }

      // Fetch conversation history from server to ensure sync
      try {
        console.log('[CHAT] Fetching conversation history from server...');
        const response = await fetch(`/api/chat-history?user_id=${encodeURIComponent(userId)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[CHAT] Server returned ${data.conversations?.length || 0} conversation entries`);
          
          if (data.success && data.conversations?.length > 0) {
            const serverMessages: Message[] = [];
            
            data.conversations.forEach((conv: any, index: number) => {
              // Add user message
              serverMessages.push({
                id: Date.now() + index * 2,
                role: 'user' as const,
                content: conv.message,
                timestamp: new Date(conv.created_at)
              });
              
              // Add assistant response
              serverMessages.push({
                id: Date.now() + index * 2 + 1,
                role: 'assistant' as const,
                content: conv.response,
                timestamp: new Date(conv.created_at)
              });
            });

            // Check if we need to update (compare message count and last message)
            const shouldUpdate = !localHistory || 
                                serverMessages.length > (messages.length) ||
                                (serverMessages.length > 0 && messages.length > 0 && 
                                 serverMessages[serverMessages.length - 1].content !== messages[messages.length - 1].content);

            if (shouldUpdate) {
              console.log(`[CHAT] Updating with ${serverMessages.length} messages from server`);
              setMessages(serverMessages);
              localStorage.setItem(`chat_history_${userId}`, JSON.stringify(serverMessages));
            } else {
              console.log('[CHAT] Local data is up to date');
            }
          } else if (!localHistory) {
            // No server data and no local data - show initial greeting
            console.log('[CHAT] No conversation history found, showing initial greeting');
            const greeting = userName 
              ? `Welcome back, ${userName}! How can I help you with your business today?`
              : `Hi! I'm your AI business strategist. I'm here to help you grow your business and achieve more freedom. What's your name, and what brings you here today?`;
            
            const initialMessage: Message = {
              id: Date.now(),
              role: 'assistant',
              content: greeting,
              timestamp: new Date()
            };
            
            setMessages([initialMessage]);
          }
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
        // Continue with local data if available
      }
    };

    loadUserData();
  }, [userId]);

  // Show initial greeting if no messages and data loading is complete
  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        const greeting = userName 
          ? `Welcome back, ${userName}! How can I help you with your business today?`
          : `Hi! I'm your AI business strategist. I'm here to help you grow your business and achieve more freedom. What's your name, and what brings you here today?`;
        
        const initialMessage: Message = {
          id: Date.now(),
          role: 'assistant',
          content: greeting,
          timestamp: new Date()
        };
        
        setMessages([initialMessage]);
      }, 1000); // Wait 1 second to ensure data loading is complete

      return () => clearTimeout(timer);
    }
  }, [messages.length, userName]);

  const sendMessage = async (messageText = input, files = selectedFiles) => {
    if (!messageText.trim() && files.length === 0) return;

    // Check if user is introducing their name
    const nameMatch = messageText.match(/(?:i'm|i am|my name is|call me|name's)\s+([a-zA-Z]+)/i);
    if (nameMatch && !userName) {
      const detectedName = nameMatch[1];
      setUserName(detectedName);
      localStorage.setItem(`user_name_${userId}`, detectedName);
      
      // Save to server
      try {
        await fetch('/api/user-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            name: detectedName
          })
        });
      } catch (error) {
        console.error('Error saving user name:', error);
      }
    }

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      files: files.map(f => f.name),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    setSelectedFiles([]);
    setShowFileUpload(false);

    try {
      // Get Freedom Score from localStorage first, then database fallback
      const storedScore = typeof window !== 'undefined' ? localStorage.getItem('lastFreedomScore') : null;
      let freedomScore = null;
      
      if (storedScore) {
        try {
          freedomScore = JSON.parse(storedScore);
          console.log('[CHAT] Found Freedom Score in localStorage');
        } catch (error) {
          console.error('Error parsing stored score:', error);
        }
      }
      
      // If no localStorage score, try to fetch from database
      if (!freedomScore) {
        try {
          console.log('[CHAT] No localStorage score, fetching from database...');
          const diagnosticService = await import('../services/diagnosticService');
          const userResponses = await diagnosticService.diagnosticService.getUserResponses(userId);
          
          if (userResponses.length > 0) {
            const mostRecent = userResponses[0];
            freedomScore = mostRecent.scoreResult;
            console.log('[CHAT] Found Freedom Score in database:', freedomScore.percent + '%');
            
            // Save to localStorage for future use
            if (typeof window !== 'undefined') {
              localStorage.setItem('lastFreedomScore', JSON.stringify(freedomScore));
              localStorage.setItem('scoreCompletedAt', mostRecent.created_at);
            }
          } else {
            console.log('[CHAT] No Freedom Score found in database or localStorage');
          }
        } catch (dbError) {
          console.error('[CHAT] Error fetching Freedom Score from database:', dbError);
        }
      }

      // Process files first if any
      console.log('Files to process:', files, 'Length:', files.length);
      let fileContext = '';
      if (files.length > 0) {
        console.log('Processing files...');
        const fileFormData = new FormData();
        files.forEach(file => {
          console.log('Adding file:', file.name, file.type);
          fileFormData.append('files', file);
        });
        
        try {
          console.log('Calling upload-and-process API...');
          const fileResponse = await fetch('/api/upload-and-process', {
            method: 'POST',
            body: fileFormData
          });
          console.log('File API response status:', fileResponse.status);
          
          if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            console.log('File API response data:', fileData);
            if (fileData.success && fileData.processedFiles) {
              fileContext = fileData.processedFiles.join('\n\n');
            }
          } else {
            console.error('File processing failed with status:', fileResponse.status);
          }
        } catch (error) {
          console.error('File processing error:', error);
        }
      } else {
        console.log('No files to process');
      }

      // Send to AI strategist API with file context
      console.log('[CHAT] Sending request to AI strategist API with:', {
        user_id: userId,
        message: messageText.substring(0, 50) + '...',
        has_freedom_score: !!freedomScore,
        has_file_context: !!fileContext,
        is_fresh_start: false
      });
      
      const response = await fetch('/api/ai-strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: messageText,
          freedom_score: freedomScore,
          file_context: fileContext || undefined,
          is_fresh_start: false,
          user_name: userName || null, // Send known user name to backend
          personality: aiPersonality // Send selected personality to backend
        })
      });

      console.log('[CHAT] AI strategist API response status:', response.status);
      
      if (!response.ok) {
        console.error('[CHAT] AI strategist API error - Status:', response.status, 'StatusText:', response.statusText);
        const errorText = await response.text();
        console.error('[CHAT] AI strategist API error response:', errorText);
        throw new Error(`AI strategist API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[CHAT] AI strategist API response data:', {
        has_reply: !!data.reply,
        reply_preview: data.reply?.substring(0, 100) + '...',
        error: data.error
      });
      
      // Check for API error response
      if (data.error) {
        console.error('[CHAT] AI strategist API returned error:', data.error, data.details);
        throw new Error(data.error);
      }
      
      // Check if user requested document creation OR if AI response suggests document generation
      const userDocumentRequest = detectDocumentGeneration(input);
      const aiDocumentSuggestion = detectDocumentGeneration(data.reply || '');
      const documentDetection = userDocumentRequest || aiDocumentSuggestion;
      
      let downloadableDocuments = [];

      if (documentDetection) {
        console.log(`[CHAT] Document creation triggered: ${documentDetection.type}`);
        
        // Determine appropriate format based on document type and content
        let defaultFormat = 'pdf'; // Default to PDF for external sharing
        if (documentDetection.type === 'sop') {
          defaultFormat = 'docx'; // SOPs need editing capability
        } else if (documentDetection.type === 'strategy_document') {
          defaultFormat = 'pptx'; // Strategy docs work well as presentations
        } else if (input.toLowerCase().includes('spreadsheet') || input.toLowerCase().includes('budget') || input.toLowerCase().includes('tracking')) {
          defaultFormat = 'xlsx'; // Data-related requests get Excel format
        }
        
        console.log(`[CHAT] Auto-selected format: ${defaultFormat} for ${documentDetection.type}`);
        
        const generatedDoc = await generateDocument(
          userDocumentRequest ? input : data.reply || '', 
          documentDetection.type,
          defaultFormat
        );
        if (generatedDoc) {
          downloadableDocuments.push(generatedDoc);
        }
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply || 'Sorry, I encountered an error processing your request.',
        audioUrl: data.audioUrl,
        insights: data.insights,
        suggestions: data.suggestions,
        timestamp: new Date(),
        downloadableDocuments: downloadableDocuments.length > 0 ? downloadableDocuments : undefined
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscript = (transcript: string, replace: boolean = false) => {
    console.log('[ENHANCED-CHAT] 🎤 Received voice transcript:', transcript.substring(0, 50) + '...');
    console.log('[ENHANCED-CHAT] Full transcript received:', transcript);
    console.log('[ENHANCED-CHAT] Replace mode:', replace);
    console.log('[ENHANCED-CHAT] Current input before update:', input.substring(0, 30) + '...');
    console.log('[ENHANCED-CHAT] Current input length:', input.length);
    
    if (replace) {
      console.log('[ENHANCED-CHAT] 🔄 Replacing input with transcript');
      console.log('[ENHANCED-CHAT] Setting input to:', transcript);
      setInput(transcript);
      console.log('[ENHANCED-CHAT] ✅ Input state updated via setInput');
      
      // Add a timeout to check if the state was actually updated
      setTimeout(() => {
        console.log('[ENHANCED-CHAT] 🔍 Checking input state after update...');
        // Note: This will show old value due to closure, but helps debug timing
      }, 100);
    } else {
      console.log('[ENHANCED-CHAT] ➕ Appending transcript to input');
      setInput(prev => {
        const newInput = prev + (prev ? ' ' : '') + transcript;
        console.log('[ENHANCED-CHAT] Previous input:', prev);
        console.log('[ENHANCED-CHAT] New input will be:', newInput.substring(0, 50) + '...');
        console.log('[ENHANCED-CHAT] New input length:', newInput.length);
        return newInput;
      });
    }
    console.log('[ENHANCED-CHAT] 🏁 handleVoiceTranscript function completed');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startEditMessage = (messageId: number, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const saveEditedMessage = async (messageId: number) => {
    if (!editingContent.trim()) return;

    const editedMessageIndex = messages.findIndex(msg => msg.id === messageId);
    if (editedMessageIndex === -1) return;

    // Remove all messages after the edited message (including the AI response)
    const messagesToKeep = messages.slice(0, editedMessageIndex);
    const editedMessage = { ...messages[editedMessageIndex], content: editingContent.trim(), originalContent: messages[editedMessageIndex].content };
    messagesToKeep.push(editedMessage);
    
    // Update messages state with the edited message and removed subsequent messages
    setMessages(messagesToKeep);
    
    // Clear editing state
    setEditingMessageId(null);
    setEditingContent('');

    // If this was a user message, generate a NEW AI response
    if (editedMessage.role === 'user') {
      console.log('[EDIT] Generating new AI response for edited message');
      setIsLoading(true);
      
      try {
        // Get Freedom Score from localStorage first, then database fallback
        const storedScore = typeof window !== 'undefined' ? localStorage.getItem('lastFreedomScore') : null;
        let freedomScore = null;
        
        if (storedScore) {
          try {
            freedomScore = JSON.parse(storedScore);
          } catch (error) {
            console.error('Error parsing stored score:', error);
          }
        }
        
        // If no localStorage score, try to fetch from database
        if (!freedomScore) {
          try {
            const diagnosticService = await import('../services/diagnosticService');
            const userResponses = await diagnosticService.diagnosticService.getUserResponses(userId);
            
            if (userResponses.length > 0) {
              const mostRecent = userResponses[0];
              freedomScore = mostRecent.scoreResult;
              
              // Save to localStorage for future use
              if (typeof window !== 'undefined') {
                localStorage.setItem('lastFreedomScore', JSON.stringify(freedomScore));
                localStorage.setItem('scoreCompletedAt', mostRecent.created_at);
              }
            }
          } catch (dbError) {
            console.error('[EDIT] Error fetching Freedom Score from database:', dbError);
          }
        }

        // Build message history for context (excluding the current edited message)
        const conversationHistory = messagesToKeep.slice(0, -1);
        
        // Send to AI strategist API to get new response
        const editedMessageContent = editedMessage.content; // Use the saved content instead of editingContent
        console.log('[EDIT] Calling AI strategist with edited message:', editedMessageContent);
        const response = await fetch('/api/ai-strategist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            message: editedMessageContent,
            freedom_score: freedomScore,
            is_fresh_start: false,
            user_name: userName || null, // Send known user name for editing too
            personality: aiPersonality // Send selected personality for editing too
          })
        });

        const data = await response.json();
        console.log('[EDIT] Received AI response:', data);
        console.log('[EDIT] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.error || response.statusText || 'Unknown API error'}`);
        }
        
        if (data.error) {
          throw new Error(`AI API error: ${data.error}`);
        }
        
        if (data.reply) {
          const newAiMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: data.reply,
            audioUrl: data.audioUrl,
            insights: data.insights,
            suggestions: data.suggestions,
            timestamp: new Date()
          };

          console.log('[EDIT] Adding new AI message to conversation');
          setMessages(prev => [...prev, newAiMessage]);
          
          // Save the complete updated conversation to server
          try {
            const updatedMessages = [...messagesToKeep, newAiMessage];
            await fetch('/api/sync-conversation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                messages: updatedMessages
              })
            });
            console.log('[EDIT] Updated conversation synced to server');
          } catch (syncError) {
            console.error('Error syncing edited conversation:', syncError);
          }
        } else {
          throw new Error('No reply from AI');
        }
      } catch (error) {
        console.error('Error generating new AI response:', error);
        const errorMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Sorry, I encountered an error processing your edited message: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const generateDocument = async (content: string, documentType: string, format: string = 'docx') => {
    try {
      const storedScore = typeof window !== 'undefined' ? localStorage.getItem('lastFreedomScore') : null;
      let freedomScore = null;
      
      if (storedScore) {
        try {
          freedomScore = JSON.parse(storedScore);
        } catch (error) {
          console.error('Error parsing stored score:', error);
        }
      }
      
      // If no localStorage score, try to fetch from database
      if (!freedomScore) {
        try {
          const diagnosticService = await import('../services/diagnosticService');
          const userResponses = await diagnosticService.diagnosticService.getUserResponses(userId);
          
          if (userResponses.length > 0) {
            const mostRecent = userResponses[0];
            freedomScore = mostRecent.scoreResult;
            
            // Save to localStorage for future use
            if (typeof window !== 'undefined') {
              localStorage.setItem('lastFreedomScore', JSON.stringify(freedomScore));
              localStorage.setItem('scoreCompletedAt', mostRecent.created_at);
            }
          }
        } catch (dbError) {
          console.error('[DOC-GEN] Error fetching Freedom Score from database:', dbError);
        }
      }

      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          document_type: documentType,
          user_name: userName,
          freedom_score: freedomScore,
          format: format
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log(`[CHAT] Document generated successfully: ${data.document.fileName}`);
          return {
            title: data.document.fileName,
            type: documentType,
            downloadUrl: data.downloadUrl
          };
        }
      }
      throw new Error('Failed to generate document');
    } catch (error) {
      console.error('Document generation error:', error);
      return null;
    }
  };

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
      { pattern: /Here's.*(?:plan|document|strategy|report).*for you/i, type: 'document', title: 'Generated Document' }
    ];

    for (const trigger of documentTriggers) {
      if (trigger.pattern.test(content)) {
        console.log(`[CHAT] Detected document generation trigger: ${trigger.type}`);
        return { type: trigger.type, title: trigger.title };
      }
    }
    return null;
  };

  const personalities: Personality[] = [
    { key: 'strategic', name: 'Strategic', icon: '🎯' },
    { key: 'creative', name: 'Creative', icon: '🎨' },
    { key: 'analytical', name: 'Analytical', icon: '📊' },
    { key: 'supportive', name: 'Supportive', icon: '🤝' }
  ];

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 bg-gray-900 text-white flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>
          
          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {chatSessions.length === 0 ? (
              <div className="p-4 text-gray-400 text-sm text-center">
                No previous conversations
              </div>
            ) : (
              <div className="p-2">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className={`group flex items-center justify-between p-3 mb-1 rounded-lg cursor-pointer transition-colors ${
                      session.id === sessionId 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MessageSquare size={14} />
                      <div className="text-sm truncate">{session.title}</div>
                    </div>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="text-blue-500" size={20} />
              AI Business Strategist
              <span className="text-xs font-normal px-2 py-1 rounded bg-gray-100 text-gray-600">
                {aiPersonality.charAt(0).toUpperCase() + aiPersonality.slice(1)} Mode
              </span>
            </h2>
            {userName && (
              <p className="text-sm text-gray-500">Chatting with {userName}</p>
            )}
          </div>
          
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title="Toggle Sidebar"
          >
            <MessageSquare size={16} />
            {showSidebar ? 'Hide' : 'Show'} History
          </button>
          
          <div className="flex gap-2">
            {/* Document Generation Dropdown */}
            <div className="relative group">
              <select
                onChange={async (e) => {
                  if (e.target.value) {
                    const [docType, format] = e.target.value.split('|');
                    const conversationContext = messages
                      .slice(-6) // Last 6 messages for context
                      .map(m => `${m.role}: ${m.content}`)
                      .join('\n\n');
                    
                    // Show loading message
                    const loadingMessage: Message = {
                      id: Date.now(),
                      role: 'assistant', 
                      content: `Generating ${docType.replace('_', ' ')} document in ${format.toUpperCase()} format...`,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, loadingMessage]);
                    
                    try {
                      const response = await fetch('/api/generate-document', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          content: conversationContext,
                          document_type: docType,
                          user_name: userName,
                          format: format
                        })
                      });
                      
                      const data = await response.json();
                      
                      if (data.success) {
                        // Replace loading message with download link
                        setMessages(prev => prev.map(msg => 
                          msg.id === loadingMessage.id ? {
                            ...msg,
                            content: `I've generated a ${docType.replace('_', ' ')} document in ${format.toUpperCase()} format based on our conversation.`,
                            downloadableDocuments: [{
                              title: data.document.fileName,
                              type: format,
                              downloadUrl: data.downloadUrl
                            }]
                          } : msg
                        ));
                      } else {
                        // Replace loading message with error
                        setMessages(prev => prev.map(msg => 
                          msg.id === loadingMessage.id ? {
                            ...msg,
                            content: `Sorry, I couldn't generate the document. Error: ${data.error}`
                          } : msg
                        ));
                      }
                    } catch (error) {
                      console.error('Document generation error:', error);
                      setMessages(prev => prev.map(msg => 
                        msg.id === loadingMessage.id ? {
                          ...msg,
                          content: 'Sorry, there was an error generating the document. Please try again.'
                        } : msg
                      ));
                    }
                    
                    e.target.value = '';
                  }
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white min-w-48"
              >
                <option value="">📄 Generate Document</option>
                <optgroup label="📋 Action Plans">
                  <option value="action_plan|docx">📝 Action Plan (Word)</option>
                  <option value="action_plan|pdf">📄 Action Plan (PDF)</option>
                  <option value="action_plan|xlsx">📊 Action Plan (Excel)</option>
                  <option value="action_plan|pptx">📑 Action Plan (PowerPoint)</option>
                </optgroup>
                <optgroup label="📖 SOPs & Procedures">
                  <option value="sop|docx">📝 SOP (Word)</option>
                  <option value="sop|pdf">📄 SOP (PDF)</option>
                  <option value="sop|md">📄 SOP (Markdown)</option>
                </optgroup>
                <optgroup label="🎯 Strategy Documents">
                  <option value="strategy_document|docx">📝 Strategy Doc (Word)</option>
                  <option value="strategy_document|pdf">📄 Strategy Doc (PDF)</option>
                  <option value="strategy_document|pptx">📑 Strategy Presentation (PowerPoint)</option>
                </optgroup>
                <optgroup label="📊 Data & Reports">
                  <option value="document|xlsx">📊 Spreadsheet (Excel)</option>
                  <option value="document|pdf">📄 Report (PDF)</option>
                  <option value="document|docx">📝 Document (Word)</option>
                </optgroup>
              </select>
              
              {/* Tooltip */}
              <div className="absolute -top-16 left-0 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-56">
                💡 <strong>Two ways to generate documents:</strong><br/>
                1. Select format from this menu<br/>
                2. Ask AI: "Can you create an action plan..."
              </div>
            </div>

            {personalities.map(p => (
              <button
                key={p.key}
                onClick={() => {
                  setAiPersonality(p.key);
                  // Add visual feedback
                  // Add subtle notification instead of emoji message
                  console.log(`[PERSONALITY] Switched to ${p.name} mode`);
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  aiPersonality === p.key 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className="flex items-start gap-2">
                {message.role === 'assistant' && <Bot size={16} className="mt-1 flex-shrink-0" />}
                {message.role === 'user' && <User size={16} className="mt-1 flex-shrink-0" />}
                
                <div className="flex-1">
                  {editingMessageId === message.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full p-2 text-sm border rounded resize-none text-black bg-white"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => saveEditedMessage(message.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm whitespace-pre-line leading-relaxed">
                        {message.content.split('\n').map((paragraph, index) => (
                          <p key={index} className={index > 0 ? 'mt-3' : ''}>{paragraph}</p>
                        ))}
                      </div>
                      {message.role === 'user' && (
                        <button
                          onClick={() => startEditMessage(message.id, message.content)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-400 hover:bg-opacity-20 transition-opacity"
                          title="Edit message"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                  
                  {message.files && message.files.length > 0 && (
                    <div className="mt-2 text-xs opacity-70">
                      📎 {message.files.join(', ')}
                    </div>
                  )}
                  
                  {message.insights && message.insights.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles size={14} className="text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-800">Key Insights</span>
                      </div>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        {message.insights.map((insight, i) => (
                          <li key={i}>• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(suggestion)}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.downloadableDocuments && message.downloadableDocuments.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-1 mb-2">
                        <FileText size={14} className="text-green-600" />
                        <span className="text-xs font-medium text-green-800">Generated Documents</span>
                      </div>
                      <div className="space-y-2">
                        {message.downloadableDocuments.map((doc, i) => (
                          <a
                            key={i}
                            href={doc.downloadUrl}
                            download
                            className="flex items-center gap-2 text-xs text-green-700 hover:text-green-900 hover:underline"
                          >
                            <Download size={12} />
                            <span>{doc.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs opacity-50 mt-1">
                    {message.timestamp instanceof Date 
                      ? message.timestamp.toLocaleTimeString() 
                      : new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
              <div className="flex items-center gap-2">
                <Bot size={16} />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <FileUpload onFilesSelect={setSelectedFiles} />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowFileUpload(false)}
              className="px-3 py-1 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={selectedFiles.length === 0}
              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Upload & Send
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <WhisperVoiceChat 
            onTranscript={handleVoiceTranscript}
            isDisabled={isLoading}
            currentText={input}
            continuous={true}
            language="auto"
          />
          
          <button
            onClick={() => sendMessage()}
            disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}