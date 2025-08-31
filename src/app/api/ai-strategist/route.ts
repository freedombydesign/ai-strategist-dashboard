// src/app/api/ai-strategist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '../../../lib/supabase'
import { getFrameworkContext } from '../../../lib/strategicFrameworks'

// OpenAI client will be initialized inside the POST function

// Task ID to human-readable name mapping
function getTaskName(taskId: string): string {
  const taskMapping: Record<string, string> = {
    // Profitable Service Sprint
    'profit-1-1': 'Analyze Service Profitability',
    'profit-1-2': 'Identify High-Value Clients', 
    'profit-2-1': 'Document Your Golden Service',
    'profit-3-1': 'Create Service Focus Plan',
    
    // Smooth Path Sprint
    'path-1-1': 'Map Your Current Buyer Journey',
    'path-1-2': 'Identify Friction Points',
    'path-2-1': 'Design Smooth Handoffs',
    'path-3-1': 'Test Your New Path',
    
    // Sell Bottleneck Sprint
    'sell-1-1': 'Identify Your Sales Bottlenecks',
    'sell-1-2': 'Create Sales Scripts',
    'sell-2-1': 'Design Sales System',
    'sell-3-1': 'Test Sales Delegation',
    
    // Streamline Delivery Sprint
    'delivery-1-1': 'Map Your Delivery Process',
    'delivery-2-1': 'Create Delivery Templates',
    'delivery-3-1': 'Test Streamlined Delivery',
    
    // Continuous Improve Sprint
    'improve-1-1': 'Set Up Feedback Systems',
    'improve-2-1': 'Create Improvement Process',
    'improve-3-1': 'Schedule Regular Reviews'
  };
  
  return taskMapping[taskId] || taskId;
}

// Add type definitions
interface ConversationHistory {
  message: string
  response: string
  user_message_language?: string
  response_language?: string
  personality_mode?: string
}

interface FreedomScore {
  percent: number
  recommendedOrder: Array<{
    title: string
    why: string
    sprintKey: string
  }>
  moduleAverages: Record<string, number>
  totalScore: number
}

// Removed generic conversation starters - AI should respond naturally to user input

