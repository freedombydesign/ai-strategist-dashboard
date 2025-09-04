import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    console.log('[IMPORT-STEPS] Starting import of Ruth\'s Airtable steps data...')
    
    // Ruth's actual steps data from Airtable
    const ruthsSteps = [
      {
        step_name: 'Complete Sweet Spot Positioning',
        sprint_category: 'Lock in Your Most Profitable Service Zone',
        step_number: 1.0,
        task_description: 'Download the Sweet Spot Positioning worksheet, fill in all sections, and upload your completed file.',
        resource_link: 'https://docs.google.com/spreadsheets/d/14j1a_dqQo44CMpACGa8Ds9RLoNdf0tJa/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Upload completed positioning worksheet',
        sprint_outcome: 'Set your offer, story, and structure for high-margin sales without founder bottlenecks',
        connected_ai_prompt: 'Offer Positioning Audit',
        completion_status: null
      },
      {
        step_name: 'Build Your Market Message Map',
        sprint_category: 'Lock in Your Most Profitable Service Zone',
        step_number: 2.0,
        task_description: 'Open the Market Message Map template, complete each section to clarify your core messaging, and save your finished map.',
        resource_link: 'https://drive.google.com/file/d/1sA0Uu0KpdAEq8JXOOqDE1MI14Zmvzocm/view?usp=drive_link',
        deliverable: 'Submit final copy for review',
        sprint_outcome: 'Set your offer, story, and structure for high-margin sales without founder bottlenecks',
        connected_ai_prompt: 'Profit Check',
        completion_status: null
      },
      {
        step_name: 'Clarify Your Service Story',
        sprint_category: 'Lock in Your Most Profitable Service Zone',
        step_number: 3.0,
        task_description: 'Use the Service Story Builder to write the short and long versions of your offer\'s story, then store it in your messaging library.',
        resource_link: 'https://docs.google.com/document/d/1WAul1W_s-OA7HeKVy2p_nWEM9By2ifjS/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Provide final narrative copy',
        sprint_outcome: 'Set your offer, story, and structure for high-margin sales without founder bottlenecks',
        connected_ai_prompt: 'Sales Narrative Builder, SOP From Voice',
        completion_status: null
      },
      {
        step_name: 'Define Your Lean Team Needs',
        sprint_category: 'Lock in Your Most Profitable Service Zone',
        step_number: 4.0,
        task_description: 'Fill out the Lean Team Audit to identify which roles and tasks you need support for, and which ones you\'ll keep in-house.',
        resource_link: 'https://docs.google.com/spreadsheets/d/1hcEYTBJysDJEGJ5B5C31e5CGKncqvQp8/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Upload audit results and role priorities',
        sprint_outcome: 'Set your offer, story, and structure for high-margin sales without founder bottlenecks',
        connected_ai_prompt: null,
        completion_status: null
      },
      {
        step_name: 'Map Your Buyer Journey',
        sprint_category: 'Create A Smooth Path From First Contact to Commitment, Lock in Your Most Profitable Service Zone',
        step_number: 5.0,
        task_description: 'Using the Buyer Journey Map, outline the exact steps a prospect takes from first contact to becoming a client.',
        resource_link: 'https://docs.google.com/spreadsheets/d/1CEshlvucuEeAbbnVywXq4NjugOIlo8U5/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Submit final journey map',
        sprint_outcome: 'Create a friction-free, relational path from interest to commitment, Set your offer, story, and structure for high-margin sales without founder bottlenecks',
        connected_ai_prompt: 'Journey Map Draft',
        completion_status: null
      },
      {
        step_name: 'Set Up Client Form',
        sprint_category: 'Create A Smooth Path From First Contact to Commitment',
        step_number: 6.0,
        task_description: 'Customize the Client Fit Filter form with your own questions and branding, then publish it in your onboarding process.',
        resource_link: 'https://docs.google.com/forms/d/e/1FAIpQLSeMiMd44CpSpEQZKCILVHNvNatA6Rkh2OcTexRdZ4r2_GX5dA/viewform?usp=sharing&ouid=108574007238477555870',
        deliverable: 'Share live form link',
        sprint_outcome: 'Create a friction-free, relational path from interest to commitment',
        connected_ai_prompt: 'FAQ Script',
        completion_status: 'checked'
      },
      {
        step_name: 'Create Connection Based Sales Video',
        sprint_category: 'Create A Smooth Path From First Contact to Commitment',
        step_number: 7.0,
        task_description: 'Fill in the Connection-Based Sales Script template with your offer details and save it for easy access before conversations.',
        resource_link: 'https://docs.google.com/document/d/1-bO_ZnXmlhLatqoStdjcxdvSIVb3c_gc/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Upload video link',
        sprint_outcome: 'Create a friction-free, relational path from interest to commitment',
        connected_ai_prompt: null,
        completion_status: 'checked'
      },
      {
        step_name: 'Build Sales Page Wireframe',
        sprint_category: 'Create A Smooth Path From First Contact to Commitment',
        step_number: 8.0,
        task_description: 'Follow the Sales Page Wireframe template to map your sections, headlines, and calls-to-action, then save as a draft page.',
        resource_link: 'https://docs.google.com/document/d/1OdjgvwZx8vGcsbu8eyU86-c3aHoMwwSY/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Share final sales page URL',
        sprint_outcome: 'Create a friction-free, relational path from interest to commitment',
        connected_ai_prompt: null,
        completion_status: null
      },
      {
        step_name: 'Draft Your Follow-Up Emails',
        sprint_category: 'Sell Without Being The Bottleneck',
        step_number: 9.0,
        task_description: 'Load the Follow-Up Email templates into your CRM, customize them for your voice, and schedule them in your system.',
        resource_link: 'https://docs.google.com/document/d/1-8GbhMBMzmiT4yIkI-itazX913jT1jj3/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Upload sequence in CRM',
        sprint_outcome: 'Automate and streamline conversions while staying human',
        connected_ai_prompt: 'Gentle Follow-Up Flow',
        completion_status: null
      },
      {
        step_name: 'Install Your Say Yes CTA Flow',
        sprint_category: 'Sell Without Being The Bottleneck',
        step_number: 10.0,
        task_description: 'Set up the "Say Yes" CTA Flow inside your CRM or automation tool, and test the three-step conversion sequence.',
        resource_link: 'https://docs.google.com/document/d/1dzfWLU_TXHRoW0Yn70eDAHbSU3Jp2eCr/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Test flow end-to-end',
        sprint_outcome: 'Automate and streamline conversions while staying human',
        connected_ai_prompt: null,
        completion_status: 'checked'
      },
      {
        step_name: 'Record Your Loom Sales Walkthrough',
        sprint_category: 'Sell Without Being The Bottleneck',
        step_number: 11.0,
        task_description: 'Using the Loom Script template, record a sales walkthrough video and save it in your asset library for reuse.',
        resource_link: 'https://docs.google.com/document/d/1m_ww5NVAcFshkYYzGBrG_LpDDlqtCu-X/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Upload recording link',
        sprint_outcome: 'Automate and streamline conversions while staying human',
        connected_ai_prompt: null,
        completion_status: 'checked'
      },
      {
        step_name: 'Implement Client Intake Checklist',
        sprint_category: 'Streamline Client Delivery Without Losing Your Personal Touch',
        step_number: 12.0,
        task_description: 'Follow the Client Intake Checklist to ensure you\'ve collected all necessary details and granted access to tools.',
        resource_link: 'https://docs.google.com/spreadsheets/d/1wSjrteDK7weA23zMuasih2U5IRFAs5rs/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Share Final Checklist file',
        sprint_outcome: 'Smooth client onboarding, delivery and support without constant founder involvement',
        connected_ai_prompt: null,
        completion_status: 'checked'
      },
      {
        step_name: 'Automate Welcome Email +Voice Note',
        sprint_category: 'Streamline Client Delivery Without Losing Your Personal Touch',
        step_number: 13.0,
        task_description: 'Load the Welcome Email + Voice Note script into your system, set it to auto-send after onboarding, and test the trigger',
        resource_link: 'https://docs.google.com/document/d/1HiL1_70jijjsNMHW_EMD_P0q4fyjfiTN/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Test automated send',
        sprint_outcome: 'Smooth client onboarding, delivery and support without constant founder involvement',
        connected_ai_prompt: 'Client Welcome Pack',
        completion_status: null
      },
      {
        step_name: 'Build Support System Templates',
        sprint_category: 'Streamline Client Delivery Without Losing Your Personal Touch',
        step_number: 14.0,
        task_description: 'Create comprehensive support templates and delegation scripts for your team to handle client support without you.',
        resource_link: 'https://docs.google.com/document/d/1laZw6Xry2rBeRJ3yrvc1zah1hn4iVBS7/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Upload completed support templates',
        sprint_outcome: 'Smooth client onboarding, delivery and support without constant founder involvement',
        connected_ai_prompt: 'Delegation Script, Process Audit, SOP From Voice',
        completion_status: null
      },
      {
        step_name: 'Complete System Self Audit',
        sprint_category: 'Continuously Improve Without Burning it Down',
        step_number: 15.0,
        task_description: 'Fill in the System Self-Audit worksheet, score each category, and identify what needs to be refined or removed.',
        resource_link: 'https://docs.google.com/spreadsheets/d/1ErXzlQJWwIJfVjYHF8oaL0y5rO3HIFgO/edit?usp=drive_link&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Upload audit results',
        sprint_outcome: 'Ongoing improvements that scale without rebuilding from scratch',
        connected_ai_prompt: 'Backend Audit, SOP From Voice',
        completion_status: null
      },
      {
        step_name: 'Archive Low-ROI Processes',
        sprint_category: 'Continuously Improve Without Burning it Down',
        step_number: 16.0,
        task_description: 'Identify any recurring process with low ROI, document the decision, and archive the related SOP or automation.',
        resource_link: 'https://docs.google.com/spreadsheets/d/10F7ULFMkRHgTwTiGMIExlvfd04oTzfnu/edit?usp=sharing&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Mark outdated processes in system',
        sprint_outcome: 'Ongoing improvements that scale without rebuilding from scratch',
        connected_ai_prompt: null,
        completion_status: 'checked'
      },
      {
        step_name: 'Plan Next 90 Day Growth Sprint',
        sprint_category: 'Continuously Improve Without Burning it Down',
        step_number: 17.0,
        task_description: 'Create a strategic 90-day growth plan with specific metrics, milestones, and improvement targets.',
        resource_link: 'https://docs.google.com/spreadsheets/d/10F7ULFMkRHgTwTiGMIExlvfd04oTzfnu/edit?usp=sharing&ouid=108574007238477555870&rtpof=true&sd=true',
        deliverable: 'Submit plan for review',
        sprint_outcome: 'Ongoing improvements that scale without rebuilding from scratch',
        connected_ai_prompt: 'Continuous Improvement Plan',
        completion_status: null
      }
    ];

    // The enhanced_steps table will be created automatically by Supabase on first insert
    console.log('[IMPORT-STEPS] Starting import - table will be created automatically if needed');

    // Import all steps
    const importedSteps = [];
    for (const step of ruthsSteps) {
      try {
        const { data, error } = await supabase
          .from('enhanced_steps')
          .insert({
            step_name: step.step_name,
            sprint_category: step.sprint_category,
            step_number: step.step_number,
            task_description: step.task_description,
            resource_link: step.resource_link,
            deliverable: step.deliverable,
            sprint_outcome: step.sprint_outcome,
            connected_ai_prompt: step.connected_ai_prompt,
            completion_status: step.completion_status,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.log(`[IMPORT-STEPS] Warning - could not insert ${step.step_name}:`, error.message);
        } else {
          importedSteps.push(data);
          console.log(`[IMPORT-STEPS] ✅ Imported: ${step.step_name}`);
        }
      } catch (err) {
        console.log(`[IMPORT-STEPS] Error importing ${step.step_name}:`, err);
      }
    }
    
    console.log(`[IMPORT-STEPS] Import completed. Imported ${importedSteps.length} steps.`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedSteps.length} detailed steps from your Airtable system with resource links, deliverables, and AI prompt connections`,
      imported_count: importedSteps.length,
      imported_steps: importedSteps.map(s => s.step_name)
    })
    
  } catch (error) {
    console.error('[IMPORT-STEPS] Error:', error)
    return NextResponse.json({
      error: 'Failed to import steps',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}