import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[WHISPER] Processing audio transcription request');
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'auto';
    
    if (!audioFile) {
      console.error('[WHISPER] No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    console.log('[WHISPER] Audio file details:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      requestedLanguage: language
    });
    
    // Check OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('[WHISPER] OpenAI API key not found');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    
    // Prepare form data for OpenAI Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    
    // Set language if specified (otherwise OpenAI auto-detects)
    if (language && language !== 'auto') {
      whisperFormData.append('language', language);
    }
    
    console.log('[WHISPER] Calling OpenAI Whisper API...');
    
    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: whisperFormData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WHISPER] OpenAI API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Whisper API error', 
        details: errorText 
      }, { status: response.status });
    }
    
    const transcription = await response.json();
    console.log('[WHISPER] Transcription successful:', {
      text: transcription.text?.substring(0, 100) + '...',
      language: transcription.language || 'auto-detected'
    });
    
    return NextResponse.json({
      success: true,
      text: transcription.text,
      language: transcription.language || 'unknown',
      confidence: 1.0 // Whisper doesn't provide confidence scores
    });
    
  } catch (error) {
    console.error('[WHISPER] Transcription error:', error);
    return NextResponse.json({
      error: 'Transcription failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}