export default function QuickTest() {
  return (
    <div style={{ padding: '20px', fontSize: '18px' }}>
      <h1>✅ Quick Test Page</h1>
      <p>If you can see this, the deployment is working!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      
      <h2>Test Links:</h2>
      <ul>
        <li><a href="/api/test-auth">Test Auth API</a></li>
        <li><a href="/api/diagnostic-questions">Diagnostic Questions</a></li>
        <li><a href="/health">Health Check</a></li>
      </ul>

      <h2>Login Tests:</h2>
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h3>Direct API Test</h3>
        <form onSubmit={(e) => {
          e.preventDefault()
          const email = (e.target as any).email.value
          fetch('/api/test-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          })
          .then(r => r.json())
          .then(data => {
            alert(data.success ? `✅ ${data.message}` : `❌ ${data.error}`)
          })
          .catch(err => alert(`❌ Error: ${err.message}`))
        }}>
          <input type="email" name="email" placeholder="Enter email" style={{ padding: '8px', marginRight: '10px' }} />
          <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none' }}>
            Send Magic Link
          </button>
        </form>
      </div>
    </div>
  )
}