import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';
import jsPDF from 'jspdf';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function createWordDocument(content: string, title: string): Document {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const children: Paragraph[] = [];

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# ')) {
      // Main heading
      children.push(new Paragraph({
        text: trimmedLine.replace('# ', ''),
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200, before: 200 }
      }));
    } else if (trimmedLine.startsWith('## ')) {
      // Sub heading
      children.push(new Paragraph({
        text: trimmedLine.replace('## ', ''),
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 150, before: 300 }
      }));
    } else if (trimmedLine.startsWith('### ')) {
      // Sub sub heading
      children.push(new Paragraph({
        text: trimmedLine.replace('### ', ''),
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100, before: 200 }
      }));
    } else if (trimmedLine.startsWith('- [ ] ') || trimmedLine.startsWith('* ')) {
      // Bullet points
      children.push(new Paragraph({
        text: trimmedLine.replace(/^- \[ \] |^\* /, '• '),
        spacing: { after: 100 },
        indent: { left: 360 }
      }));
    } else if (trimmedLine.startsWith('- ')) {
      // Simple bullet points
      children.push(new Paragraph({
        text: '• ' + trimmedLine.replace('- ', ''),
        spacing: { after: 100 },
        indent: { left: 360 }
      }));
    } else if (/^\d+\./.test(trimmedLine)) {
      // Numbered lists
      children.push(new Paragraph({
        text: trimmedLine,
        spacing: { after: 100 },
        indent: { left: 360 }
      }));
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      // Bold text
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace(/\*\*/g, ''), bold: true })],
        spacing: { after: 100 }
      }));
    } else if (trimmedLine === '---') {
      // Separator line - skip or add spacing
      children.push(new Paragraph({ text: '', spacing: { after: 300 } }));
    } else if (trimmedLine.startsWith('*') && trimmedLine.endsWith('*')) {
      // Italic footer text
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace(/\*/g, ''), italics: true })],
        spacing: { before: 200 }
      }));
    } else if (trimmedLine.length > 0) {
      // Regular paragraph
      children.push(new Paragraph({
        text: trimmedLine,
        spacing: { after: 120 }
      }));
    }
  });

  return new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });
}

async function createExcelDocument(content: string, title: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);
  
  // Parse content and create appropriate Excel structure
  const lines = content.split('\n').filter(line => line.trim() !== '');
  let rowIndex = 1;
  
  // Add title row
  worksheet.getCell(`A${rowIndex}`).value = title;
  worksheet.getCell(`A${rowIndex}`).font = { bold: true, size: 16 };
  worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
  rowIndex += 2;
  
  // Process content lines
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# ') || trimmedLine.startsWith('## ')) {
      // Headers
      worksheet.getCell(`A${rowIndex}`).value = trimmedLine.replace(/^#+\s/, '');
      worksheet.getCell(`A${rowIndex}`).font = { bold: true, size: 14 };
      worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
      rowIndex++;
    } else if (trimmedLine.startsWith('- [ ] ') || trimmedLine.startsWith('- ')) {
      // Bullet points as checklist
      const taskText = trimmedLine.replace(/^- \[ \] |^- /, '');
      worksheet.getCell(`A${rowIndex}`).value = taskText;
      worksheet.getCell(`B${rowIndex}`).value = '☐'; // Checkbox
      rowIndex++;
    } else if (trimmedLine.includes('|')) {
      // Table rows
      const cells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell);
      cells.forEach((cell, index) => {
        const colLetter = String.fromCharCode(65 + index); // A, B, C, D...
        worksheet.getCell(`${colLetter}${rowIndex}`).value = cell;
      });
      rowIndex++;
    } else if (trimmedLine.length > 0 && !trimmedLine.startsWith('*') && !trimmedLine.startsWith('---')) {
      // Regular text
      worksheet.getCell(`A${rowIndex}`).value = trimmedLine;
      worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
      rowIndex++;
    }
  });
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 20;
  });
  
  return await workbook.xlsx.writeBuffer() as Buffer;
}

