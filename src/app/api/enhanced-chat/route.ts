import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// OpenAI client will be initialized inside the POST function

interface PersonalityConfig {
  prompt: string;
  temperature: number;
}

const PERSONALITIES: Record<string, PersonalityConfig> = {
  strategic: {
    prompt: "You're a strategic business consultant focused on the Freedom by Design Method. Be direct, analytical, and focus on high-level strategy, market positioning, and growth opportunities. Help remove bottlenecks and scale businesses.",
    temperature: 0.7
  },
  creative: {
    prompt: "You're a creative business advisor using the Freedom by Design Method. Focus on innovative solutions, brainstorming, and out-of-the-box thinking for scaling businesses. Be inspiring and imaginative while helping remove bottlenecks.",
    temperature: 0.9
  },
  analytical: {
    prompt: "You're a data-driven business analyst using the Freedom by Design Method. Focus on metrics, ROI, and logical problem-solving to help businesses scale and remove bottlenecks. Be precise and methodical.",
    temperature: 0.5
  },
  supportive: {
    prompt: "You're a supportive business mentor using the Freedom by Design Method. Focus on encouragement, practical steps, and building confidence while helping remove bottlenecks. Be warm and empathetic.",
    temperature: 0.8
  }
};

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let body: any;
    
    // Handle both JSON and FormData requests
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        user_id: formData.get('user_id'),
        message: formData.get('message'),
        personality: formData.get('personality') || 'strategic',
        freedom_score: formData.get('freedom_score')
      };
    }

    const { user_id, message, personality = 'strategic', freedom_score } = body;

    if (!user_id || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Build Freedom Score context
    let freedomScoreContext = '';
    if (freedom_score && freedom_score !== 'null') {
      try {
        const scoreData = typeof freedom_score === 'string' ? JSON.parse(freedom_score) : freedom_score;
        if (scoreData && scoreData.percent) {
          freedomScoreContext = `

FREEDOM SCORE CONTEXT:
- Overall Score: ${scoreData.percent}% (${scoreData.totalScore}/60)
- Module Breakdown: ${Object.entries(scoreData.moduleAverages || {}).map(([module, score]) => `${module}: ${score}/10`).join(', ')}
- Top Priority Area: ${scoreData.recommendedOrder?.[0]?.title || 'Not available'}
- Priority Reason: ${scoreData.recommendedOrder?.[0]?.why || 'Focus on biggest bottlenecks first'}

Use this data to provide personalized advice. Reference specific modules and scores when relevant.`;
        }
      } catch (error) {
        console.error('Error parsing Freedom Score:', error);
      }
    }

    // Get personality configuration
    const personalityConfig = PERSONALITIES[personality] || PERSONALITIES.strategic;
    
    // Build enhanced system prompt
    const systemPrompt = `${personalityConfig.prompt}

${freedomScoreContext}

INSTRUCTIONS:
- Keep responses conversational and under 150 words
- Provide actionable insights based on their Freedom Score when available
- Ask clarifying questions about their specific situation
- Be direct about bottlenecks and solutions
- End with 1-2 practical next steps when appropriate

Focus on helping them gain freedom from their business operations.`;

    // Initialize OpenAI client
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: personalityConfig.temperature,
      max_tokens: 300
    });

    const response = completion.choices[0].message.content || 'I apologize, but I encountered an issue generating a response.';

    // Extract insights and suggestions (simple pattern matching)
    const insights: string[] = [];
    const suggestions: string[] = [];
    
    // Look for key insights in the response
    if (response.toLowerCase().includes('bottleneck')) {
      insights.push('Bottleneck identification discussed');
    }
    if (response.toLowerCase().includes('scale') || response.toLowerCase().includes('grow')) {
      insights.push('Growth/scaling opportunities mentioned');
    }
    if (response.toLowerCase().includes('system') || response.toLowerCase().includes('process')) {
      insights.push('Process/system improvements suggested');
    }

    // Generate follow-up suggestions based on personality
    if (personality === 'strategic') {
      suggestions.push('What\'s your biggest operational bottleneck?', 'How much time do you spend on daily operations?');
    } else if (personality === 'creative') {
      suggestions.push('What if we tried a completely different approach?', 'What\'s one rule you could break?');
    } else if (personality === 'analytical') {
      suggestions.push('What metrics are you tracking?', 'Show me your current numbers');
    } else {
      suggestions.push('What small step can you take today?', 'What support do you need?');
    }

    return NextResponse.json({
      reply: response,
      insights: insights.slice(0, 3),
      suggestions: suggestions.slice(0, 2),
      personality,
      freedom_score_used: !!freedomScoreContext
    });

  } catch (error) {
    console.error('Enhanced chat error:', error);
    return NextResponse.json({ 
      error: 'Chat failed: ' + (error as Error).message 
    }, { status: 500 });
  }
}