import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import mammoth from 'mammoth';

export const runtime = 'nodejs';

interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  processed: boolean;
  content?: string;
  error?: string;
}

// Safe OpenAI client initialization
function getOpenAIClient(): OpenAI | null {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable not found');
      return null;
    }
    console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    return null;
  }
}

async function processImage(file: File): Promise<string> {
  try {
    console.log(`[IMAGE] Processing ${file.name} (${file.size} bytes)`);
    
    const openai = getOpenAIClient();
    if (!openai) {
      return `📊 IMAGE FILE (${file.name}): Image uploaded successfully but OpenAI analysis unavailable. Please configure OPENAI_API_KEY.`;
    }

    if (file.size > 25 * 1024 * 1024) {
      return `📊 IMAGE FILE (${file.name}): Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size: 25MB.`;
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: 'Analyze this business image thoroughly. Extract any text, describe charts/diagrams, identify processes, and provide detailed business insights.' 
          },
          { 
            type: 'image_url', 
            image_url: { url: base64Image } 
          }
        ]
      }],
      max_tokens: 1000
    });
    
    const content = response.choices[0]?.message?.content || 'No analysis generated';
    return `📊 IMAGE ANALYSIS (${file.name}):\n${content}`;
    
  } catch (error) {
    console.error(`[IMAGE] Error processing ${file.name}:`, error);
    return `📊 IMAGE FILE (${file.name}): Image uploaded successfully but analysis failed - ${(error as Error).message}`;
  }
}

async function processAudio(file: File): Promise<string> {
  try {
    console.log(`[AUDIO] Processing ${file.name} (${file.size} bytes)`);
    
    const openai = getOpenAIClient();
    if (!openai) {
      return `🎵 AUDIO FILE (${file.name}): Audio uploaded successfully but transcription unavailable. Please configure OPENAI_API_KEY.`;
    }

    if (file.size > 25 * 1024 * 1024) {
      return `🎵 AUDIO FILE (${file.name}): Audio too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size: 25MB.`;
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const audioFile = new File([buffer], file.name, { type: file.type });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1'
    });
    
    return `🎵 AUDIO TRANSCRIPTION (${file.name}):\n${transcription.text}`;
    
  } catch (error) {
    console.error(`[AUDIO] Error processing ${file.name}:`, error);
    return `🎵 AUDIO FILE (${file.name}): Audio uploaded successfully but transcription failed - ${(error as Error).message}`;
  }
}

async function processVideo(file: File): Promise<string> {
  try {
    console.log(`[VIDEO] Processing ${file.name} (${file.size} bytes)`);
    
    const openai = getOpenAIClient();
    if (!openai) {
      return `🎬 VIDEO FILE (${file.name}): Video uploaded successfully but transcription unavailable. Please configure OPENAI_API_KEY.`;
    }

    if (file.size > 25 * 1024 * 1024) {
      return `🎬 VIDEO FILE (${file.name}): Video too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size: 25MB.`;
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const audioFile = new File([buffer], file.name, { type: file.type });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1'
    });
    
    return `🎬 VIDEO TRANSCRIPTION (${file.name}):\n${transcription.text}`;
    
  } catch (error) {
    console.error(`[VIDEO] Error processing ${file.name}:`, error);
    return `🎬 VIDEO FILE (${file.name}): Video uploaded successfully but transcription failed - ${(error as Error).message}`;
  }
}