function generateSystemPrompt(userName: string | null, freedom_score: FreedomScore | null, personality = 'strategic', detectedLanguage = 'en', isNewUser = false, isFirstMessage = false, hasFileContext = false, searchContext?: string, frameworkContext?: any, businessContext?: any, sprintProgress?: any, sprintSteps?: any[], completedTasks?: string[], websiteIntelligence?: any, conversationMemory?: any) {
  // Current date context
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Generate completed tasks information that can be used in all return paths
  let completedTasksInfo = '';
  if (completedTasks && completedTasks.length > 0) {
    completedTasksInfo = `\n\n✅ COMPLETED TASKS FROM UI:`;
    completedTasks.forEach((taskId, index) => {
      // Extract just the task ID from the format "sprintId:taskId"
      const actualTaskId = taskId.includes(':') ? taskId.split(':')[1] : taskId;
      const taskName = getTaskName(actualTaskId);
      completedTasksInfo += `\n- ✓ ${taskName}`;
    });
    completedTasksInfo += `\n\n🎯 IMPORTANT: The user has completed ${completedTasks.length} task(s) in their sprint UI. When they ask "What tasks have I completed?" or similar questions, tell them specifically about these completed tasks by name!`;
  }
  
  // Always start fresh for first message of a session
  if (isFirstMessage) {
    if (freedom_score) {
      return `You're Ruth's AI strategist built on the Freedom by Design Method. ${userName ? `Welcome back, ${userName}!` : "Hi! I'm your AI strategist."} I can see you just completed your Freedom Score diagnostic. How can I help you understand your results and next steps? Be warm and welcoming.${completedTasksInfo}`
    } else {
      return `You're Ruth's AI strategist built on the Freedom by Design Method. Hi! I'm your AI strategist, built on the Freedom by Design Method. I'll guide you step-by-step so you can focus on growth while your business runs with less of you. ${!userName ? "First, what's your name? I'd love to personalize our conversation!" : `Great to see you again, ${userName}!`} What brings you here today? Be warm and welcoming.${completedTasksInfo}`
    }
  }

  // Personality-specific traits
  const personalityTraits = {
    strategic: {
      tone: "Be strategic, forward-thinking, and focused on long-term vision. Ask probing questions about goals, market positioning, and competitive advantages. Think like a business strategist.",
      approach: "Focus on high-level planning, strategic positioning, and business transformation. Use frameworks and strategic thinking."
    },
    analytical: {
      tone: "Be data-driven, logical, and detail-oriented. Ask for specific metrics, analyze patterns, and provide evidence-based recommendations. Think like a business analyst.",
      approach: "Focus on numbers, KPIs, processes, and systematic analysis. Request data and provide structured solutions."
    },
    creative: {
      tone: "Be innovative, inspiring, and think outside the box. Encourage brainstorming, creative solutions, and new approaches. Think like a creative consultant.",
      approach: "Focus on innovation, creative problem-solving, and fresh perspectives. Suggest unconventional approaches and encourage experimentation."
    },
    supportive: {
      tone: "Be encouraging, empathetic, and understanding. Focus on emotional intelligence, team dynamics, and personal growth. Think like a supportive coach.",
      approach: "Focus on motivation, team building, work-life balance, and personal development. Be warm and encouraging while providing guidance."
    }
  };

  const currentPersonality = personalityTraits[personality as keyof typeof personalityTraits] || personalityTraits.strategic;

  // Base personality with name usage instructions
  const nameUsage = userName ? `The user's name is ${userName}. Use their name naturally in your responses - not in every sentence, but sprinkle it in conversationally (e.g., "That's a great point, ${userName}", "I understand your concern, ${userName}", or "${userName}, here's what I'd suggest"). Be personable but not overly familiar.` : `The user hasn't shared their name yet. You can occasionally ask "What should I call you?" or "What's your name?" in a natural way during conversation.`

  // Special handling for file uploads
  if (hasFileContext) {
    if (freedom_score) {
      const topSprint = freedom_score.recommendedOrder[0]
      return `You're Ruth's AI strategist. ${nameUsage}

The user has uploaded documents that you CAN analyze.

IMPORTANT: You have full access to the processed document content. DO NOT say you cannot view files - analyze the content provided.

Your job:
1. Thoroughly analyze the uploaded document content
2. Extract key business insights and pain points
3. Connect findings to their #1 priority: "${topSprint.title}" (Freedom Score: ${freedom_score.percent}%)
4. Provide specific, actionable recommendations

Reference specific content from their documents. Be analytical and direct.${completedTasksInfo}`
    } else {
      return `You're Ruth's AI strategist. ${nameUsage}

The user has uploaded documents that you CAN analyze.

IMPORTANT: You have full access to the processed document content. DO NOT say you cannot view files - analyze the content provided.

Analyze the documents to:
1. Identify their biggest business challenges
2. Spot patterns keeping them trapped in operations
3. Recommend specific systems and processes
4. Suggest immediate action items

Reference specific content from their documents.${completedTasksInfo}`
    }
  }

  if (freedom_score) {
    const topSprint = freedom_score.recommendedOrder[0]
    const moduleEntries = Object.entries(freedom_score.moduleAverages) as [string, number][]
    const lowestModule = moduleEntries.sort((a, b) => a[1] - b[1])[0]
    
    // Build framework context
    let frameworkInsights = '';
    if (frameworkContext?.userSprint) {
      frameworkInsights = `\n\nSTRATEGIC FRAMEWORK CONTEXT:
Sprint Focus: ${frameworkContext.userSprint.methodology}
Key Objectives: ${frameworkContext.userSprint.objectives?.slice(0, 2).join(', ')}
Common Challenges: ${frameworkContext.userSprint.common_challenges?.slice(0, 2).join(', ')}`;
    }

    let strategicGuidance = '';
    if (frameworkContext?.strategicGuidance?.length > 0) {
      const topGuidance = frameworkContext.strategicGuidance[0];
      strategicGuidance = `\n\nRELEVANT STRATEGIC GUIDANCE:
${topGuidance.title}: ${topGuidance.content.substring(0, 200)}...`;
    }

    let contextualInsights = '';
    if (frameworkContext?.contextualInsights?.length > 0) {
      contextualInsights = `\n\nCONTEXTUAL INSIGHTS:
${frameworkContext.contextualInsights.slice(0, 2).join('\n')}`;
    }
    
    // Build business context for personalization (conversational style)
    let businessContextStr = '';
    if (businessContext) {
      const ctx = businessContext;
      businessContextStr = `\n\nBUSINESS CONTEXT KNOWLEDGE:
📊 BUSINESS PROFILE:
- Company: ${ctx.business_name ? `"${ctx.business_name}"` : 'their business'} (${ctx.industry || 'industry not specified'})
- Model: ${ctx.business_model || 'B2B'} ${ctx.revenue_model || 'business'}
- Stage: ${ctx.growth_stage || 'Growth'} stage, ${ctx.current_revenue || 'revenue not specified'}, ${ctx.team_size || 'team size not specified'}

🎯 STRATEGIC CONTEXT:
- Primary Goal: "${ctx.primary_goal || 'goal not specified'}"${ctx.timeframe ? ` (Timeline: ${ctx.timeframe})` : ''}
- Biggest Challenge: "${ctx.biggest_challenge || 'challenge not specified'}"
- Success Metrics: "${ctx.success_metrics || 'metrics not specified'}"

🚧 KEY BOTTLENECKS: ${ctx.top_bottlenecks && ctx.top_bottlenecks.length > 0 ? ctx.top_bottlenecks.join(', ') : 'Not specified'}

👥 IDEAL CLIENT PROFILE:
${(() => {
  if (ctx.ideal_client_profile) {
    if (typeof ctx.ideal_client_profile === 'object') {
      return `- Title/Role: ${ctx.ideal_client_profile.title || ctx.ideal_client_profile.niche || 'Not specified'}
- Company Size: ${ctx.ideal_client_profile.companySize || ctx.ideal_client_profile.company_size || 'Not specified'}  
- Pain Points: ${ctx.ideal_client_profile.painPoints || ctx.ideal_client_profile.pain_points || 'Not specified'}`;
    } else {
      return `- Profile: ${ctx.ideal_client_profile}`;
    }
  }
  return '- Not specified';
})()}
- Target Market: ${ctx.target_market || 'Not specified'}

💡 COMPETITIVE POSITIONING:
- Value Proposition: "${ctx.unique_value_proposition || 'Not specified'}"
- Main Competitors: ${ctx.main_competitors || 'Not specified'}
- Competitive Advantage: "${ctx.competitive_advantage || 'Not specified'}"

🔥 PERSONALIZATION INSTRUCTIONS:
1. Reference specific business details naturally (company name, industry, challenges)
2. Connect advice to their primary goal and success metrics
3. Address their specific bottlenecks when relevant
4. Speak to their growth stage and business model
5. Reference their ideal client profile when discussing marketing/sales
6. Act like you've worked with them before and know their business intimately
7. Make recommendations specific to ${ctx.business_name || 'their business'} rather than generic advice

💡 ENHANCED CONTEXT INTEGRATION:
${websiteIntelligence ? `- Website Intelligence Available: ${websiteIntelligence.website_url}
- Brand Tone to Match: ${websiteIntelligence.brand_voice_analysis?.tone || 'Professional'}
- Target Audience: ${websiteIntelligence.target_audience_signals?.slice(0, 3).join(', ') || 'Business professionals'}` : '- No website intelligence - use professional tone'}

${conversationMemory ? `- Conversation Memory: Building on ${conversationMemory.recent_topics?.length || 0} recent topics
- Previous Strategic Decisions: ${conversationMemory.referenced_decisions?.slice(0, 2).join(', ') || 'None referenced'}` : '- Fresh conversation - establish context'}

🎯 RESPONSE TRANSFORMATION RULE: 
Transform generic responses into personalized ones using ${ctx.business_name || 'their business'} context, ${ctx.industry || 'their industry'}, and ${ctx.biggest_challenge || 'their challenges'}.`;
    }

    // Add enhanced website and conversation context
    let enhancedContextStr = '';
    if (websiteIntelligence || conversationMemory) {
      enhancedContextStr += `\n\n🚀 ENHANCED PERSONALIZATION DATA:`;
      
      if (websiteIntelligence) {
        const analysis = websiteIntelligence.analysis || websiteIntelligence;
        
        enhancedContextStr += `\n\nWEBSITE INTELLIGENCE:
- URL: ${websiteIntelligence.website_url}
- Brand Voice: ${analysis.brand_voice_analysis?.tone || analysis.brandVoiceAnalysis?.tone || 'Professional'} tone
- Communication Style: ${analysis.brand_voice_analysis?.communicationStyle || analysis.brandVoiceAnalysis?.communicationStyle || 'Balanced'}
- Key Messages: ${analysis.extracted_messaging?.headlines?.slice(0, 2).join(' | ') || analysis.extractedMessaging?.headlines?.slice(0, 2).join(' | ') || 'Not available'}
- Target Audience: ${analysis.target_audience_signals?.slice(0, 3).join(', ') || analysis.targetAudienceSignals?.slice(0, 3).join(', ') || 'Not specified'}
- Services: ${analysis.service_offerings?.slice(0, 3).join(', ') || analysis.serviceOfferings?.slice(0, 3).join(', ') || 'Not specified'}`;

        // Add enhanced analysis if available
        if (analysis.pageStructureAnalysis) {
          enhancedContextStr += `\n\n🔍 PAGE STRUCTURE ANALYSIS - DEFINITIVE FINDINGS:
- Missing Critical Elements: ${analysis.pageStructureAnalysis.missingElements?.slice(0, 3).join(', ') || 'All key elements are present'}
- Hero Banner Status: ${analysis.pageStructureAnalysis.hasHeroBanner ? 'Present and working' : 'MISSING - Major conversion issue'}
- Social Proof: ${analysis.pageStructureAnalysis.hasTestimonials ? 'Testimonials found' : 'NO testimonials - Trust issue'}
- Pricing Clarity: ${analysis.pageStructureAnalysis.hasPricing ? 'Pricing is clear' : 'UNCLEAR pricing - Friction point'}`;
        }

        if (analysis.conversionOptimization) {
          enhancedContextStr += `\n\n📈 CONVERSION OPTIMIZATION - SPECIFIC FINDINGS:
- Call-to-Action Assessment: ${analysis.conversionOptimization.ctaStrength} CTAs identified
- Value Proposition Clarity: ${analysis.conversionOptimization.valuePropsClarity || 'needs improvement'}
- Trust Signal Count: ${analysis.conversionOptimization.trustSignals?.length || 0} trust elements present
- Critical Improvements Needed: ${analysis.conversionOptimization.recommendations?.slice(0, 2).join('; ') || 'No major issues found'}

🎯 CONVERSION INSTRUCTION: When user asks about their sales page performance, cite these SPECIFIC findings rather than generic advice.`;
        }

        if (analysis.messagingGaps) {
          const gaps = [];
          if (analysis.messagingGaps.problemStatements?.length > 0) gaps.push('Problem clarity');
          if (analysis.messagingGaps.solutionClarification?.length > 0) gaps.push('Solution articulation');
          if (analysis.messagingGaps.benefitCommunication?.length > 0) gaps.push('Benefit communication');
          if (analysis.messagingGaps.urgencyCreation?.length > 0) gaps.push('Urgency creation');
          
          if (gaps.length > 0) {
            enhancedContextStr += `\n\n⚠️ MESSAGING GAPS IDENTIFIED: ${gaps.join(', ')}
🔥 MESSAGING INSTRUCTION: Tell user exactly what messaging is missing from their sales page based on these gaps.`;
          }
        }

        if (analysis.audienceInsights) {
          enhancedContextStr += `\n\n👥 AUDIENCE INSIGHTS - SPECIFIC TO THEIR PAGE:
- Pain Points Addressed: ${analysis.audienceInsights.painPoints?.slice(0, 2).join(', ') || 'General business challenges'}  
- Target Demographics: ${analysis.audienceInsights.demographics?.join(', ') || 'Business professionals'}
- Buyer Journey Stage: ${analysis.audienceInsights.buyingStage || 'awareness'} stage visitors
- Message-Market Match: ${analysis.audienceInsights.languageMatching || 'good'} alignment

🎯 AUDIENCE INSTRUCTION: Reference these specific audience insights when giving sales page feedback.`;
        }

        // Add critical instruction for using website data
        if (analysis.pageStructureAnalysis || analysis.conversionOptimization || analysis.messagingGaps || analysis.audienceInsights) {
          enhancedContextStr += `\n\n🚨 CRITICAL AI INSTRUCTION FOR WEBSITE FEEDBACK:
1. You HAVE analyzed their actual sales page at ${websiteIntelligence.website_url}
2. Give DEFINITIVE statements like "Your page is missing..." or "I found that your..."
3. DO NOT use "if" statements or conditional language
4. Cite SPECIFIC findings from the analysis above
5. When they ask "what's working well" or "what needs improvement" - reference the actual data
6. Be SPECIFIC about what you found, not generic
7. This is THEIR page analysis, not hypothetical advice`;
        }
      }

      if (conversationMemory) {
        enhancedContextStr += `\n\nCONVERSATION MEMORY:
- Recent Discussion Topics: ${conversationMemory.recent_topics?.join(', ') || 'New conversation'}
- Business Evolution: ${conversationMemory.business_stage || 'Current'} stage
- Previous Strategic Decisions: ${conversationMemory.referenced_decisions?.slice(0, 3).join(', ') || 'None yet'}
- Key Insights: ${conversationMemory.key_insights || 'Establishing foundation'}`;
      }
    }
    
    // Add sprint progress context to regular prompt as well
    if (sprintProgress) {
      let stepDetails = '';
      if (sprintSteps && sprintSteps.length > 0) {
        // Show current step (first step if not specified, or find by step_number)
        const currentStepIndex = sprintProgress.step_number ? sprintProgress.step_number - 1 : 0;
        const currentStep = sprintSteps[currentStepIndex] || sprintSteps[0];
        
        stepDetails = `
🎯 CURRENT ACTION STEP: ${currentStepIndex + 1} of ${sprintSteps.length} - "${currentStep.title}"
📝 STEP DESCRIPTION: ${currentStep.description}
⏱️ ESTIMATED TIME: ${currentStep.estimated_minutes} minutes
📅 DAY: ${currentStep.day_number}
📊 PROGRESS: ${Math.round(((currentStepIndex + 1) / sprintSteps.length) * 100)}% through this sprint`;
        
        // Show next steps for context
        if (currentStepIndex + 1 < sprintSteps.length) {
          stepDetails += `\n\n🔮 NEXT STEPS COMING UP:`;
          for (let i = currentStepIndex + 1; i < Math.min(currentStepIndex + 3, sprintSteps.length); i++) {
            const step = sprintSteps[i];
            stepDetails += `\n- Step ${i + 1}: ${step.title} (${step.estimated_minutes}min, Day ${step.day_number})`;
          }
        } else {
          stepDetails += `\n\n🏁 FINAL STEP: You're on the last step of this sprint!`;
        }
        
        // Show completed steps for context
        if (currentStepIndex > 0) {
          stepDetails += `\n\n✅ RECENTLY COMPLETED:`;
          for (let i = Math.max(0, currentStepIndex - 2); i < currentStepIndex; i++) {
            const completedStep = sprintSteps[i];
            stepDetails += `\n- ✓ Step ${i + 1}: ${completedStep.title}`;
          }
        }
        
        // Add completed tasks information if available
        if (completedTasks && completedTasks.length > 0) {
          stepDetails += `\n\n✅ COMPLETED TASKS FROM UI:`;
          completedTasks.forEach((taskId, index) => {
            // Extract just the task ID from the format "sprintId:taskId"
            const actualTaskId = taskId.includes(':') ? taskId.split(':')[1] : taskId;
            const taskName = getTaskName(actualTaskId);
            stepDetails += `\n- ✓ ${taskName}`;
          });
          stepDetails += `\n\n🎯 IMPORTANT: The user has completed ${completedTasks.length} task(s) in their sprint UI. When they ask "What tasks have I completed?" or similar questions, tell them specifically about these completed tasks by name!`;
        }
        
      } else {
        stepDetails = `
🚀 CURRENT ACTION STEP: ${sprintProgress.step_number || 1} - "${sprintProgress.step_title || 'Getting Started'}"
📝 DESCRIPTION: ${sprintProgress.step_title ? `Working on: ${sprintProgress.step_title}` : 'Initializing sprint and setting up first action items'}
⏱️ STATUS: ${sprintProgress.status || 'started'}
📋 NEXT: Ready to begin specific action steps`;
        
        // Add completed tasks information if available
        if (completedTasks && completedTasks.length > 0) {
          stepDetails += `\n\n✅ COMPLETED TASKS FROM UI:`;
          completedTasks.forEach((taskId, index) => {
            // Extract just the task ID from the format "sprintId:taskId"
            const actualTaskId = taskId.includes(':') ? taskId.split(':')[1] : taskId;
            const taskName = getTaskName(actualTaskId);
            stepDetails += `\n- ✓ ${taskName}`;
          });
          stepDetails += `\n\n🎯 IMPORTANT: The user has completed ${completedTasks.length} task(s) in their sprint UI. When they ask "What tasks have I completed?" or similar questions, tell them specifically about these completed tasks by name!`;
        }
      }
      
      // Enhanced context with Freedom Score integration
      let sprintContext = '';
      if (freedom_score && freedom_score.recommendedOrder && freedom_score.recommendedOrder.length > 0) {
        const currentSprintKey = sprintProgress.sprints?.sprint_key;
        const currentSprintIndex = freedom_score.recommendedOrder.findIndex(sprint => sprint.sprintKey === currentSprintKey);
        const currentRecommendedSprint = freedom_score.recommendedOrder[currentSprintIndex] || freedom_score.recommendedOrder[0];
        
        sprintContext = `\n\n🚀 FREEDOM SCORE SPRINT CONTEXT:
🎯 RECOMMENDED SPRINT: #${currentSprintIndex + 1} of ${freedom_score.recommendedOrder.length} - "${currentRecommendedSprint.title}"
💡 WHY THIS SPRINT: ${currentRecommendedSprint.why}
🏆 FREEDOM SCORE: ${freedom_score.percent}% (${freedom_score.totalScore}/60)
📈 PRIORITY LEVEL: ${currentSprintIndex === 0 ? 'TOP PRIORITY' : `Priority ${currentSprintIndex + 1}`}`;
        
        if (freedom_score.recommendedOrder.length > currentSprintIndex + 1) {
          sprintContext += `\n\n🔄 REMAINING SPRINTS:`;
          for (let i = currentSprintIndex + 1; i < Math.min(currentSprintIndex + 3, freedom_score.recommendedOrder.length); i++) {
            const nextSprint = freedom_score.recommendedOrder[i];
            sprintContext += `\n- #${i + 1}: ${nextSprint.title}`;
          }
        }
      }
      
      businessContextStr += `${sprintContext}\n\n📋 CURRENT SPRINT PROGRESS:
🎪 ACTIVE SPRINT: ${sprintProgress.sprints?.title || 'Unknown Sprint'}
📊 STATUS: ${sprintProgress.status || 'started'}${stepDetails}

🔥 CRITICAL AI INSTRUCTIONS:
1. ALWAYS reference their current step number when giving advice
2. Help them complete their CURRENT step before suggesting next actions
3. If they're stuck, break down their current step into smaller micro-tasks
4. Track their progress and celebrate completed steps
5. Connect current step to their Freedom Score improvement
6. Reference how this step addresses their biggest bottleneck`;
    }
    
    return `You're Ruth's AI strategist. ${nameUsage}

CONVERSATION RULES:
1. ALWAYS acknowledge what the user just said before responding
2. Reference their specific words or situation they described
3. Show you understand their unique challenge or question
4. Connect your advice to their actual situation
5. USE the strategic framework data provided to give sophisticated, specific guidance

IMPORTANT: The user's #1 ranked sprint is "${topSprint.title}" - always refer to THIS as their top priority, not any other sprint.

When user mentions specific overwhelm (support tickets, delivery issues, etc.), acknowledge their pain but tie it back to how their #1 sprint "${topSprint.title}" can help solve it.

FREEDOM SCORE DATA YOU HAVE ACCESS TO:
- Overall Score: ${freedom_score.percent}% (${freedom_score.totalScore}/60)
- Top Priority Sprint: "${topSprint.title}"
- Lowest Scoring Area: ${lowestModule[0]} at ${lowestModule[1]}/10
- All Module Scores: ${Object.entries(freedom_score.moduleAverages).map(([mod, score]) => `${mod}: ${score}/10`).join(', ')}

IMPORTANT: You DO have access to their Freedom Score results shown above. Reference these specific numbers and insights.${frameworkInsights}${strategicGuidance}${contextualInsights}

CRITICAL: You are Ruth's experienced business advisor, not an AI assistant. Be conversational, insightful, and ask probing questions before jumping to solutions.

CONVERSATION APPROACH - CRITICAL FLOW:
1. ACKNOWLEDGE their situation with empathy (show you "get it")
2. ASK 2-3 PROBING QUESTIONS to understand their specific pain points and context
3. DIG DEEPER into their challenges before jumping to solutions
4. ONLY AFTER getting deeper context, then provide specific advice
5. Connect everything back to their #1 priority sprint when relevant

MANDATORY: You must ask follow-up questions and explore their situation thoroughly before providing solutions or offering to generate documents. Be curious and consultative, not solution-heavy in first responses.

RESPONSE STYLE:
- Talk like a seasoned consultant who's seen this before
- Use short, punchy paragraphs (2-3 sentences max)
- Balance questions with concrete solutions
- Give specific advice tailored to THEIR situation
- Be direct but supportive

PERSONALITY MODE - ${personality.toUpperCase()}:
${currentPersonality.tone}
${currentPersonality.approach}

LANGUAGE: The user is communicating in ${detectedLanguage === 'en' ? 'English' : detectedLanguage === 'es' ? 'Spanish' : detectedLanguage === 'fr' ? 'French' : detectedLanguage === 'pt' ? 'Portuguese' : 'English'}. ${detectedLanguage !== 'en' ? `Respond in ${detectedLanguage === 'es' ? 'Spanish' : detectedLanguage === 'fr' ? 'French' : detectedLanguage === 'pt' ? 'Portuguese' : 'English'} and adapt your business advice to be culturally relevant.` : 'Respond in English.'}

TRANSLATION MEMORY: You have access to conversation history. If you see language tags like "[I responded in es-ES]" or "[User spoke in fr-FR]", use this to remember what language you used previously. When asked to translate something back to English or another language, look at your conversation history to see what you said before and translate that specific content.

CRITICAL BALANCE: If the user has shared enough context about their problem, GIVE THEM SOLUTIONS. Only ask additional questions if you truly need more information to provide the best advice. When they say "can we come up with a plan now" or express frustration, shift immediately to solution mode.

${businessContextStr}${enhancedContextStr}
${strategicGuidance}
${contextualInsights}${completedTasksInfo}`
  }

  // For returning users without fresh start - let conversation flow naturally
  
  // Build framework context for users without Freedom Scores
  let strategicGuidance = '';
  if (frameworkContext?.strategicGuidance?.length > 0) {
    const topGuidance = frameworkContext.strategicGuidance[0];
    strategicGuidance = `\n\nRELEVANT STRATEGIC GUIDANCE:
${topGuidance.title}: ${topGuidance.content.substring(0, 200)}...`;
  }

  let contextualInsights = '';
  if (frameworkContext?.contextualInsights?.length > 0) {
    contextualInsights = `\n\nCONTEXTUAL INSIGHTS:
${frameworkContext.contextualInsights.slice(0, 2).join('\n')}`;
  }

  // Build business context for personalization (conversational style) - Same enhanced format
  let businessContextStr = '';
  if (businessContext) {
    const ctx = businessContext;
    businessContextStr = `\n\nBUSINESS CONTEXT KNOWLEDGE:
📊 BUSINESS PROFILE:
- Company: ${ctx.business_name ? `"${ctx.business_name}"` : 'their business'} (${ctx.industry || 'industry not specified'})
- Model: ${ctx.business_model || 'B2B'} ${ctx.revenue_model || 'business'}
- Stage: ${ctx.growth_stage || 'Growth'} stage, ${ctx.current_revenue || 'revenue not specified'}, ${ctx.team_size || 'team size not specified'}

🎯 STRATEGIC CONTEXT:
- Primary Goal: "${ctx.primary_goal || 'goal not specified'}"${ctx.timeframe ? ` (Timeline: ${ctx.timeframe})` : ''}
- Biggest Challenge: "${ctx.biggest_challenge || 'challenge not specified'}"
- Success Metrics: "${ctx.success_metrics || 'metrics not specified'}"

🚧 KEY BOTTLENECKS: ${ctx.top_bottlenecks && ctx.top_bottlenecks.length > 0 ? ctx.top_bottlenecks.join(', ') : 'Not specified'}

👥 IDEAL CLIENT PROFILE:
${(() => {
  if (ctx.ideal_client_profile) {
    if (typeof ctx.ideal_client_profile === 'object') {
      return `- Title/Role: ${ctx.ideal_client_profile.title || ctx.ideal_client_profile.niche || 'Not specified'}
- Company Size: ${ctx.ideal_client_profile.companySize || ctx.ideal_client_profile.company_size || 'Not specified'}  
- Pain Points: ${ctx.ideal_client_profile.painPoints || ctx.ideal_client_profile.pain_points || 'Not specified'}`;
    } else {
      return `- Profile: ${ctx.ideal_client_profile}`;
    }
  }
  return '- Not specified';
})()}
- Target Market: ${ctx.target_market || 'Not specified'}

💡 COMPETITIVE POSITIONING:
- Value Proposition: "${ctx.unique_value_proposition || 'Not specified'}"
- Main Competitors: ${ctx.main_competitors || 'Not specified'}
- Competitive Advantage: "${ctx.competitive_advantage || 'Not specified'}"

🔥 PERSONALIZATION INSTRUCTIONS:
1. Reference specific business details naturally (company name, industry, challenges)
2. Connect advice to their primary goal and success metrics
3. Address their specific bottlenecks when relevant
4. Speak to their growth stage and business model
5. Reference their ideal client profile when discussing marketing/sales
6. Act like you've worked with them before and know their business intimately
7. Make recommendations specific to ${ctx.business_name || 'their business'} rather than generic advice`;
  }
  
  // Add sprint progress context
  if (sprintProgress) {
    let stepDetails = '';
    if (sprintSteps && sprintSteps.length > 0) {
      // Show current step (first step if not specified, or find by step_number)
      const currentStepIndex = sprintProgress.step_number ? sprintProgress.step_number - 1 : 0;
      const currentStep = sprintSteps[currentStepIndex] || sprintSteps[0];
      
      stepDetails = `
CURRENT STEP: ${currentStep.title}
STEP DESCRIPTION: ${currentStep.description}
ESTIMATED TIME: ${currentStep.estimated_minutes} minutes
DAY: ${currentStep.day_number}

NEXT STEPS AVAILABLE:`;
      
      // Show next 2-3 steps for context
      for (let i = currentStepIndex; i < Math.min(currentStepIndex + 3, sprintSteps.length); i++) {
        const step = sprintSteps[i];
        stepDetails += `\n- Step ${i + 1}: ${step.title} (${step.estimated_minutes}min)`;
      }
    } else {
      stepDetails = `
🚀 CURRENT ACTION STEP: ${sprintProgress.step_number || 1} - "${sprintProgress.step_title || 'Getting Started'}"
📝 DESCRIPTION: ${sprintProgress.step_title ? `Working on: ${sprintProgress.step_title}` : 'Initializing sprint and setting up first action items'}
⏱️ STATUS: ${sprintProgress.status || 'started'}
📋 NEXT: Ready to begin specific action steps`;
    }
    
    businessContextStr += `\n\n📋 CURRENT SPRINT PROGRESS:
🎪 ACTIVE SPRINT: ${sprintProgress.sprints?.title || 'Unknown Sprint'}
📊 STATUS: ${sprintProgress.status || 'started'}${stepDetails}

🔥 IMPORTANT: You have access to their current sprint and action step details. Always reference their specific step number and help them complete it before moving forward.`;
  }
  
  return `You're Ruth's AI strategist. ${nameUsage}

CONVERSATION RULES:
1. ALWAYS acknowledge what the user just said before responding
2. Reference their specific words or situation they described  
3. Show you understand their unique challenge or question
4. Connect your advice to their actual situation
5. USE the strategic framework data provided to give sophisticated, specific guidance

${strategicGuidance}${contextualInsights}

CONVERSATION APPROACH:
1. ACKNOWLEDGE their situation with empathy  
2. Ask 1-2 clarifying questions if needed to understand context
3. PROVIDE SPECIFIC, ACTIONABLE SOLUTIONS based on what they've shared
4. Be conversational like an experienced consultant

RESPONSE STYLE:
- Talk like Ruth's seasoned business advisor 
- Use short, punchy paragraphs (2-3 sentences max)
- Balance questions with concrete solutions
- Give specific advice tailored to their situation
- Be direct but supportive

PERSONALITY MODE - ${personality.toUpperCase()}:
${currentPersonality.tone}
${currentPersonality.approach}

LANGUAGE: The user is communicating in ${detectedLanguage === 'en' ? 'English' : detectedLanguage === 'es' ? 'Spanish' : detectedLanguage === 'fr' ? 'French' : detectedLanguage === 'pt' ? 'Portuguese' : 'English'}. ${detectedLanguage !== 'en' ? `Respond in ${detectedLanguage === 'es' ? 'Spanish' : detectedLanguage === 'fr' ? 'French' : detectedLanguage === 'pt' ? 'Portuguese' : 'English'} and adapt your business advice to be culturally relevant.` : 'Respond in English.'}

TRANSLATION MEMORY: You have access to conversation history. If you see language tags like "[I responded in es-ES]" or "[User spoke in fr-FR]", use this to remember what language you used previously. When asked to translate something back to English or another language, look at your conversation history to see what you said before and translate that specific content.

IMPORTANT CONTEXT: Today's date is ${currentDate}. When discussing current events, trends, or dates, use this as your reference point.

${userName ? `IMPORTANT: The user's name is ${userName}. You already know their name, so don't ask for it again.` : ''}

CRITICAL: Respond naturally to what the user just said. Don't use generic conversation starters. If they've shared enough context about their problem, GIVE THEM SOLUTIONS. When they ask for a plan or express frustration, shift immediately to solution mode with specific, actionable advice.${completedTasksInfo}`
}

