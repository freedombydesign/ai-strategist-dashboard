import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: Request) {
  try {
    console.log('[BULK-IMPORT] Starting bulk import of Ruth\'s frameworks...')
    
    // Ruth's AI Prompts from Airtable
    const aiPrompts = [
      {
        template_name: 'Offer Positioning Audit',
        category: 'Audit',
        description: `Review my current offer description: {{OfferText}}. 
• Identify if it's clear and compelling. 
• Spot pricing gaps (underpriced vs market). 
• Suggest 3 positioning tweaks that protect my margins.`,
        resource_link: 'https://docs.google.com/spreadsheets/d/14j1a_dqQo44CMpACGa8Ds9RLoNdf0tJa/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        variables: ['OfferText'],
        focus_area: 'sales'
      },
      {
        template_name: 'Profit Check',
        category: 'Pricing',
        description: `Based on this offer: {{OfferText}} and margin notes: {{MarginNotes}}, generate a simple 'Profit Check' report:
• Likely profit leaks
• 1–2 pricing strategies to fix them
• Language I can use to confidently communicate value.`,
        resource_link: 'https://drive.google.com/file/d/1sA0Uu0KpdAEq8JXOOqDE1MI14Zmvzocm/view?usp=drive_link',
        variables: ['OfferText', 'MarginNotes'],
        focus_area: 'sales'
      },
      {
        template_name: 'Journey Map Draft',
        category: 'Marketing',
        description: `Map a 4-step buyer journey for my service: {{ServiceDescription}}.
Each step should:
• Move them closer to commitment
• Require minimal manual work from me
• Suggest 1 tool/automation I could use.`,
        resource_link: 'https://docs.google.com/spreadsheets/d/1CEshlvucuEeAbbnVywXq4NjugOIlo8U5/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        variables: ['ServiceDescription'],
        focus_area: 'marketing'
      },
      {
        template_name: 'FAQ Script',
        category: 'Marketing',
        description: `Generate 5–7 FAQs for {{ServiceName}} that reduce repetitive explaining.
Tone: plain, friendly, confident.
Include short, ready-to-use answers.`,
        resource_link: 'https://docs.google.com/forms/d/e/1FAIpQLSeMiMd44CpSpEQZKCILVHNvNatA6Rkh2OcTexRdZ4r2_GX5dA/viewform?usp=sharing&ouid=108574007238477555870',
        variables: ['ServiceName'],
        focus_area: 'marketing'
      },
      {
        template_name: 'Sales Narrative Builder',
        category: 'Sales',
        description: `Take my notes: {{SalesNotes}} and turn them into a 2–3 paragraph sales story.
Must:
• Highlight pain → solution → result
• Avoid pushy/'closing' language
• Feel natural and relational.`,
        resource_link: 'https://docs.google.com/document/d/1WAul1W_s-OA7HeKVy2p_nWEM9By2ifjS/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        variables: ['SalesNotes'],
        focus_area: 'sales'
      },
      {
        template_name: 'Gentle Follow-Up Flow',
        category: 'Sales',
        description: `Write a 3-email follow-up sequence for {{ServiceName}}.
Each email should:
• Be short and warm
• Add value (tip/story/resource)
• End with a natural invite to take the next step.`,
        resource_link: 'https://docs.google.com/document/d/1-8GbhMBMzmiT4yIkI-itazX913jT1jj3/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        variables: ['ServiceName'],
        focus_area: 'sales'
      },
      {
        template_name: 'Client Welcome Pack',
        category: 'Delivery',
        description: `Draft a client welcome message for {{ServiceName}}.
Tone: warm, clear, professional.
Include:
• What happens next
• Key resources/links
• How to get support.`,
        resource_link: 'https://docs.google.com/document/d/1HiL1_70jijjsNMHW_EMD_P0q4fyjfiTN/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        variables: ['ServiceName'],
        focus_area: 'delivery'
      },
      {
        template_name: 'Delegation Script',
        category: 'Delivery',
        description: `Here's a recurring task: {{TaskDescription}}.
Write a delegation SOP:
• Who should own it
• Exact steps to complete it
• Common pitfalls to avoid.`,
        resource_link: 'https://docs.google.com/document/d/1laZw6Xry2rBeRJ3yrvc1zah1hn4iVBS7/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        variables: ['TaskDescription'],
        focus_area: 'delivery'
      },
      {
        template_name: 'Process Audit',
        category: 'Systems',
        description: `Analyze this process description: {{ProcessText}}.
• Is it lean, or bloated?
• Suggest 1 retirement or simplification.
• Suggest 1 automation or tool upgrade.`,
        resource_link: 'https://docs.google.com/document/d/1laZw6Xry2rBeRJ3yrvc1zah1hn4iVBS7/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        variables: ['ProcessText'],
        focus_area: 'systems'
      },
      {
        template_name: 'Continuous Improvement Plan',
        category: 'Systems',
        description: `Based on my current operations: {{OpsNotes}}, create a 30-day 'Refine & Release' plan.
Each week should:
• Focus on one system to review
• Include a simple metric to track
• End with a small win I can celebrate.`,
        resource_link: 'https://docs.google.com/spreadsheets/d/10F7ULFMkRHgTwTiGMIExlvfd04oTzfnu/edit?usp=sharing&ouid=108574007238477555870&rtpof=true&sd=true',
        variables: ['OpsNotes'],
        focus_area: 'systems'
      },
      {
        template_name: 'SOP From Voice',
        category: 'Systems',
        description: `Here's a rough voice note transcription: {{VoiceNoteText}}.
Turn it into a step-by-step SOP:
• Tools needed
• Roles responsible
• Clear checklist style.`,
        resource_link: 'https://docs.google.com/document/d/1WAul1W_s-OA7HeKVy2p_nWEM9By2ifjS/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        variables: ['VoiceNoteText'],
        focus_area: 'systems'
      },
      {
        template_name: 'Backend Audit',
        category: 'Systems',
        description: `Audit my current backend tools: {{ToolList}}.
Show me:
• Where things are redundant
• Where I'm still the bottleneck
• 1–2 integrations that would free me up most.`,
        resource_link: 'https://docs.google.com/spreadsheets/d/1ErXzlQJWwIJfVjYHF8oaL0y5rO3HIFgO/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        variables: ['ToolList'],
        focus_area: 'systems'
      }
    ];

    // Insert all AI prompts
    const insertedPrompts = [];
    for (const prompt of aiPrompts) {
      try {
        const { data, error } = await supabase
          .from('template_library')
          .insert({
            template_name: prompt.template_name,
            category: prompt.category,
            description: `AI PROMPT TEMPLATE:

${prompt.description}

VARIABLES: ${prompt.variables.join(', ')}
FOCUS AREA: ${prompt.focus_area}

This is an AI prompt template that can be used to generate specific content by replacing the variables with actual values.`,
            resource_link: prompt.resource_link
          })
          .select()
          .single();

        if (error) {
          console.log(`[BULK-IMPORT] Warning - could not insert ${prompt.template_name}:`, error.message);
        } else {
          insertedPrompts.push(data);
          console.log(`[BULK-IMPORT] ✅ Inserted: ${prompt.template_name}`);
        }
      } catch (err) {
        console.log(`[BULK-IMPORT] Error inserting ${prompt.template_name}:`, err);
      }
    }
    
    console.log(`[BULK-IMPORT] Bulk import completed. Inserted ${insertedPrompts.length} AI prompts.`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedPrompts.length} AI prompt templates from your Airtable setup`,
      imported_count: insertedPrompts.length,
      imported_templates: insertedPrompts.map(t => t.template_name)
    })
    
  } catch (error) {
    console.error('[BULK-IMPORT] Error:', error)
    return NextResponse.json({
      error: 'Failed to bulk import frameworks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}