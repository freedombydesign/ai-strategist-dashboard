'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

interface WhisperVoiceChatProps {
  onTranscript: (transcript: string, replace?: boolean) => void;
  continuous?: boolean;
  isDisabled?: boolean;
  currentText?: string;
  language?: string;
}

export default function WhisperVoiceChat({ 
  onTranscript, 
  continuous = false, 
  isDisabled = false,
  currentText = '',
  language = 'auto'
}: WhisperVoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('EN');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    setRecordingTime(0);
    stopTimer();
  };

  const processAudioWithWhisper = async (audioBlob: Blob) => {
    try {
      console.log('[WHISPER-VOICE] 🎯 Processing audio with OpenAI Whisper');
      console.log('[WHISPER-VOICE] Audio blob size:', audioBlob.size, 'bytes');
      
      setIsProcessing(true);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language === 'auto' ? 'auto' : language);
      
      console.log('[WHISPER-VOICE] 🚀 Sending to Whisper API...');
      
      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[WHISPER-VOICE] ❌ Whisper API error:', errorData);
        throw new Error(errorData.error || 'Whisper transcription failed');
      }
      
      const result = await response.json();
      console.log('[WHISPER-VOICE] ✅ Whisper transcription successful:', {
        text: result.text?.substring(0, 50) + '...',
        language: result.language,
        confidence: result.confidence
      });
      
      if (result.text && result.text.trim()) {
        // Update language indicator
        if (result.language) {
          setCurrentLanguage(result.language.toUpperCase().substring(0, 2));
        }
        
        // Send transcript to parent
        console.log('[WHISPER-VOICE] 📝 Sending transcript to parent:', result.text);
        onTranscript(result.text.trim(), true);
      } else {
        console.log('[WHISPER-VOICE] ⚠️ Empty transcription result');
      }
      
    } catch (error) {
      console.error('[WHISPER-VOICE] ❌ Error processing audio:', error);
      alert('Voice transcription failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      console.log('[WHISPER-VOICE] 🎤 Starting recording...');
      
      // Request microphone access with high-quality settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for Whisper
          channelCount: 1     // Mono for better compression
        }
      });
      
      console.log('[WHISPER-VOICE] ✅ Microphone access granted');
      streamRef.current = stream;
      
      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' // High-quality audio format
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('[WHISPER-VOICE] 📊 Audio chunk collected:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('[WHISPER-VOICE] 🔴 Recording stopped, processing audio...');
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('[WHISPER-VOICE] 📦 Created audio blob:', audioBlob.size, 'bytes');
          
          // Process with Whisper API
          processAudioWithWhisper(audioBlob);
        } else {
          console.log('[WHISPER-VOICE] ⚠️ No audio data collected');
        }
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      resetTimer();
      startTimer();
      
      console.log('[WHISPER-VOICE] ✅ Recording started successfully');
      
    } catch (error) {
      console.error('[WHISPER-VOICE] ❌ Failed to start recording:', error);
      alert('Please allow microphone access to use voice input');
    }
  };

  const stopRecording = () => {
    console.log('[WHISPER-VOICE] 🛑 Stopping recording...');
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      stopTimer();
    };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled || isProcessing}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
            : isProcessing
            ? 'bg-yellow-500 text-white cursor-not-allowed'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isRecording ? 'Stop recording' : isProcessing ? 'Processing...' : 'Start voice recording'}
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isRecording ? (
          <Square size={20} className="fill-current" />
        ) : (
          <Mic size={20} />
        )}
      </button>

      {(isRecording || isProcessing) && (
        <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
          <div className="text-xs text-gray-600 mb-1">
            {isProcessing ? '🤖 Processing with AI...' : '🎤 Recording...'}
          </div>
          
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex space-x-1">
                <div className="w-1 h-3 rounded bg-red-500 animate-pulse"></div>
                <div className="w-1 h-4 rounded bg-red-500 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-2 rounded bg-red-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
            
            <span className={`text-xs font-mono ${isRecording ? 'text-red-600' : 'text-yellow-600'}`}>
              {formatTime(recordingTime)}
            </span>
            
            <span className="text-xs bg-blue-100 px-1.5 py-0.5 rounded text-blue-700 font-medium">
              🌐 {currentLanguage}
            </span>
          </div>
          
          {isProcessing && (
            <div className="text-xs text-gray-500 mt-1">
              Using OpenAI Whisper for multilingual recognition
            </div>
          )}
        </div>
      )}
    </div>
  );
}