async function createPowerPointDocument(content: string, title: string): Promise<Buffer> {
  const pres = new PptxGenJS();
  
  // Title slide
  const titleSlide = pres.addSlide();
  titleSlide.addText(title, { 
    x: 1, y: 2, w: 8, h: 2, 
    fontSize: 24, bold: true, align: 'center' 
  });
  
  // Parse content into slides
  const lines = content.split('\n').filter(line => line.trim() !== '');
  let currentSlide = null;
  let bulletPoints: string[] = [];
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# ') || trimmedLine.startsWith('## ')) {
      // New slide for each major heading
      if (currentSlide && bulletPoints.length > 0) {
        currentSlide.addText(bulletPoints, { 
          x: 1, y: 2, w: 8, h: 5, 
          bullet: true, fontSize: 16 
        });
        bulletPoints = [];
      }
      
      currentSlide = pres.addSlide();
      const slideTitle = trimmedLine.replace(/^#+\s/, '');
      currentSlide.addText(slideTitle, { 
        x: 1, y: 0.5, w: 8, h: 1, 
        fontSize: 20, bold: true, color: '0066CC' 
      });
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // Bullet points
      bulletPoints.push(trimmedLine.replace(/^[-*]\s/, ''));
    } else if (trimmedLine.length > 0 && !trimmedLine.startsWith('---') && !trimmedLine.startsWith('*')) {
      // Regular text
      if (bulletPoints.length === 0) {
        bulletPoints.push(trimmedLine);
      }
    }
  });
  
  // Add remaining bullet points
  if (currentSlide && bulletPoints.length > 0) {
    currentSlide.addText(bulletPoints, { 
      x: 1, y: 2, w: 8, h: 5, 
      bullet: true, fontSize: 16 
    });
  }
  
  return await pres.writeFile({ outputType: 'arraybuffer' }) as Buffer;
}

async function createPDFDocument(content: string, title: string): Promise<Buffer> {
  const pdf = new jsPDF();
  
  // Title
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.text(title, 20, 30);
  
  // Content
  let yPosition = 50;
  const maxWidth = 170;
  const lineHeight = 7;
  
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# ') || trimmedLine.startsWith('## ')) {
      // Headers
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      const headerText = trimmedLine.replace(/^#+\s/, '');
      pdf.text(headerText, 20, yPosition);
      yPosition += lineHeight + 3;
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // Bullet points
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      const bulletText = '• ' + trimmedLine.replace(/^[-*]\s/, '');
      const splitText = pdf.splitTextToSize(bulletText, maxWidth - 20);
      pdf.text(splitText, 25, yPosition);
      yPosition += splitText.length * lineHeight;
    } else if (trimmedLine.length > 0 && !trimmedLine.startsWith('---') && !trimmedLine.startsWith('*')) {
      // Regular paragraphs
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      const splitText = pdf.splitTextToSize(trimmedLine, maxWidth);
      pdf.text(splitText, 20, yPosition);
      yPosition += splitText.length * lineHeight + 2;
    }
  });
  
  return Buffer.from(pdf.output('arraybuffer'));
}

