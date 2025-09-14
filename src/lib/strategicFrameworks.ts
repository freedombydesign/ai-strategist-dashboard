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

    // Get templates (includes decision call structure and other resources)
    const { data: templatesData, error: templatesError } = await supabase
      .from('template_library')
      .select('*')
      .order('template_name');

    const availableTemplates = templatesData || [];
    if (templatesError) {
      console.log('[FRAMEWORK] Templates table not accessible:', templatesError.code);
    } else {
      console.log('[FRAMEWORK] Loaded', availableTemplates.length, 'templates including resources');
    }

    // Search for relevant templates based on user context
    const allRelevantTemplates = availableTemplates.filter(template => {
      const templateName = (template.template_name || '').toLowerCase();
      const templateContent = (template.content || '').toLowerCase();
      const templateDescription = (template.description || '').toLowerCase();
      const userMsg = userMessage.toLowerCase();
      
      // Direct matches for Decision Call Structure
      if (userMsg.includes('decision call') && templateName.includes('decision call')) {
        return true;
      }
      
      // Video content requests
      if (userMsg.includes('video') && (templateName.includes('video') || templateContent.includes('video'))) {
        return true;
      }
      
      // Sales page requests
      if ((userMsg.includes('sales page') || userMsg.includes('landing page') || userMsg.includes('wireframe')) && 
          (templateName.includes('sales page') || templateName.includes('wireframe') || templateName.includes('landing'))) {
        return true;
      }
      
      // Loom/walkthrough requests
      if ((userMsg.includes('loom') || userMsg.includes('walkthrough') || userMsg.includes('demo')) && 
          (templateName.includes('loom') || templateName.includes('walkthrough') || templateName.includes('demo'))) {
        return true;
      }
      
      // Module-specific requests
      if (userMsg.includes('module') && userMsg.includes('four') && templateName.includes('decision')) {
        return true;
      }
      
      // Sales script requests (broader matching)
      if (userMsg.includes('sales script') || userMsg.includes('sales team') || userMsg.includes('sales call')) {
        return templateName.includes('sales') || templateName.includes('call') || templateName.includes('script');
      }
      
      // Generic keyword matching
      const keywords = ['connection', 'wireframe', 'page', 'script', 'video', 'loom', 'walkthrough'];
      const hasKeywordMatch = keywords.some(keyword => {
        return userMsg.includes(keyword) && (templateName.includes(keyword) || templateContent.includes(keyword) || templateDescription.includes(keyword));
      });
      
      if (hasKeywordMatch) {
        return true;
      }
      
      // Business context matching
      const hasBusinessMatch = businessContext.some(context => 
        templateName.includes(context) || templateContent.includes(context) || templateDescription.includes(context)
      );
      
      // Template name partial matching (for when user mentions part of template name)
      const templateWords = templateName.split(' ');
      const hasNameMatch = templateWords.some(word => word.length > 3 && userMsg.includes(word));
      
      return hasBusinessMatch || hasNameMatch;
    });

    // SMART TEMPLATE PRIORITIZATION: Match request type to appropriate templates
    const userMsg = userMessage.toLowerCase();
    const relevantTemplates = allRelevantTemplates.sort((a, b) => {
      const aName = (a.template_name || '').toLowerCase();
      const bName = (b.template_name || '').toLowerCase();
      
      // EXACT MATCH PRIORITY: If user mentions specific template type, prioritize it
      
      // Video requests prioritize video templates
      if (userMsg.includes('video')) {
        if (aName.includes('video') && !bName.includes('video')) return -1;
        if (bName.includes('video') && !aName.includes('video')) return 1;
      }
      
      // Sales page/wireframe requests prioritize page templates
      if (userMsg.includes('sales page') || userMsg.includes('wireframe') || userMsg.includes('landing page')) {
        if ((aName.includes('sales page') || aName.includes('wireframe')) && 
            !(bName.includes('sales page') || bName.includes('wireframe'))) return -1;
        if ((bName.includes('sales page') || bName.includes('wireframe')) && 
            !(aName.includes('sales page') || aName.includes('wireframe'))) return 1;
      }
      
      // Loom/walkthrough requests prioritize walkthrough templates
      if (userMsg.includes('loom') || userMsg.includes('walkthrough') || userMsg.includes('demo')) {
        if ((aName.includes('loom') || aName.includes('walkthrough')) && 
            !(bName.includes('loom') || bName.includes('walkthrough'))) return -1;
        if ((bName.includes('loom') || bName.includes('walkthrough')) && 
            !(aName.includes('loom') || aName.includes('walkthrough'))) return 1;
      }
      
      // Decision Call Structure for sales script/call requests (more specific than before)
      if ((userMsg.includes('sales script') || userMsg.includes('sales call') || userMsg.includes('sales team')) && 
          !userMsg.includes('video') && !userMsg.includes('page') && !userMsg.includes('wireframe')) {
        if (aName === 'decision call structure' && a.resource_link) return -1;
        if (bName === 'decision call structure' && b.resource_link) return 1;
      }
      
      // If user asks for decision call specifically, prioritize all decision call templates
      if (userMsg.includes('decision call')) {
        if (aName.includes('decision call') && !bName.includes('decision call')) return -1;
        if (bName.includes('decision call') && !aName.includes('decision call')) return 1;
      }
      
      // Templates with resource links get priority over generic ones
      if (a.resource_link && !b.resource_link) return -1;
      if (b.resource_link && !a.resource_link) return 1;
      
      return 0;
    });

    console.log('[FRAMEWORK] Found', relevantTemplates.length, 'relevant templates');
    if (relevantTemplates.length > 0) {
      console.log('[FRAMEWORK] Sample relevant template:', {
        name: relevantTemplates[0].template_name,
        category: relevantTemplates[0].category,
        content_preview: relevantTemplates[0].content?.substring(0, 100)
      });
      
      // Log all Decision Call templates specifically
      const decisionCallTemplates = availableTemplates.filter(t => 
        t.template_name?.toLowerCase().includes('decision call')
      );
      console.log('[FRAMEWORK] Decision Call templates found:', decisionCallTemplates.map(t => ({
        name: t.template_name,
        category: t.category,
        resource_link: t.resource_link,
        description: t.description
      })));
      
      // Log the prioritized list after sorting
      console.log('[FRAMEWORK] PRIORITIZED templates (first 3):', relevantTemplates.slice(0, 3).map(t => ({
        name: t.template_name,
        has_resource_link: !!t.resource_link,
        resource_link: t.resource_link
      })));
    }
    
    // Convert to legacy format for compatibility
    const relevantModules: FrameworkModule[] = relevantTemplates.map((template, index) => ({
      id: template.id || index,
      module_key: `TEMP_${index}`,
      name: template.template_name || 'Unnamed Template',
      full_title: template.template_name || 'Unnamed Template',
      description: template.content || 'Template resource',
      focus_area: template.category || 'general',
      assessment_criteria: [],
      improvement_strategies: [template.content || ''],
      related_sprint_key: ''
    }));

    // Convert top templates to strategic guidance
    const strategicGuidance: StrategicGuidance[] = relevantTemplates.slice(0, 5).map((template, index) => {
      let content = `Use the "${template.template_name}" template`;
      
      // For AI Prompt Templates, use the full description
      if (template.description && template.description.includes('AI PROMPT TEMPLATE:')) {
        content = template.description; // Use the raw AI prompt template
      }
      // For Decision Call Structure, include the full methodology  
      else if (template.template_name?.toLowerCase().includes('decision call structure') && template.description) {
        content = `RUTH'S DECISION CALL STRUCTURE METHODOLOGY:

${template.description}

IMPLEMENTATION: Follow this specific 5-phase structure with the evaluation approach. This is Ruth's proprietary methodology from module four.`;
      } else if (template.description) {
        content += `: ${template.description}`;
      } else if (template.content) {
        content += `: ${template.content}`;
      }
      
      if (template.resource_link) {
        content += `. Access the full resource at: ${template.resource_link}`;
      }
      
      return {
        id: template.id || index,
        guidance_type: 'solution' as const,
        category: template.category || 'general',
        title: template.template_name || 'Template Resource',
        content,
        context_tags: businessContext,
        priority: index + 1
      };
    });

    console.log('[FRAMEWORK] Created', strategicGuidance.length, 'strategic guidance items from templates');
    if (strategicGuidance.length > 0) {
      console.log('[FRAMEWORK] Sample strategic guidance:', {
        title: strategicGuidance[0].title,
        content_preview: strategicGuidance[0].content?.substring(0, 100)
      });
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