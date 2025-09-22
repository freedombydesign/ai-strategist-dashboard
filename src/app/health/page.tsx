export default function Health() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">System Health Check</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="font-semibold text-green-800">Status</h2>
              <p className="text-green-700">OK</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-800">Environment</h2>
              <p className="text-blue-700">{process.env.NODE_ENV}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:col-span-2">
              <h2 className="font-semibold text-gray-800">Timestamp</h2>
              <p className="text-gray-700 font-mono text-sm">{new Date().toISOString()}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href="/standalone-login" className="text-blue-600 hover:text-blue-800 hover:underline">Standalone Login</a>
              <a href="/simple-login" className="text-blue-600 hover:text-blue-800 hover:underline">Simple Login</a>
              <a href="/test-login" className="text-blue-600 hover:text-blue-800 hover:underline">Test Login</a>
              <a href="/api/diagnostic-questions" className="text-blue-600 hover:text-blue-800 hover:underline">API Test</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}