function autoSelectFormat(content: string, documentType: string): string {
  const contentLower = content.toLowerCase();
  
  // Explicit format requests in content
  if (contentLower.includes('pdf') || contentLower.includes('create a pdf') || 
      contentLower.includes('in pdf format') || contentLower.includes('as a pdf')) {
    return 'pdf';
  }
  
  if (contentLower.includes('excel') || contentLower.includes('spreadsheet') || 
      contentLower.includes('budget') || contentLower.includes('tracking') ||
      contentLower.includes('data') || contentLower.includes('xlsx')) {
    return 'xlsx';
  }
  
  if (contentLower.includes('presentation') || contentLower.includes('slides') ||
      contentLower.includes('powerpoint') || contentLower.includes('pptx')) {
    return 'pptx';
  }
  
  if (contentLower.includes('markdown') || contentLower.includes('technical doc') ||
      contentLower.includes('readme') || contentLower.includes('md format')) {
    return 'md';
  }
  
  // Document type based selection
  switch (documentType) {
    case 'sop':
      // SOPs are often formal documents best shared as PDF
      return 'pdf';
    case 'training_material':
      return 'pdf';
    case 'strategic_plan':
      // Strategic plans with data should be Excel for tracking
      if (contentLower.includes('metric') || contentLower.includes('kpi') || 
          contentLower.includes('budget') || contentLower.includes('target')) {
        return 'xlsx';
      }
      return 'docx';
    default:
      // Context-based selection for general documents
      if (contentLower.includes('new hire') || contentLower.includes('onboard') ||
          contentLower.includes('training') || contentLower.includes('policy')) {
        return 'pdf'; // Formal, shareable documents
      }
      
      if (contentLower.includes('quick') && contentLower.includes('sop')) {
        return 'pdf'; // Quick SOPs should be PDF for formality
      }
      
      return 'docx'; // Default to Word for most text documents
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, document_type, user_name, freedom_score, format } = await request.json();

    if (!content || !document_type) {
      return NextResponse.json({ error: 'Content and document type are required' }, { status: 400 });
    }

    // Auto-select format if not specified, based on content analysis
    let selectedFormat = format;
    if (!selectedFormat) {
      selectedFormat = autoSelectFormat(content, document_type);
    }

    // Validate format
    const supportedFormats = ['docx', 'xlsx', 'pptx', 'pdf', 'md'];
    if (!supportedFormats.includes(selectedFormat)) {
      return NextResponse.json({ error: 'Unsupported format. Supported formats: ' + supportedFormats.join(', ') }, { status: 400 });
    }

    let documentTemplate = '';
    let fileName = '';
    
    // Determine file extension based on format
    const getFileExtension = (fmt: string) => {
      switch (fmt) {
        case 'xlsx': return 'xlsx';
        case 'pptx': return 'pptx'; 
        case 'pdf': return 'pdf';
        case 'md': return 'md';
        default: return 'docx';
      }
    };
    
    switch (document_type) {
      case 'action_plan':
        fileName = `${user_name ? user_name.replace(/\s+/g, '_') + '_' : ''}Business_Action_Plan.${getFileExtension(selectedFormat)}`;
        documentTemplate = `# Business Action Plan${user_name ? ` for ${user_name}` : ''}

Generated on: ${new Date().toLocaleDateString()}

## Executive Summary

${content}

## Key Priorities

Based on your Freedom Score${freedom_score ? ` of ${freedom_score.percent}%` : ''}, here are your top priorities:

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Task 1
- [ ] Task 2

### Week 3-4: Momentum
- [ ] Task 3
- [ ] Task 4

### Month 2: Optimization
- [ ] Task 5
- [ ] Task 6

## Success Metrics

- Metric 1: 
- Metric 2: 
- Metric 3: 

## Next Steps

1. Review this plan weekly
2. Track progress on key metrics
3. Adjust strategies based on results

---
*Generated by AI Business Strategist - Freedom by Design Method*`;
        break;
        
      case 'sop':
        fileName = `${user_name ? user_name.replace(/\s+/g, '_') + '_' : ''}Standard_Operating_Procedure.${getFileExtension(selectedFormat)}`;
        documentTemplate = `# Standard Operating Procedure${user_name ? ` - ${user_name}'s Business` : ''}

**Document Version:** 1.0  
**Created:** ${new Date().toLocaleDateString()}  
**Last Updated:** ${new Date().toLocaleDateString()}

## Purpose

${content}

## Scope

This SOP applies to:
- [ ] All team members
- [ ] Specific departments
- [ ] External contractors

## Procedure Steps

### Step 1: Preparation
- [ ] Task description
- [ ] Required resources
- [ ] Time estimate

### Step 2: Execution
- [ ] Task description
- [ ] Quality checkpoints
- [ ] Documentation required

### Step 3: Quality Control
- [ ] Review criteria
- [ ] Approval process
- [ ] Error handling

## Responsibilities

| Role | Responsibility |
|------|----------------|
| Team Lead | Overall process oversight |
| Team Member | Task execution |
| Quality Control | Final review |

## Resources Required

- Tool/Resource 1
- Tool/Resource 2
- Tool/Resource 3

## Key Performance Indicators

- KPI 1: Target value
- KPI 2: Target value
- KPI 3: Target value

---
*Generated by AI Business Strategist - Freedom by Design Method*`;
        break;
        
      case 'strategy_document':
        fileName = `${user_name ? user_name.replace(/\s+/g, '_') + '_' : ''}Business_Strategy.${getFileExtension(selectedFormat)}`;
        documentTemplate = `# Business Strategy Document${user_name ? ` - ${user_name}` : ''}

**Prepared:** ${new Date().toLocaleDateString()}  
**Freedom Score:** ${freedom_score ? freedom_score.percent + '%' : 'Not assessed'}

## Strategic Overview

${content}

## Current State Analysis

### Strengths
- Strength 1
- Strength 2
- Strength 3

### Opportunities
- Opportunity 1
- Opportunity 2
- Opportunity 3

### Challenges
- Challenge 1
- Challenge 2
- Challenge 3

## Strategic Goals

### Short-term Goals (3-6 months)
1. Goal 1
2. Goal 2
3. Goal 3

### Long-term Goals (6-12 months)
1. Goal 1
2. Goal 2
3. Goal 3

## Implementation Roadmap

### Phase 1: Foundation (Month 1-2)
- [ ] Initiative 1
- [ ] Initiative 2

### Phase 2: Growth (Month 3-4)
- [ ] Initiative 3
- [ ] Initiative 4

### Phase 3: Optimization (Month 5-6)
- [ ] Initiative 5
- [ ] Initiative 6

## Resource Allocation

| Resource | Allocation | Timeline |
|----------|------------|----------|
| Budget | Amount | Period |
| Personnel | Count | Period |
| Technology | Tools | Period |

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| Risk 1 | Low/Med/High | Low/Med/High | Strategy |
| Risk 2 | Low/Med/High | Low/Med/High | Strategy |

## Success Metrics

- Revenue Growth: Target %
- Operational Efficiency: Target %
- Customer Satisfaction: Target %

---
*Generated by AI Business Strategist - Freedom by Design Method*`;
        break;
        
      default:
        fileName = `${user_name ? user_name.replace(/\s+/g, '_') + '_' : ''}Document.${getFileExtension(selectedFormat)}`;
        documentTemplate = `# Business Document${user_name ? ` - ${user_name}` : ''}

**Generated:** ${new Date().toLocaleDateString()}

## Content

${content}

---
*Generated by AI Business Strategist - Freedom by Design Method*`;
    }

    // Use AI to enhance the document with specific details
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a business strategist creating a ${document_type.replace('_', ' ')}. Take the provided template and enhance it with specific, actionable content based on the user's input. Keep the structure but add meaningful details, specific tasks, and realistic timelines. Make it professional and immediately actionable.`
        },
        {
          role: "user",
          content: `Please enhance this ${document_type.replace('_', ' ')} template with specific details based on this context: "${content}"\n\nTemplate:\n${documentTemplate}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const enhancedDocument = completion.choices[0].message.content || documentTemplate;

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let documentBuffer: Buffer;
    let mimeType: string;
    
    // Generate document in the requested format
    switch (selectedFormat) {
      case 'xlsx':
        documentBuffer = await createExcelDocument(enhancedDocument, document_type.replace('_', ' '));
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pptx':
        documentBuffer = await createPowerPointDocument(enhancedDocument, document_type.replace('_', ' '));
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      case 'pdf':
        documentBuffer = await createPDFDocument(enhancedDocument, document_type.replace('_', ' '));
        mimeType = 'application/pdf';
        break;
      case 'md':
        documentBuffer = Buffer.from(enhancedDocument, 'utf8');
        mimeType = 'text/markdown';
        break;
      default: // docx
        const wordDoc = createWordDocument(enhancedDocument, document_type.replace('_', ' '));
        documentBuffer = await Packer.toBuffer(wordDoc);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    console.log(`[DOC-GEN] Generated ${document_type} document: ${fileName} (${documentBuffer.length} bytes) in ${selectedFormat} format`);
    
    // Store document using the download API
    const storeResponse = await fetch(`${request.nextUrl.origin}/api/download-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: documentId,
        content: Array.from(documentBuffer), // Convert buffer to array for JSON serialization
        fileName: fileName,
        mimeType: mimeType
      })
    });

    if (!storeResponse.ok) {
      throw new Error('Failed to store document for download');
    }

    const storeData = await storeResponse.json();
    
    return NextResponse.json({
      success: true,
      document: {
        content: enhancedDocument, // Keep text version for preview
        fileName: fileName,
        mimeType: mimeType,
        format: format,
        createdAt: new Date().toISOString()
      },
      downloadUrl: storeData.downloadUrl,
      documentId: documentId
    });

  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}