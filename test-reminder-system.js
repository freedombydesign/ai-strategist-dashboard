// Test script for Check-in Reminder System
async function testReminderSystem() {
  console.log('🧪 Testing Check-in Reminder System...');
  
  try {
    const response = await fetch('https://scalewithruth.com/api/check-reminder-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Reminder system executed successfully!');
      console.log(`📊 Processed: ${result.processed} users`);
      console.log(`📧 Reminders sent: ${result.remindersSent}`);
      console.log('📋 Detailed results:', result.results);
    } else {
      console.error('❌ Reminder system failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Error testing reminder system:', error);
  }
}

// Run the test
testReminderSystem();