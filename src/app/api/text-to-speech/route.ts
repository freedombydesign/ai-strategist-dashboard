import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// OpenAI client will be initialized inside the POST function

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'alloy' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Initialize OpenAI client
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Text-to-speech failed' }, { status: 500 });
  }
}