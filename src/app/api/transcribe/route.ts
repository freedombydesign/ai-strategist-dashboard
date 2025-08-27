import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save temporarily
    const tempPath = path.join('/tmp', `audio-${Date.now()}.webm`);
    await writeFile(tempPath, buffer);

    // Transcribe with OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: buffer as any,
      model: 'whisper-1',
      language: 'en'
    });

    // Clean up temp file
    await unlink(tempPath).catch(() => {});

    return NextResponse.json({ transcript: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}