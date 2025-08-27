import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for temporary document storage
// In production, you'd use Redis, database, or file system
const documentStore = new Map<string, {
  content: string | number[]; // Support both text and binary data
  fileName: string;
  mimeType: string;
  createdAt: number;
}>();

// Clean up expired documents every 10 minutes
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [id, doc] of documentStore.entries()) {
    if (now - doc.createdAt > oneHour) {
      documentStore.delete(id);
    }
  }
}, 10 * 60 * 1000);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    const fileName = searchParams.get('fileName');

    console.log(`[DOWNLOAD] Request for document ID: ${documentId}, fileName: ${fileName}`);

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Try to retrieve document from store
    const storedDoc = documentStore.get(documentId);
    
    if (!storedDoc) {
      console.log(`[DOWNLOAD] Document not found: ${documentId}`);
      return NextResponse.json({ error: 'Document not found or expired' }, { status: 404 });
    }

    const contentSize = Array.isArray(storedDoc.content) ? storedDoc.content.length : storedDoc.content.length;
    const contentUnit = Array.isArray(storedDoc.content) ? 'bytes' : 'chars';
    console.log(`[DOWNLOAD] Found document: ${storedDoc.fileName} (${contentSize} ${contentUnit})`);

    // Determine content type
    let contentType = storedDoc.mimeType || 'text/plain';
    const fileExtension = storedDoc.fileName.split('.').pop()?.toLowerCase();
    
    switch (fileExtension) {
      case 'md':
        contentType = 'text/markdown';
        break;
      case 'txt':
        contentType = 'text/plain';
        break;
      case 'json':
        contentType = 'application/json';
        break;
      case 'csv':
        contentType = 'text/csv';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      default:
        contentType = storedDoc.mimeType || 'text/plain';
    }

    // Handle binary data (Word documents) vs text data
    let responseContent: string | Buffer;
    let contentLength: number;
    
    if (Array.isArray(storedDoc.content)) {
      // Binary data from Word document
      responseContent = Buffer.from(storedDoc.content);
      contentLength = responseContent.length;
    } else {
      // Text content
      responseContent = storedDoc.content;
      contentLength = storedDoc.content.length;
    }

    // Create response with file download
    const response = new NextResponse(responseContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${storedDoc.fileName}"`,
        'Content-Length': contentLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

    // Clean up document after successful download (after a delay to allow download to complete)
    setTimeout(() => {
      documentStore.delete(documentId);
      console.log(`[DOWNLOAD] Cleaned up document: ${documentId}`);
    }, 10000); // Delete after 10 seconds

    return response;

  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json({
      error: 'Failed to download document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { documentId, content, fileName, mimeType } = await request.json();

    if (!documentId || !content || !fileName) {
      return NextResponse.json({ error: 'Document ID, content, and file name are required' }, { status: 400 });
    }

    const contentSize = Array.isArray(content) ? content.length : content.length;
    const contentUnit = Array.isArray(content) ? 'bytes' : 'chars';
    console.log(`[DOWNLOAD] Storing document: ${fileName} (${contentSize} ${contentUnit}) with ID: ${documentId}`);

    // Store document temporarily with timestamp
    documentStore.set(documentId, {
      content,
      fileName,
      mimeType: mimeType || 'text/plain',
      createdAt: Date.now()
    });

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/download-document?id=${documentId}`,
      documentId: documentId,
      fileName: fileName,
      message: 'Document prepared for download'
    });

  } catch (error) {
    console.error('Document preparation error:', error);
    return NextResponse.json({
      error: 'Failed to prepare document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}