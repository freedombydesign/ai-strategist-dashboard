export default function Health() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🚀 Health Check</h1>
      <p>Timestamp: {new Date().toISOString()}</p>
      <p>Status: OK</p>
      <p>Environment: {process.env.NODE_ENV}</p>
      <ul>
        <li><a href="/standalone-login">Standalone Login</a></li>
        <li><a href="/simple-login">Simple Login</a></li>
        <li><a href="/test-login">Test Login</a></li>
        <li><a href="/api/diagnostic-questions">API Test</a></li>
      </ul>
    </div>
  )
}