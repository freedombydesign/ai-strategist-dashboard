// Test script for Daily Check-in Reminder Email
async function testCheckinReminderEmail() {
  console.log('🧪 Testing Daily Check-in Reminder Email...');
  
  const testData = {
    userEmail: 'ruthlarbie@gmail.com',
    userName: 'Ruth',
    daysMissed: 2,
    currentStreak: 5,
    lastCheckinDate: '2025-01-12'
  };
  
  try {
    const response = await fetch('https://scalewithruth.com/api/send-checkin-reminder-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Check-in reminder email sent successfully!');
      console.log('📧 Email ID:', result.emailId);
    } else {
      console.error('❌ Failed to send check-in reminder:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Error testing check-in reminder:', error);
  }
}

// Run the test
testCheckinReminderEmail();