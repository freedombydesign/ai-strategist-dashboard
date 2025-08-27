// Strategic Frameworks Service - Database Integration for AI Enhancement
import { supabase } from './supabase';

interface Sprint {
  id: number;
  sprint_key: string;
  name: string;
  full_title: string;
  description: string;
  methodology: string;
  week_number: number;
  objectives: string[];
  key_strategies: string[];
  common_challenges: string[];
  success_indicators: string[];
  tools_resources: string[];
}

interface FrameworkModule {
  id: number;
  module_key: string;
  name: string;
  full_title: string;
  description: string;
  focus_area: string;
  assessment_criteria: string[];
  improvement_strategies: string[];
  related_sprint_key: string;
}

interface StrategicGuidance {
  id: number;
  guidance_type: 'challenge' | 'solution' | 'methodology' | 'best_practice';
  category: string;
  title: string;
  content: string;
  context_tags: string[];
  related_sprint_key?: string;
  related_module_key?: string;
  priority: number;
}

interface FrameworkContext {
  userSprint?: Sprint;
  relevantModules: FrameworkModule[];
  strategicGuidance: StrategicGuidance[];
  contextualInsights: string[];
}

// Analyze user message for business context keywords
function extractBusinessContext(message: string): string[] {
  const keywords = [];
  const lowerMessage = message.toLowerCase();
  
  // Business challenge keywords
  const challengeMap = {
    'pricing': ['price', 'pricing', 'charge', 'cost', 'expensive', 'cheap', 'underpriced'],
    'sales': ['sales', 'selling', 'close', 'prospect', 'lead', 'conversion', 'client acquisition'],
    'delivery': ['delivery', 'fulfill', 'project', 'service', 'client work', 'implementation'],
    'scaling': ['scale', 'scaling', 'grow', 'growth', 'expand', 'team', 'hire', 'delegate'],
    'systems': ['system', 'process', 'automation', 'manual', 'inefficient', 'streamline'],
    'overwhelm': ['overwhelm', 'busy', 'time', 'stress', 'burnout', 'bottleneck'],
    'positioning': ['position', 'niche', 'market', 'competition', 'differentiate', 'value proposition']
  };

  Object.entries(challengeMap).forEach(([category, terms]) => {
    if (terms.some(term => lowerMessage.includes(term))) {
      keywords.push(category);
    }
  });

  return keywords;
}

// Get relevant strategic framework context based on user message and Freedom Score
export async function getFrameworkContext(
  userMessage: string,
  freedomScore?: any
): Promise<FrameworkContext> {
  try {
    console.log('[FRAMEWORK] Getting strategic context for:', userMessage);
    
    const businessContext = extractBusinessContext(userMessage);
    console.log('[FRAMEWORK] Extracted business context:', businessContext);

    // Get user's primary sprint if they have a Freedom Score
    let userSprint: Sprint | undefined;
    if (freedomScore?.recommendedOrder?.[0]?.sprintKey) {
      const sprintKey = freedomScore.recommendedOrder[0].sprintKey;
      console.log('[FRAMEWORK] Looking up user sprint:', sprintKey);
      
      const { data: sprintData, error: sprintError } = await supabase
        .from('sprints')
        .select('*')
        .eq('sprint_key', sprintKey)
        .single();

      if (sprintError) {
        console.log('[FRAMEWORK] Sprint table not accessible (tables may need creation):', sprintError.code);
      } else if (sprintData) {
        userSprint = sprintData;
        console.log('[FRAMEWORK] Found user sprint:', userSprint.full_title);
      }
    }

    // Get relevant modules based on context
    const { data: modulesData, error: modulesError } = await supabase
      .from('framework_modules')
      .select('*')
      .order('module_key');

    const relevantModules: FrameworkModule[] = modulesData || [];
    if (modulesError) {
      console.log('[FRAMEWORK] Modules table not accessible (tables may need creation):', modulesError.code);
    } else {
      console.log('[FRAMEWORK] Loaded', relevantModules.length, 'framework modules');
    }

    // Get strategic guidance based on context tags and user's situation
    let strategicGuidance: StrategicGuidance[] = [];
    try {
      let guidanceQuery = supabase
        .from('strategic_guidance')
        .select('*')
        .order('priority');

      // If we have business context, filter by relevant guidance
      if (businessContext.length > 0) {
        guidanceQuery = guidanceQuery.or(
          businessContext.map(context => `context_tags.cs.{${context}}`).join(',')
        );
      }

      const { data: guidanceData, error: guidanceError } = await guidanceQuery.limit(10);
      
      if (guidanceError) {
        console.log('[FRAMEWORK] Strategic guidance table not accessible (tables may need creation):', guidanceError.code);
        strategicGuidance = [];
      } else {
        strategicGuidance = guidanceData || [];
        console.log('[FRAMEWORK] Found', strategicGuidance.length, 'strategic guidance items');
      }
    } catch (guidanceError) {
      console.log('[FRAMEWORK] Error accessing strategic guidance (table may not exist):', guidanceError);
      strategicGuidance = [];
    }

    // Generate contextual insights
    const contextualInsights = generateContextualInsights(
      userMessage,
      businessContext,
      userSprint,
      strategicGuidance
    );

    return {
      userSprint,
      relevantModules,
      strategicGuidance,
      contextualInsights
    };

  } catch (error) {
    console.error('[FRAMEWORK] Error getting framework context:', error);
    return {
      relevantModules: [],
      strategicGuidance: [],
      contextualInsights: []
    };
  }
}

