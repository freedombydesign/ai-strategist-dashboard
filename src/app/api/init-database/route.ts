import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('[DB-INIT] Starting database initialization...');

    // Try to insert strategic framework data
    // If tables don't exist, we'll get a clear error message
    
    console.log('[DB-INIT] Attempting to insert sprint data...');

    // Insert sprint data
    const sprintInserts = [
      {
        sprint_key: 'S1',
        name: 'zone',
        full_title: 'Lock In Your Most Profitable Service Zone',
        description: 'Establish clear positioning and optimal pricing to maximize profitability and market demand',
        methodology: 'Position for Profit methodology focusing on service clarity and premium positioning',
        week_number: 1,
        objectives: ["Define your most profitable service offering", "Establish premium pricing strategy", "Create clear market positioning", "Develop compelling value proposition"],
        key_strategies: ["Service audit and profitability analysis", "Competitive positioning research", "Premium pricing framework", "Value proposition development"],
        common_challenges: ["Underpricing services", "Unclear positioning", "Commoditization pressure", "Difficulty articulating value"],
        success_indicators: ["Higher profit margins", "Clearer client inquiries", "Reduced price objections", "Stronger market position"]
      },
      {
        sprint_key: 'S2',
        name: 'path',
        full_title: 'Create a Smooth Path from First Contact to Commitment',
        description: 'Engineer a streamlined buyer journey that converts prospects efficiently without manual intervention',
        methodology: 'Engineer the Buyer Journey methodology for conversion optimization',
        week_number: 2,
        objectives: ["Map current buyer journey", "Identify conversion bottlenecks", "Automate key touchpoints", "Optimize for commitment"],
        key_strategies: ["Journey mapping and gap analysis", "Conversion funnel optimization", "Automated nurturing sequences", "Decision-making facilitation"],
        common_challenges: ["Low conversion rates", "Manual follow-up processes", "Unclear next steps for prospects", "Long sales cycles"],
        success_indicators: ["Higher conversion rates", "Automated prospect nurturing", "Shorter sales cycles", "Predictable pipeline"]
      },
      {
        sprint_key: 'S3',
        name: 'sell',
        full_title: 'Sell Without Being a Bottleneck',
        description: 'Build scalable sales systems that convert prospects without requiring your direct involvement',
        methodology: 'Sales System That Converts methodology for delegation-ready sales',
        week_number: 3,
        objectives: ["Systematize sales conversations", "Create sales assets and tools", "Train team on sales process", "Implement CRM and tracking"],
        key_strategies: ["Sales script and conversation frameworks", "Proposal and closing systems", "Team training and certification", "Sales performance tracking"],
        common_challenges: ["Owner dependency in sales", "Inconsistent sales results", "Team cant close deals", "Time trapped in sales activities"],
        success_indicators: ["Sales team independence", "Consistent conversion rates", "Scalable revenue growth", "Owner time freedom"]
      },
      {
        sprint_key: 'S4',
        name: 'delivery',
        full_title: 'Streamline Client Delivery without Losing Your Personal Touch',
        description: 'Create efficient delivery systems that maintain quality while reducing your hands-on involvement',
        methodology: 'Deliver Without Doing It All methodology for scalable fulfillment',
        week_number: 4,
        objectives: ["Document delivery processes", "Train delivery team", "Implement quality controls", "Maintain client satisfaction"],
        key_strategies: ["Process documentation and SOPs", "Team training and delegation", "Quality assurance systems", "Client communication protocols"],
        common_challenges: ["Delivery bottlenecks", "Quality control issues", "Client dissatisfaction", "Owner involvement in every project"],
        success_indicators: ["Consistent delivery quality", "Team independence", "Client satisfaction maintenance", "Scalable operations"]
      },
      {
        sprint_key: 'S5',
        name: 'improve',
        full_title: 'Continuously Improve without Burning It Down',
        description: 'Establish systematic improvement processes that optimize without disrupting successful operations',
        methodology: 'Refine, Release, Repeat methodology for sustainable growth',
        week_number: 5,
        objectives: ["Create improvement frameworks", "Establish review cycles", "Implement feedback systems", "Optimize continuously"],
        key_strategies: ["Regular system audits", "Performance metrics tracking", "Feedback collection and analysis", "Iterative improvement processes"],
        common_challenges: ["Stagnant systems", "Lack of optimization", "No improvement processes", "Fear of changing working systems"],
        success_indicators: ["Continuous optimization", "Data-driven improvements", "Systematic growth", "Sustainable scaling"]
      }
    ];

    // Insert sprints
    let sprintErrors = 0;
    for (const sprint of sprintInserts) {
      const { error } = await supabase.from('sprints').upsert(sprint);
      if (error) {
        console.error('[DB-INIT] Error inserting sprint:', sprint.sprint_key, error);
        sprintErrors++;
      } else {
        console.log(`[DB-INIT] Inserted sprint: ${sprint.sprint_key}`);
      }
    }
    console.log(`[DB-INIT] Sprint data processed: ${sprintInserts.length - sprintErrors} successful, ${sprintErrors} errors`);

    // Insert strategic guidance
    const guidanceInserts = [
      {
        guidance_type: 'challenge',
        category: 'positioning',
        title: 'Underpricing and Commoditization',
        content: 'When businesses compete primarily on price, they erode profit margins and position themselves as commodities. This creates a race to the bottom that makes sustainable growth impossible.',
        context_tags: ["pricing", "positioning", "competition", "margins"],
        related_sprint_key: 'S1',
        priority: 1
      },
      {
        guidance_type: 'solution',
        category: 'positioning',
        title: 'Premium Positioning Strategy',
        content: 'Develop a unique value proposition that justifies premium pricing. Focus on outcomes delivered rather than time spent or features provided. Position as the expert solution for specific client types.',
        context_tags: ["premium", "value_proposition", "expert_positioning"],
        related_sprint_key: 'S1',
        priority: 1
      },
      {
        guidance_type: 'challenge',
        category: 'sales',
        title: 'Owner-Dependent Sales Process',
        content: 'Many businesses rely entirely on the owner for sales conversations, creating a bottleneck that prevents scaling and limits growth potential.',
        context_tags: ["owner_dependency", "sales_bottleneck", "scaling"],
        related_sprint_key: 'S3',
        priority: 1
      },
      {
        guidance_type: 'solution',
        category: 'sales',
        title: 'Systematized Sales Framework',
        content: 'Create repeatable sales processes with documented scripts, objection handling, and closing techniques that team members can execute consistently.',
        context_tags: ["sales_systems", "team_training", "process_documentation"],
        related_sprint_key: 'S3',
        priority: 1
      },
      {
        guidance_type: 'challenge',
        category: 'delivery',
        title: 'Delivery Bottlenecks',
        content: 'When business owners are involved in every client delivery, it creates capacity constraints and prevents the business from scaling beyond their personal involvement.',
        context_tags: ["delivery_bottleneck", "capacity_constraints", "owner_involvement"],
        related_sprint_key: 'S4',
        priority: 1
      },
      {
        guidance_type: 'solution',
        category: 'delivery',
        title: 'Scalable Delivery Systems',
        content: 'Document all delivery processes, train team members, and implement quality controls that maintain standards without requiring owner oversight for every project.',
        context_tags: ["delivery_systems", "process_documentation", "quality_control"],
        related_sprint_key: 'S4',
        priority: 1
      }
    ];

    // Insert guidance
    let guidanceErrors = 0;
    for (const guidance of guidanceInserts) {
      const { error } = await supabase.from('strategic_guidance').upsert(guidance);
      if (error) {
        console.error('[DB-INIT] Error inserting guidance:', guidance.title, error);
        guidanceErrors++;
      } else {
        console.log(`[DB-INIT] Inserted guidance: ${guidance.title}`);
      }
    }
    console.log(`[DB-INIT] Strategic guidance processed: ${guidanceInserts.length - guidanceErrors} successful, ${guidanceErrors} errors`);

    const totalErrors = sprintErrors + guidanceErrors;
    const totalInserts = sprintInserts.length + guidanceInserts.length;

    if (totalErrors > 0) {
      return NextResponse.json({
        success: false,
        message: `Database initialization completed with ${totalErrors} errors out of ${totalInserts} total inserts`,
        details: {
          sprintErrors,
          guidanceErrors,
          suggestion: 'Check if the required database tables (sprints, strategic_guidance) exist in your Supabase project'
        }
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: `Database initialized successfully with ${totalInserts} strategic framework records`,
      details: {
        sprintsInserted: sprintInserts.length,
        guidanceInserted: guidanceInserts.length
      }
    });

  } catch (error) {
    console.error('[DB-INIT] Database initialization error:', error);
    return NextResponse.json({
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}