async function processPDF(file: File): Promise<string> {
  try {
    console.log(`[PDF] Processing ${file.name} (${file.size} bytes)`);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      // Dynamic import to avoid startup issues with pdf-parse
      const pdf = (await import('pdf-parse')).default;
      
      const pdfData = await pdf(buffer);
      
      if (!pdfData.text || pdfData.text.trim().length < 20) {
        return `📄 PDF FILE (${file.name}): PDF uploaded successfully but contains minimal extractable text. May be image-based or password protected.`;
      }
      
      const cleanText = pdfData.text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      const truncated = cleanText.substring(0, 4000);
      
      return `📄 PDF CONTENT (${file.name}):\n${truncated}${cleanText.length > 4000 ? `\n\n[Document truncated - full content is ${cleanText.length} characters]` : ''}`;
      
    } catch (pdfError) {
      console.error(`[PDF] PDF parsing failed for ${file.name}:`, pdfError);
      
      // Provide useful fallback information
      return `📄 PDF FILE (${file.name}): PDF uploaded successfully (${(file.size / 1024 / 1024).toFixed(1)}MB). 
        
Note: Automatic text extraction is currently unavailable due to a library issue. To analyze this PDF:
1. Please describe the key content or paste relevant text
2. For image-based PDFs, consider converting to images
3. For form data, export as CSV or text format

The PDF has been received and can be processed manually.`;
    }
    
  } catch (error) {
    console.error(`[PDF] Critical error processing ${file.name}:`, error);
    return `📄 PDF FILE (${file.name}): PDF uploaded successfully but processing encountered an error. Please describe the content for manual analysis.`;
  }
}

async function processDocument(file: File): Promise<string> {
  try {
    console.log(`[DOC] Processing ${file.name} (${file.size} bytes)`);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const result = await mammoth.extractRawText({ buffer });
    
    if (!result.value || result.value.trim().length < 20) {
      return `📝 WORD DOCUMENT (${file.name}): Document uploaded but contains minimal extractable text.`;
    }
    
    const cleanText = result.value
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    const truncated = cleanText.substring(0, 4000);
    
    return `📝 WORD DOCUMENT (${file.name}):\n${truncated}${cleanText.length > 4000 ? `\n\n[Document truncated - full content is ${cleanText.length} characters]` : ''}`;
    
  } catch (error) {
    console.error(`[DOC] Error processing ${file.name}:`, error);
    return `📝 WORD DOCUMENT (${file.name}): Document uploaded successfully but text extraction failed - ${(error as Error).message}`;
  }
}

async function processText(file: File): Promise<string> {
  try {
    console.log(`[TXT] Processing ${file.name} (${file.size} bytes)`);
    
    const text = await file.text();
    
    if (!text || text.trim().length < 10) {
      return `📄 TEXT FILE (${file.name}): Text file uploaded but appears to be empty.`;
    }
    
    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    const truncated = cleanText.substring(0, 4000);
    
    return `📄 TEXT CONTENT (${file.name}):\n${truncated}${cleanText.length > 4000 ? `\n\n[Text truncated - full content is ${cleanText.length} characters]` : ''}`;
    
  } catch (error) {
    console.error(`[TXT] Error processing ${file.name}:`, error);
    return `📄 TEXT FILE (${file.name}): Text file uploaded successfully but reading failed - ${(error as Error).message}`;
  }
}

async function processCSV(file: File): Promise<string> {
  try {
    console.log(`[CSV] Processing ${file.name} (${file.size} bytes)`);
    
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return `📊 CSV FILE (${file.name}): CSV file uploaded but appears to be empty.`;
    }
    
    if (lines.length === 1) {
      return `📊 CSV FILE (${file.name}): CSV contains only headers: ${lines[0]}`;
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1, Math.min(11, lines.length));
    
    let content = `📊 CSV ANALYSIS (${file.name}):\n`;
    content += `Total rows: ${lines.length - 1}\n`;
    content += `Columns (${headers.length}): ${headers.join(', ')}\n\n`;
    content += `Sample data (first ${Math.min(10, dataRows.length)} rows):\n`;
    
    dataRows.forEach((row, idx) => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      content += `Row ${idx + 2}: ${values.join(' | ')}\n`;
    });
    
    if (lines.length > 11) {
      content += `\n... and ${lines.length - 11} more rows\n`;
    }
    
    return content;
    
  } catch (error) {
    console.error(`[CSV] Error processing ${file.name}:`, error);
    return `📊 CSV FILE (${file.name}): CSV file uploaded successfully but parsing failed - ${(error as Error).message}`;
  }
}