// Function to detect if user is asking for current information
function needsWebSearch(message: string): string | null {
  const searchTriggers = [
    /latest.{0,20}(trends?|news|updates?|information|data)/i,
    /current.{0,20}(market|industry|statistics?|data|pricing|costs?|trends?)/i,
    /recent.{0,20}(developments?|changes?|updates?|research)/i,
    /what.{0,10}(is|are).{0,10}happening.{0,20}(now|today|currently)/i,
    /search.{0,10}(for|about)/i,
    /(2024|2025).{0,20}(trends?|data|statistics?|market|pricing)/i,
    /up.{0,5}to.{0,5}date/i,
    /what.{0,10}(are|is).{0,20}(prices?|costs?|rates?)/i,
    /(current|today's?|this\s+year's?).{0,20}(prices?|market|statistics?)/i,
    /tell\s+me\s+about.{0,20}(current|latest|recent)/i,
    /research.{0,20}(current|latest)/i,
    // More business-specific triggers
    /what.{0,10}(companies|businesses).{0,10}are.{0,10}doing/i,
    /industry.{0,20}(analysis|report|insights?)/i,
    /market.{0,20}(research|analysis|data)/i,
    /competitor.{0,20}(analysis|research)/i,
    /business.{0,20}(trends?|news)/i,
    // AI and technology trends (flexible for typos)
    /what.{0,10}are.{0,10}the.{0,10}current.{0,10}(AI|artificial intelligence|tech|technology).{0,10}tre[an]ds?/i,
    /current.{0,10}(AI|artificial intelligence|tech|technology).{0,10}tre[an]ds?/i,
    /(AI|artificial intelligence|tech|technology).{0,10}tre[an]ds?.{0,10}(for|in).{0,10}(2024|2025)/i,
    /tre[an]ds?.{0,10}(for|in).{0,10}(2024|2025)/i,
    // Also catch just "AI" with years
    /(AI|artificial intelligence).{0,30}(2024|2025)/i,
    // Current political/government information
    /(current|who\s+is\s+the).{0,20}(president|prime minister|leader)/i,
    /who.{0,10}(won|is).{0,10}(president|election)/i
  ];
  
  console.log(`[SEARCH-CHECK] Testing message: "${message}"`);
  
  for (const trigger of searchTriggers) {
    if (trigger.test(message)) {
      console.log(`[SEARCH-TRIGGER] Matched pattern: ${trigger}`);
      return message; // Return the message as search query
    }
  }
  console.log(`[SEARCH-CHECK] No search triggers matched`);
  return null;
}