// Generate strategic insights based on context
function generateContextualInsights(
  userMessage: string,
  businessContext: string[],
  userSprint?: Sprint,
  guidance?: StrategicGuidance[]
): string[] {
  const insights: string[] = [];

  // Sprint-specific insights
  if (userSprint) {
    insights.push(`Based on your #1 priority sprint "${userSprint.full_title}", this relates to ${userSprint.methodology}.`);
    
    // Add relevant challenges/solutions from the sprint
    if (userSprint.common_challenges?.length > 0) {
      insights.push(`Common challenges in this area include: ${userSprint.common_challenges.slice(0, 2).join(', ')}.`);
    }
  }

  // Business context insights
  if (businessContext.includes('pricing') || businessContext.includes('positioning')) {
    insights.push('This appears to be a positioning and profitability challenge - focus on value-based pricing and market differentiation.');
  }

  if (businessContext.includes('sales') || businessContext.includes('scaling')) {
    insights.push('This relates to sales systemization - consider how to remove yourself from the sales process while maintaining conversion rates.');
  }

  if (businessContext.includes('delivery') || businessContext.includes('overwhelm')) {
    insights.push('This sounds like a delivery bottleneck - focus on documentation, delegation, and quality systems.');
  }

  // Guidance-specific insights
  if (guidance && guidance.length > 0) {
    const topGuidance = guidance[0];
    if (topGuidance.guidance_type === 'solution') {
      insights.push(`Strategic approach: ${topGuidance.content.substring(0, 100)}...`);
    }
  }

  return insights;
}

// Get sprint details by key
export async function getSprintDetails(sprintKey: string): Promise<Sprint | null> {
  try {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('sprint_key', sprintKey)
      .single();

    if (error || !data) {
      console.error('[FRAMEWORK] Error getting sprint details:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[FRAMEWORK] Error getting sprint details:', error);
    return null;
  }
}

// Get relevant strategic guidance for specific categories
export async function getGuidanceByCategory(category: string, limit = 5): Promise<StrategicGuidance[]> {
  try {
    const { data, error } = await supabase
      .from('strategic_guidance')
      .select('*')
      .eq('category', category)
      .order('priority')
      .limit(limit);

    if (error) {
      console.error('[FRAMEWORK] Error getting guidance by category:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[FRAMEWORK] Error getting guidance by category:', error);
    return [];
  }
}

export type { Sprint, FrameworkModule, StrategicGuidance, FrameworkContext };