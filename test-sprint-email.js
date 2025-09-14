// Test script for Sprint Completion Email
async function testSprintCompletionEmail() {
  console.log('🧪 Testing Sprint Completion Email...');
  
  const testData = {
    userEmail: 'ruthlarbie@gmail.com',
    sprintData: {
      name: 'profitable_service',
      client_facing_title: 'Lock In Your Most Profitable Service Zone',
      description: 'Identify and focus on the services that generate the highest profit with the least effort.',
      goal: 'Eliminate low-value services and double down on your most profitable offerings.',
      time_saved_hours: 8
    },
    userProgress: {
      totalStepsCompleted: 12,
      sprintDuration: 7
    }
  };
  
  try {
    const response = await fetch('https://scalewithruth.com/api/send-sprint-completion-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Sprint completion email sent successfully!');
      console.log('📧 Email ID:', result.emailId);
    } else {
      console.error('❌ Failed to send sprint completion email:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Error testing sprint completion email:', error);
  }
}

// Run the test
testSprintCompletionEmail();