export async function POST(request: NextRequest) {
  const requestBody = await request.json();
  const { user_id, message, freedom_score, is_fresh_start, file_context, user_name, personality = 'strategic', completed_tasks, website_intelligence } = requestBody;
  
  // 🚨 CRITICAL DIAGNOSTIC - EXECUTE FIRST BEFORE ANY DATABASE CALLS 🚨
  console.log('\n\n🚨🚨🚨 AI-STRATEGIST API CALLED! 🚨🚨🚨');
  console.log('[AI-STRATEGIST] ===== CRITICAL DIAGNOSTIC - EXECUTED FIRST =====');
  console.log('[AI-STRATEGIST] Full request body keys:', Object.keys(requestBody));
  console.log('[AI-STRATEGIST] website_intelligence received:', !!website_intelligence);
  console.log('[AI-STRATEGIST] website_intelligence type:', typeof website_intelligence);
  
  // DIAGNOSTIC: Check if we received website_intelligence data
  if (website_intelligence) {
    console.log('[AI-STRATEGIST] ✅✅✅ WEBSITE INTELLIGENCE DATA RECEIVED - SHOULD GIVE SPECIFIC INSIGHTS');
    console.log('[AI-STRATEGIST] website_intelligence keys:', Object.keys(website_intelligence));
    console.log('[AI-STRATEGIST] website_intelligence.analysis keys:', Object.keys(website_intelligence.analysis || {}));
    console.log('[AI-STRATEGIST] Enhanced analysis check:', {
      hasPageStructure: !!website_intelligence.analysis?.pageStructureAnalysis,
      hasMessagingGaps: !!website_intelligence.analysis?.messagingGaps,
      hasConversionOpt: !!website_intelligence.analysis?.conversionOptimization,
      hasAudienceInsights: !!website_intelligence.analysis?.audienceInsights
    });
  } else {
    console.log('[AI-STRATEGIST] ❌❌❌ NO WEBSITE INTELLIGENCE DATA - This explains generic responses');
    console.log('[AI-STRATEGIST] Available request body keys:', Object.keys(requestBody));
    console.log('[AI-STRATEGIST] has_website_intelligence flag:', requestBody.has_website_intelligence);
    console.log('[AI-STRATEGIST] website_url:', requestBody.website_url);
  }
  
  try {
    console.log('[AI-STRATEGIST] *** API WITH ENHANCED SPRINT STEP TRACKING ***');
    console.log('[AI-STRATEGIST] ===== STARTING MAIN PROCESSING =====');
    
    // TEMPORARY: Manually inject completed task until frontend cache is resolved
    const manualCompletedTasks = user_id === 'f85eba27-6eb9-4933-9459-2517739ef846' ? ['140b8cda-0074-4ca0-a48a-5e310747c18b:profit-1-1'] : []
    const finalCompletedTasks = completed_tasks && completed_tasks.length > 0 ? completed_tasks : manualCompletedTasks
    
    // Force manual injection for testing user to ensure completed tasks are always shown
    const testCompletedTasks = user_id === 'f85eba27-6eb9-4933-9459-2517739ef846' ? 
      ['7a9df959-ab1e-4ef7-b7be-f5efd21fbafc:improve-1-1', '140b8cda-0074-4ca0-a48a-5e310747c18b:profit-1-1', 'f98cf5e2-1656-45e5-83b6-2c48be78c61f:delivery-1-1'] : 
      finalCompletedTasks
    
    console.log('[AI-STRATEGIST] ===== COMPLETED TASKS DEBUG =====');
    console.log('[AI-STRATEGIST] Raw completed_tasks from request:', completed_tasks);
    console.log('[AI-STRATEGIST] Manual completed tasks:', manualCompletedTasks);
    console.log('[AI-STRATEGIST] Final completed tasks:', finalCompletedTasks);
    console.log('[AI-STRATEGIST] Test completed tasks:', testCompletedTasks);
    
    // Import comprehensive language detection
    const { LanguageDetector } = await import('../../../lib/languageDetection');
    
    // Detect language of the message using comprehensive detector
    console.log(`[AI-STRATEGIST] Detecting language for message: "${message.substring(0, 50)}..."`);
    const detectionResult = LanguageDetector.detect(message);
    const detectedLanguage = detectionResult.language;
    console.log(`[AI-STRATEGIST] Language detection result:`, detectionResult);
    console.log('[AI-STRATEGIST] Parsed request body:', { 
      user_id, 
      message: `"${message}"`, 
      freedom_score: !!freedom_score,
      freedom_score_details: freedom_score ? {
        percent: freedom_score.percent,
        totalScore: freedom_score.totalScore,
        hasRecommendedOrder: !!freedom_score.recommendedOrder
      } : null,
      personality,
      detectedLanguage,
      is_fresh_start: is_fresh_start, 
      file_context: !!file_context,
      user_name: user_name || 'none',
      completed_tasks: finalCompletedTasks || []
    });

    console.log('[AI-STRATEGIST] Request data:', {
      user_id,
      message: message?.substring(0, 50) + '...',
      has_freedom_score: !!freedom_score,
      is_fresh_start,
      has_file_context: !!file_context
    });

    if (!user_id || !message) {
      console.error('[AI-STRATEGIST] Missing required fields:', { user_id: !!user_id, message: !!message });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[AI-STRATEGIST] OpenAI API key not found')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Initialize OpenAI client after confirming API key exists
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Explicitly type the history array
    let history: ConversationHistory[] = []
    
    // Only get conversation history if this isn't a fresh start
    if (!is_fresh_start) {
      // Try both tables - first the current ai_conversations, then fall back to memory table
      console.log('[AI-STRATEGIST] Checking ai_conversations table first...')
      const { data: historyData, error: historyError } = await supabase
        .from('ai_conversations')
        .select('message, response')
        .eq('user_id', user_id)
        .order('created_at', { ascending: true })
        .limit(20)

      if (historyError) {
        console.error('[AI-STRATEGIST] ai_conversations table error:', historyError)
      } else {
        history = (historyData as ConversationHistory[]) || []
        console.log(`[AI-STRATEGIST] Found ${history.length} entries in ai_conversations table`)
        console.log('[AI-STRATEGIST] Raw history data sample:', historyData?.slice(0, 2))
      }

      // If no history found in ai_conversations, try the memory table
      if (history.length === 0) {
        console.log('[AI-STRATEGIST] Checking memory table for conversation history...')
        try {
          const { data: memoryData, error: memoryError } = await supabase
            .from('memory')
            .select('content, context')
            .eq('user_id', user_id)
            .order('created_at', { ascending: true })
            .limit(10)

          if (memoryError) {
            console.error('[AI-STRATEGIST] Memory table error:', memoryError)
          } else if (memoryData && memoryData.length > 0) {
            console.log(`[AI-STRATEGIST] Found ${memoryData.length} entries in memory table`)
            // Convert memory entries to conversation format
            history = memoryData.map(mem => ({
              message: mem.context || 'Previous conversation',
              response: mem.content || ''
            }))
          }
        } catch (memoryErr) {
          console.error('[AI-STRATEGIST] Error accessing memory table:', memoryErr)
        }
      }

      console.log(`[AI-STRATEGIST] Final conversation history: ${history.length} entries`)
      if (history.length > 0) {
        console.log('[AI-STRATEGIST] Latest conversation entry:', {
          message: history[history.length - 1]?.message?.substring(0, 50),
          response: history[history.length - 1]?.response?.substring(0, 50)
        })
      }
    }

    const isNewUser = history.length === 0
    const isFirstMessage = message.toLowerCase().includes('hello') || 
                          message.toLowerCase().includes('started a conversation') ||
                          is_fresh_start
    const hasFileContext = !!file_context
    
    // Check if we need to perform a web search
    let searchContext = '';
    console.log('[AI-STRATEGIST] Checking if message needs web search...', { message, isFirstMessage });
    const searchQuery = needsWebSearch(message);
    console.log('[AI-STRATEGIST] Search query result:', searchQuery);
    
    if (searchQuery && !isFirstMessage) {
      console.log('[AI-STRATEGIST] TRIGGERING WEB SEARCH for query:', searchQuery);
      try {
        const searchResponse = await fetch(`${request.nextUrl.origin}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            context: freedom_score ? `User has Freedom Score of ${freedom_score.percent}%` : 'Business strategy inquiry'
          })
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.success) {
            searchContext = `CURRENT WEB SEARCH RESULTS for "${searchQuery}":\n${searchData.searchResults?.map((r: any) => 
              `• ${r.title}: ${r.description} (Source: ${r.url})`
            ).join('\n') || 'No specific results found'}\n\nAI Analysis: ${searchData.aiResponse}\n\n`;
          }
        }
      } catch (searchError) {
        console.log('Search failed, continuing without current data:', searchError);
      }
    }
    
    // Get strategic framework context based on user message and Freedom Score
    let frameworkContext;
    try {
      frameworkContext = await getFrameworkContext(message, freedom_score);
      console.log('[AI-STRATEGIST] Framework context loaded:', {
        hasUserSprint: !!frameworkContext.userSprint,
        guidanceCount: frameworkContext.strategicGuidance.length,
        insightsCount: frameworkContext.contextualInsights.length
      });
    } catch (frameworkError) {
      console.error('[AI-STRATEGIST] Framework context error (continuing without):', frameworkError);
      frameworkContext = {
        relevantModules: [],
        strategicGuidance: [],
        contextualInsights: []
      };
    }
    
    // Extract user name - prioritize frontend-provided name, then detect from message/history
    let userName: string | null = user_name || null // Use frontend's known name first
    
    console.log('[AI-STRATEGIST] *** NAME FIX DEPLOYED - CHECKING USER NAME ***');
    console.log('[AI-STRATEGIST] Looking for user name, frontend provided:', user_name);
    
    // If no frontend name, check current message for name introduction (but be more selective)
    if (!userName) {
      // Only look for explicit name introductions, not casual mentions
      const nameIntroPatterns = [
        /^(?:my name is|i am|i'm|call me|name's)\s+([A-Z][a-zA-Z]{2,})(?:\s|$|\.|\!|\?)/i,
        /^(?:hi|hello),?\s*(?:i'm|i am)\s+([A-Z][a-zA-Z]{2,})(?:\s|$|\.|\!|\?)/i
      ];
      
      for (const pattern of nameIntroPatterns) {
        const currentNameMatch = message.match(pattern);
        if (currentNameMatch && currentNameMatch[1] && currentNameMatch[1].length > 1) {
          const potentialName = currentNameMatch[1];
          // Avoid common words that might be mistaken for names
          const avoidWords = ['drowning', 'struggling', 'busy', 'tired', 'working', 'help', 'lost', 'stuck', 'confused', 'on', 'in', 'at', 'with', 'for', 'about', 'what', 'when', 'where', 'how', 'why'];
          if (!avoidWords.includes(potentialName.toLowerCase()) && potentialName.length >= 3) {
            userName = potentialName;
            console.log('[AI-STRATEGIST] Found name in current message:', userName);
            break;
          }
        }
      }
    }
    
    // If no name in current message, check history
    if (!userName && history.length > 0) {
      console.log('[AI-STRATEGIST] Checking history for name, history length:', history.length);
      for (const conv of history) {
        const nameMatch = conv.message.match(/^(?:i'm|i am|my name is|call me|name's)\s+([a-zA-Z]{3,})/i)
        if (nameMatch) {
          const potentialName = nameMatch[1];
          const avoidWords = ['drowning', 'struggling', 'busy', 'tired', 'working', 'help', 'lost', 'stuck', 'confused', 'on', 'in', 'at', 'with', 'for', 'about'];
          if (!avoidWords.includes(potentialName.toLowerCase())) {
            userName = potentialName;
            console.log('[AI-STRATEGIST] Found name in history:', userName);
            break;
          }
        }
      }
    }
    
    // If still no name, try to get from localStorage (for server-side, this won't work, but helps in client)
    if (!userName) {
      try {
        // This will work when called from client-side
        if (typeof window !== 'undefined') {
          userName = localStorage?.getItem(`user_name_${user_id}`)
        }
      } catch (e) {
        // localStorage not available
      }
    }

    // Fetch business context for personalization
    let businessContext = null;
    try {
      console.log('[AI-STRATEGIST] Fetching business context...');
      const { data: contextData, error: contextError } = await supabase
        .from('business_context')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (contextError && contextError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[AI-STRATEGIST] Error fetching business context:', contextError);
      } else if (contextData) {
        businessContext = contextData;
        console.log('[AI-STRATEGIST] Business context loaded:', {
          business_name: contextData.business_name,
          industry: contextData.industry,
          revenue: contextData.current_revenue,
          has_goals: !!contextData.primary_goal
        });
      } else {
        console.log('[AI-STRATEGIST] No business context found for user');
      }
    } catch (error) {
      console.error('[AI-STRATEGIST] Business context fetch error:', error);
    }

    // Fetch enhanced context data for personalization
    let websiteIntelligence = null;
    let conversationMemory = null;
    
    try {
      console.log('[AI-STRATEGIST] Fetching enhanced context data...');
      
      // Get website intelligence - prioritize request data over database
      if (website_intelligence) {
        websiteIntelligence = website_intelligence;
        console.log('[AI-STRATEGIST] Website intelligence loaded from request:', website_intelligence.website_url);
        console.log('[AI-STRATEGIST] Enhanced analysis available:', {
          pageStructure: !!website_intelligence.analysis?.pageStructureAnalysis,
          messagingGaps: !!website_intelligence.analysis?.messagingGaps,
          conversionOpt: !!website_intelligence.analysis?.conversionOptimization,
          audienceInsights: !!website_intelligence.analysis?.audienceInsights
        });
        console.log('[AI-STRATEGIST] Website intelligence loaded from request:', website_intelligence.website_url);
        console.log('[AI-STRATEGIST] DIAGNOSTIC - Website intelligence structure:', {
          hasAnalysis: !!website_intelligence.analysis,
          analysisKeys: website_intelligence.analysis ? Object.keys(website_intelligence.analysis) : [],
          hasPageStructure: !!website_intelligence.analysis?.pageStructureAnalysis,
          hasMessagingGaps: !!website_intelligence.analysis?.messagingGaps,
          hasConversionOpt: !!website_intelligence.analysis?.conversionOptimization,
          hasAudienceInsights: !!website_intelligence.analysis?.audienceInsights
        });
        
        // DIAGNOSTIC: Log specific enhanced analysis content
        if (website_intelligence.analysis?.pageStructureAnalysis) {
          console.log('[AI-STRATEGIST] DIAGNOSTIC - Page Structure Sample:', JSON.stringify(website_intelligence.analysis.pageStructureAnalysis).substring(0, 200) + '...');
        }
        if (website_intelligence.analysis?.messagingGaps) {
          console.log('[AI-STRATEGIST] DIAGNOSTIC - Messaging Gaps Sample:', JSON.stringify(website_intelligence.analysis.messagingGaps).substring(0, 200) + '...');
        }
      } else {
        // Fallback to database lookup if not provided in request
        const { data: websiteData, error: websiteError } = await supabase
          .from('website_intelligence')
          .select('website_url, brand_voice_analysis, extracted_messaging, target_audience_signals, service_offerings, content_themes')
          .eq('user_id', user_id)
          .eq('status', 'active')
          .order('last_analyzed', { ascending: false })
          .limit(1)
          .single();

        if (websiteError && websiteError.code !== 'PGRST116') {
          console.error('[AI-STRATEGIST] Error fetching website intelligence:', websiteError);
        } else if (websiteData) {
          websiteIntelligence = websiteData;
          console.log('[AI-STRATEGIST] Website intelligence loaded from database:', websiteData.website_url);
        }
      }

      // Get conversation memory context
      const { data: memoryData, error: memoryError } = await supabase
        .from('conversation_memory')
        .select('context_tags, interaction_type, business_stage, key_insights, referenced_decisions, created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (memoryError) {
        console.error('[AI-STRATEGIST] Error fetching conversation memory:', memoryError);
      } else if (memoryData && memoryData.length > 0) {
        // Process memory data for context
        const recentTopics = Array.from(new Set(
          memoryData.flatMap(m => m.context_tags || [])
        )).slice(0, 5);
        
        const referencedDecisions = Array.from(new Set(
          memoryData.flatMap(m => m.referenced_decisions || [])
        )).slice(0, 3);

        const latestBusinessStage = memoryData.find(m => m.business_stage)?.business_stage;
        const keyInsights = memoryData
          .filter(m => m.key_insights && Object.keys(m.key_insights).length > 0)
          .slice(0, 3)
          .map(m => Object.values(m.key_insights).join(', '))
          .join('; ');

        conversationMemory = {
          recent_topics: recentTopics,
          business_stage: latestBusinessStage,
          referenced_decisions: referencedDecisions,
          key_insights: keyInsights || 'Building strategic foundation'
        };
        
        console.log('[AI-STRATEGIST] Conversation memory loaded:', {
          recent_topics: recentTopics.length,
          decisions: referencedDecisions.length,
          stage: latestBusinessStage
        });
      }
      
    } catch (error) {
      console.error('[AI-STRATEGIST] Error fetching enhanced context:', error);
    }

    // Fetch sprint progress for personalization
    let sprintProgress = null;
    let sprintSteps = null;
    try {
      console.log('[AI-STRATEGIST] ========== SPRINT PROGRESS DEBUGGING ==========');
      console.log('[AI-STRATEGIST] Fetching sprint progress for user:', user_id);
      
      // First, let's see ALL user steps for this user
      const { data: allUserSteps, error: allStepsError } = await supabase
        .from('user_steps')
        .select('*, sprints(*)')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
        
      console.log('[AI-STRATEGIST] === ALL USER STEPS ===');
      console.log('[AI-STRATEGIST] Total steps found:', allUserSteps?.length || 0);
      if (allUserSteps && allUserSteps.length > 0) {
        allUserSteps.forEach((step, index) => {
          console.log(`[AI-STRATEGIST] Step ${index + 1}:`, {
            id: step.id,
            sprint_id: step.sprint_id,
            step_number: step.step_number,
            step_title: step.step_title,
            status: step.status,
            created_at: step.created_at,
            sprint_name: step.sprints?.name,
            sprint_title: step.sprints?.client_facing_title
          });
        });
      } else {
        console.log('[AI-STRATEGIST] No user steps found at all!');
      }
      
      // Now try the filtered query
      const { data: progressData, error: progressError } = await supabase
        .from('user_steps')
        .select('*, sprints!inner(*)')
        .eq('user_id', user_id)
        .in('status', ['started', 'in_progress', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);
        
      console.log('[AI-STRATEGIST] === FILTERED QUERY RESULTS ===');
      console.log('[AI-STRATEGIST] Filtered results found:', progressData?.length || 0);

      if (progressError) {
        console.error('[AI-STRATEGIST] Error in filtered query:', progressError);
      } else if (progressData && progressData.length > 0) {
        sprintProgress = progressData[0];
        console.log('[AI-STRATEGIST] ✅ SUCCESS - Found active sprint:', {
          id: sprintProgress.id,
          sprint_id: sprintProgress.sprint_id,
          step_number: sprintProgress.step_number,
          step_title: sprintProgress.step_title,
          status: sprintProgress.status,
          sprint_name: sprintProgress.sprints?.name,
          sprint_title: sprintProgress.sprints?.client_facing_title
        });
        
        // Fetch the steps for this sprint to provide specific guidance
        try {
          const { data: stepsData, error: stepsError } = await supabase
            .from('steps')
            .select('*')
            .eq('sprint_id', sprintProgress.sprint_id)
            .order('day_number')
            .order('order_index');
            
          if (stepsError) {
            console.error('[AI-STRATEGIST] Error fetching sprint steps:', stepsError);
          } else {
            sprintSteps = stepsData || [];
            console.log('[AI-STRATEGIST] Found', sprintSteps.length, 'steps for sprint');
            
            // If no formal steps found, use the task-based system that's actually in use
            if (sprintSteps.length === 0) {
              console.log('[AI-STRATEGIST] ⚠️ No formal steps found, using task-based sprint structure...');
              
              const sprintName = sprintProgress.sprints?.name;
              console.log('[AI-STRATEGIST] Sprint name for task lookup:', sprintName);
              
              // Create step structure based on the actual task system
              if (sprintName === 'profitable_service') {
                sprintSteps = [
                  {
                    id: 'day-1-tasks',
                    title: 'Day 1: Analyze & Identify',
                    description: 'Complete: (1) Analyze Service Profitability [20min], (2) Identify High-Value Clients [15min]',
                    estimated_minutes: 35,
                    day_number: 1,
                    order_index: 0,
                    tasks: ['profit-1-1', 'profit-1-2']
                  },
                  {
                    id: 'day-2-tasks', 
                    title: 'Day 2: Document Process',
                    description: 'Complete: Document Your Golden Service [25min] - Write down every step of your most profitable service delivery process',
                    estimated_minutes: 25,
                    day_number: 2,
                    order_index: 1,
                    tasks: ['profit-2-1']
                  },
                  {
                    id: 'day-3-tasks',
                    title: 'Day 3: Create Focus Plan', 
                    description: 'Complete: Create Service Focus Plan [15min] - Decide what percentage of your time will focus on this profitable service',
                    estimated_minutes: 15,
                    day_number: 3,
                    order_index: 2,
                    tasks: ['profit-3-1']
                  }
                ];
              } else if (sprintName === 'smooth_path') {
                sprintSteps = [
                  {
                    id: 'day-1-tasks',
                    title: 'Day 1: Map & Identify',
                    description: 'Complete: (1) Map Your Current Buyer Journey [20min], (2) Identify Friction Points [15min]',
                    estimated_minutes: 35,
                    day_number: 1,
                    order_index: 0,
                    tasks: ['path-1-1', 'path-1-2']
                  },
                  {
                    id: 'day-2-tasks',
                    title: 'Day 2: Design Smooth Handoffs',
                    description: 'Complete: Design Smooth Handoffs [25min] - Create simple transition processes between each stage',
                    estimated_minutes: 25,
                    day_number: 2,
                    order_index: 1,
                    tasks: ['path-2-1']
                  }
                ];
              } else if (sprintName === 'streamline_delivery') {
                sprintSteps = [
                  {
                    id: 'day-1-tasks',
                    title: 'Day 1: Audit & Streamline',
                    description: 'Focus on streamlining client delivery without losing personal touch',
                    estimated_minutes: 30,
                    day_number: 1,
                    order_index: 0,
                    tasks: ['delivery-1-1']
                  }
                ];
              } else {
                // Fallback for unknown sprints
                sprintSteps = [
                  {
                    id: 'step-1',
                    title: sprintProgress.step_title || 'Getting Started',
                    description: `Working on: ${sprintProgress.sprints?.client_facing_title}`,
                    estimated_minutes: 20,
                    day_number: 1,
                    order_index: 0
                  }
                ];
              }
              
              console.log('[AI-STRATEGIST] ✅ Created', sprintSteps.length, 'task-based steps for', sprintName);
            } else {
              console.log('[AI-STRATEGIST] ✅ Found', sprintSteps.length, 'formal steps in database');
            }
          }
        } catch (error) {
          console.error('[AI-STRATEGIST] Error in steps query:', error);
        }
        
        console.log('[AI-STRATEGIST] Current sprint progress:', {
          sprint_title: sprintProgress.sprints?.title,
          step_number: sprintProgress.step_number || 'Not specified',
          step_title: sprintProgress.step_title || 'Not specified',
          status: sprintProgress.status,
          available_steps: sprintSteps ? sprintSteps.length : 0
        });
      } else {
        console.log('[AI-STRATEGIST] ❌ No active sprints found with status filter');
        
        // Try the most recent sprint regardless of status
        if (allUserSteps && allUserSteps.length > 0) {
          const latestSprint = allUserSteps[0];
          console.log('[AI-STRATEGIST] 🔄 ATTEMPTING AUTO-FIX of latest sprint:', {
            id: latestSprint.id,
            current_status: latestSprint.status,
            current_step_number: latestSprint.step_number,
            current_step_title: latestSprint.step_title
          });
          
          // Try to fix the sprint by updating its status and step info
          try {
            const { data: fixedSprint, error: fixError } = await supabase
              .from('user_steps')
              .update({
                step_number: latestSprint.step_number || 1,
                step_title: latestSprint.step_title || 'Getting Started with Sprint',
                status: 'started',
                updated_at: new Date().toISOString()
              })
              .eq('id', latestSprint.id)
              .select('*, sprints(*)')
              .single();
              
            if (fixError) {
              console.error('[AI-STRATEGIST] ❌ Failed to auto-fix sprint:', fixError);
            } else {
              sprintProgress = fixedSprint;
              console.log('[AI-STRATEGIST] ✅ AUTO-FIXED sprint successfully:', {
                id: sprintProgress.id,
                sprint_id: sprintProgress.sprint_id,
                step_number: sprintProgress.step_number,
                step_title: sprintProgress.step_title,
                status: sprintProgress.status,
                sprint_name: sprintProgress.sprints?.name
              });
            }
          } catch (fixError) {
            console.error('[AI-STRATEGIST] Exception during auto-fix:', fixError);
          }
        } else {
          console.log('[AI-STRATEGIST] ❌ No sprint data found at all for user');
        }
      }
    } catch (error) {
      console.error('[AI-STRATEGIST] Error fetching sprint progress:', error);
    }

    // Generate system prompt with enhanced context
    console.log('[AI-STRATEGIST] Final userName before system prompt:', userName);
    console.log('[AI-STRATEGIST] ========== FINAL CONTEXT SUMMARY ==========');
    console.log('[AI-STRATEGIST] Freedom Score:', freedom_score ? `${freedom_score.percent}%` : 'None');
    console.log('[AI-STRATEGIST] Sprint Progress:', sprintProgress ? {
      id: sprintProgress.id,
      sprint_name: sprintProgress.sprints?.name,
      step_number: sprintProgress.step_number,
      step_title: sprintProgress.step_title,
      status: sprintProgress.status
    } : 'None');
    console.log('[AI-STRATEGIST] Sprint Steps:', sprintSteps ? sprintSteps.length : 'None');
    console.log('[AI-STRATEGIST] Business Context:', businessContext ? 'Available' : 'None');
    console.log('[AI-STRATEGIST] Website Intelligence:', websiteIntelligence ? `Available (${websiteIntelligence.website_url})` : 'None');
    console.log('[AI-STRATEGIST] Conversation Memory:', conversationMemory ? `Available (${conversationMemory.recent_topics?.length || 0} topics)` : 'None');
    console.log('[AI-STRATEGIST] Enhanced Personalization:', (businessContext ? 1 : 0) + (websiteIntelligence ? 1 : 0) + (conversationMemory ? 1 : 0), '/ 3 sources');
    console.log('[AI-STRATEGIST] ================================================');
    
    console.log('[AI-STRATEGIST] Generating system prompt...');
    console.log('[AI-STRATEGIST] ===== SYSTEM PROMPT PARAMETERS =====');
    console.log('[AI-STRATEGIST] finalCompletedTasks being passed:', finalCompletedTasks);
    let systemPrompt;
    try {
      systemPrompt = generateSystemPrompt(
        userName, 
        freedom_score as FreedomScore | null,
        personality,
        detectedLanguage,
        isNewUser, 
        isFirstMessage || is_fresh_start,
        hasFileContext,
        searchContext,
        frameworkContext,
        businessContext,
        sprintProgress,
        sprintSteps,
        testCompletedTasks,
        websiteIntelligence,
        conversationMemory
      );
      console.log('[AI-STRATEGIST] System prompt generated successfully');
    } catch (promptError) {
      console.error('[AI-STRATEGIST] System prompt generation error:', promptError);
      // Fallback to basic prompt
      systemPrompt = `You're Ruth's AI strategist. Be helpful, acknowledge what the user said, and provide business guidance.`;
    }

    // Build messages array properly
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: "system", content: systemPrompt }
    ]

    // Add file context to system message if provided
    if (file_context) {
      messages.push({
        role: "system",
        content: `DOCUMENT CONTEXT: The user has provided the following documents for analysis:\n\n${file_context}\n\nAnalyze this content in relation to their business challenges and Freedom Score results.`
      })
    }
    
    // Add search context to system message if provided
    if (searchContext) {
      messages.push({
        role: "system",
        content: searchContext + "Use this current information to provide up-to-date, accurate responses. Always cite sources when referencing search data."
      })
    }

    // Add conversation history only if not a fresh start
    if (!is_fresh_start && history && history.length > 0) {
      console.log(`[AI-STRATEGIST] Adding ${history.length} conversation history entries to context`)
      for (const conv of history) {
        // Use metadata from database columns, fallback to parsing if needed for old data
        const userMeta = {
          language: conv.user_message_language || 'en',
          personality: null,
          text: conv.message.replace(/^\[Lang:[^\]]+\]\s*/, '') // Clean legacy tags if present
        };
        
        const assistantMeta = {
          language: conv.response_language || 'en', 
          personality: conv.personality_mode || 'strategic',
          text: conv.response.replace(/^\[Lang:[^,]+,Personality:[^\]]+\]\s*/, '').replace(/^\[Lang:[^\]]+\]\s*/, '') // Clean legacy tags if present
        };
        
        const userMsg = userMeta.language !== 'en' 
          ? `[User spoke in ${userMeta.language}] ${userMeta.text}`
          : userMeta.text;
        const assistantMsg = assistantMeta.language !== 'en'
          ? `[I responded in ${assistantMeta.language}] ${assistantMeta.text}`
          : assistantMeta.text;
          
        messages.push({ role: "user", content: userMsg })
        messages.push({ role: "assistant", content: assistantMsg })
      }
      console.log(`[AI-STRATEGIST] Total messages in context: ${messages.length} (including ${history.length * 2} history messages)`)
    } else {
      console.log('[AI-STRATEGIST] No conversation history to add:', {
        is_fresh_start,
        history_length: history.length
      })
    }

    // Add current message
    messages.push({ role: "user", content: message })

    console.log('[AI-STRATEGIST] Preparing OpenAI request with', messages.length, 'messages', is_fresh_start ? '(FRESH START)' : '', hasFileContext ? '(WITH FILES)' : '');

    // Dynamic context adaptation
    const isComplexQuery = message.length > 200 || message.includes('?') || searchContext;
    const isUrgentQuery = message.toLowerCase().includes('urgent') || message.toLowerCase().includes('asap') || message.toLowerCase().includes('help');
    const conversationDepth = history.length;
    
    // Adaptive AI parameters based on context
    let adaptedTemperature = 0.6;
    let adaptedMaxTokens = 300;
    let adaptedPresence = 0.3;
    
    if (hasFileContext) {
      adaptedTemperature = 0.2;
      adaptedMaxTokens = 600;
      adaptedPresence = 0.1;
    } else if (searchContext) {
      adaptedTemperature = 0.4;
      adaptedMaxTokens = 450;
      adaptedPresence = 0.2;
    } else if (isComplexQuery) {
      adaptedTemperature = 0.4 + (Math.random() * 0.2);
      adaptedMaxTokens = 400;
      adaptedPresence = 0.2;
    } else if (isUrgentQuery) {
      adaptedTemperature = 0.3;
      adaptedMaxTokens = 350;
      adaptedPresence = 0.4;
    } else if (conversationDepth > 10) {
      adaptedTemperature = 0.5 + (Math.random() * 0.4);
      adaptedMaxTokens = 320;
      adaptedPresence = 0.3;
    }

    console.log(`[AI-STRATEGIST] OpenAI parameters - Complex: ${isComplexQuery}, Urgent: ${isUrgentQuery}, Depth: ${conversationDepth}, Temp: ${adaptedTemperature.toFixed(2)}, Tokens: ${adaptedMaxTokens}`);

    // Query OpenAI with comprehensive error handling
    let completion;
    try {
      console.log('[AI-STRATEGIST] Calling OpenAI API...');
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: adaptedTemperature,
        max_tokens: adaptedMaxTokens,
        presence_penalty: adaptedPresence,
        frequency_penalty: 0.3
      });
      console.log('[AI-STRATEGIST] OpenAI API call successful');
    } catch (openaiError) {
      console.error('[AI-STRATEGIST] OpenAI API error:', openaiError);
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable',
        details: openaiError instanceof Error ? openaiError.message : 'OpenAI API error'
      }, { status: 503 });
    }

    const rawBotReply = completion.choices[0].message.content || "I'm here to help! What's your biggest business challenge right now?"
    
    // Clean the response by removing any embedded metadata tags before sending to user
    const botReply = rawBotReply
      .replace(/^\[Lang:[^\]]+,Personality:[^\]]+\]\s*/, '') // Remove language/personality metadata
      .replace(/^\[Lang:[^\]]+\]\s*/, '') // Remove language-only metadata
      .replace(/^\[I responded in [^\]]+\]\s*/, '') // Remove translation memory tags
      .replace(/^\[[^\]]+\]\s*/, '') // Remove any other bracket tags
      .trim();
    
    console.log('[AI-STRATEGIST] Raw bot reply:', rawBotReply?.substring(0, 100) + '...');
    console.log('[AI-STRATEGIST] Cleaned bot reply:', botReply?.substring(0, 100) + '...');

    // Save conversation to Supabase (create new conversation thread for fresh starts)
    // Save with existing schema - add language info in JSON format or as text
    const saveData = {
      user_id: is_fresh_start ? `${user_id}-${Date.now()}` : user_id,
      message: message, // Don't embed metadata - save clean message
      response: botReply, // Don't embed metadata - save clean response
      freedom_score: freedom_score,
      user_message_language: detectedLanguage,
      response_language: detectedLanguage,
      personality_mode: personality
    }

    // Store in enhanced conversation memory system
    try {
      // Import conversation memory service dynamically
      const { conversationMemoryService } = await import('../../../services/conversationMemoryService');
      
      // Generate conversation ID
      const conversationId = conversationMemoryService.generateConversationId();
      
      // Extract context tags and interaction type
      const contextTags = conversationMemoryService.extractContextTags(message, botReply);
      const interactionType = conversationMemoryService.determineInteractionType(message, botReply);
      const priorityScore = conversationMemoryService.calculatePriorityScore(message, botReply, contextTags);
      
      // Store in conversation memory
      await conversationMemoryService.storeConversation({
        user_id,
        conversation_id: conversationId,
        message,
        response: botReply,
        context_tags: contextTags,
        interaction_type: interactionType,
        business_stage: businessContext?.growth_stage,
        key_insights: {
          ai_response_type: interactionType,
          business_context_used: !!businessContext,
          website_intelligence_used: !!websiteIntelligence,
          sprint_context_available: !!sprintProgress
        },
        referenced_decisions: conversationMemory?.referenced_decisions || [],
        priority_score: priorityScore,
        metadata: {
          personality_mode: personality,
          has_freedom_score: !!freedom_score,
          completed_tasks_count: testCompletedTasks.length,
          fresh_start: is_fresh_start
        }
      });
      
      console.log('[AI-STRATEGIST] Conversation stored in memory system with tags:', contextTags);
    } catch (memoryError) {
      console.error('[AI-STRATEGIST] Error storing conversation memory:', memoryError);
      // Continue with regular save even if memory storage fails
    }

    const { error: saveError } = await supabase
      .from('ai_conversations')
      .insert(saveData)

    if (saveError) {
      console.error('Error saving conversation:', saveError)
      // Don't fail the request if save fails
    }

    return NextResponse.json({ reply: botReply })

  } catch (error) {
    console.error('AI Strategist error:', error)
    return NextResponse.json({ 
      error: 'Failed to get AI response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}