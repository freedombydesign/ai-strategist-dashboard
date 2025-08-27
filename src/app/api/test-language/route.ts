import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Import comprehensive language detection
    const { LanguageDetector } = await import('../../../lib/languageDetection');
    
    // Test cases
    const testCases = [
      { text: 'Hello how are you today', expected: 'en' },
      { text: 'Hola cómo estás hoy', expected: 'es' },
      { text: 'Bonjour comment allez vous', expected: 'fr' },
      { text: 'Ich bin müde und möchte schlafen', expected: 'de' },
      { text: 'Ciao come stai oggi', expected: 'it' }
    ];
    
    const results = testCases.map(testCase => {
      const result = LanguageDetector.detect(testCase.text);
      return {
        text: testCase.text,
        expected: testCase.expected,
        detected: result.language,
        confidence: result.confidence,
        method: result.method,
        correct: result.language === testCase.expected
      };
    });
    
    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        correct: results.filter(r => r.correct).length,
        accuracy: results.filter(r => r.correct).length / results.length * 100
      }
    });
    
  } catch (error) {
    console.error('Language detection test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}