async function processFile(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  console.log(`[PROCESS] ${file.name} - Type: ${fileType}, Size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  
  try {
    if (fileType.startsWith('image/')) {
      return await processImage(file);
    } else if (fileType.startsWith('audio/')) {
      return await processAudio(file);
    } else if (fileType.startsWith('video/')) {
      return await processVideo(file);
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await processPDF(file);
    } else if (
      fileType.includes('document') || 
      fileType.includes('wordprocessingml') ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      return await processDocument(file);
    } else if (fileName.endsWith('.csv') || fileType === 'text/csv') {
      return await processCSV(file);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await processText(file);
    } else if (
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      fileType.includes('spreadsheet')
    ) {
      return `📈 EXCEL SPREADSHEET (${file.name}): Spreadsheet uploaded successfully (${(file.size / 1024 / 1024).toFixed(1)}MB). For detailed analysis, please export key sheets as CSV format.`;
    } else if (
      fileName.endsWith('.pptx') ||
      fileName.endsWith('.ppt') ||
      fileType.includes('presentation')
    ) {
      return `📽️ POWERPOINT PRESENTATION (${file.name}): Presentation uploaded successfully (${(file.size / 1024 / 1024).toFixed(1)}MB). For detailed analysis, please export key slides as images or describe main points.`;
    } else {
      return `❓ UNKNOWN FILE (${file.name}): File uploaded but type '${fileType}' not supported for automatic processing. Please describe the content for analysis.`;
    }
  } catch (error) {
    console.error(`[PROCESS] Critical error with ${file.name}:`, error);
    return `❌ PROCESSING ERROR (${file.name}): ${(error as Error).message}`;
  }
}

export async function POST(request: NextRequest) {
  console.log('\n=== FILE PROCESSING REQUEST ===');
  
  try {
    // Parse form data first
    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('Form data parsing failed:', formError);
      return NextResponse.json({
        success: false,
        error: 'Invalid form data: ' + (formError as Error).message
      }, { status: 400 });
    }
    
    const files = formData.getAll('files') as File[];
    console.log(`Received ${files.length} files:`, files.map(f => `${f.name} (${f.type})`));
    
    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided'
      }, { status: 400 });
    }
    
    const processedFiles: string[] = [];
    const fileDetails: ProcessedFile[] = [];
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!(file instanceof File)) {
        console.log(`Skipping invalid file at index ${i}`);
        continue;
      }
      
      try {
        console.log(`\n--- Processing ${i + 1}/${files.length}: ${file.name} ---`);
        
        const processed = await processFile(file);
        
        processedFiles.push(processed);
        fileDetails.push({
          name: file.name,
          type: file.type,
          size: file.size,
          processed: true,
          content: processed
        });
        successCount++;
        
        console.log(`✅ SUCCESS: ${file.name}`);
        
      } catch (error) {
        console.error(`❌ FAILED: ${file.name} -`, error);
        
        const errorContent = `❌ ERROR (${file.name}): Processing failed - ${(error as Error).message}`;
        processedFiles.push(errorContent);
        fileDetails.push({
          name: file.name,
          type: file.type,
          size: file.size,
          processed: false,
          error: (error as Error).message
        });
      }
      
      // Small delay between files
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const response = {
      success: true,
      processedFiles,
      fileDetails,
      count: processedFiles.length,
      successCount,
      totalFiles: files.length,
      summary: `Successfully processed ${successCount} out of ${files.length} files`,
      timestamp: new Date().toISOString()
    };
    
    console.log('=== PROCESSING COMPLETE ===');
    console.log(`Summary: ${response.summary}`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('=== CRITICAL SERVER ERROR ===', error);
    return NextResponse.json({
      success: false,
      error: `Server error: ${(error as Error).message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}