export default function FreedomSuitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Freedom by Design Suite</h1>
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">Premium</span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://ai.scalewithruth.com"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                🧠 Executive AI
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-4">🎉 Your Business Operating System</h2>
          <p className="text-xl opacity-90 mb-6">7 integrated systems working together to scale your service business from $1M to $3M+ revenue</p>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">94%</div>
              <div className="text-sm opacity-80">System Health</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">$485K</div>
              <div className="text-sm opacity-80">Monthly Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">8.4/10</div>
              <div className="text-sm opacity-80">Business Score</div>
            </div>
          </div>
        </div>

        {/* System Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Cash Flow Command */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">Cash Flow Command</h3>
                  <p className="text-sm text-gray-500">Financial Forecasting</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                85%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Alerts</span>
                <span className="font-medium">2</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>
          </div>

          {/* ProfitPulse */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">ProfitPulse</h3>
                  <p className="text-sm text-gray-500">Profitability Analysis</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                92%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profit Margin</span>
                <span className="font-medium text-green-600">34.2%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "92%" }}></div>
              </div>
            </div>
          </div>

          {/* JourneyBuilder */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">JourneyBuilder</h3>
                  <p className="text-sm text-gray-500">Customer Journeys</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                78%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Journeys</span>
                <span className="font-medium">12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: "78%" }}></div>
              </div>
            </div>
          </div>

          {/* SystemStack */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📚</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">SystemStack</h3>
                  <p className="text-sm text-gray-500">Process Documentation</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                88%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Processes</span>
                <span className="font-medium">45</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: "88%" }}></div>
              </div>
            </div>
          </div>

          {/* ConvertFlow */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔄</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">ConvertFlow</h3>
                  <p className="text-sm text-gray-500">Sales Optimization</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                73%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pipeline Value</span>
                <span className="font-medium">$1.25M</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: "73%" }}></div>
              </div>
            </div>
          </div>

          {/* DeliverEase */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🚀</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">DeliverEase</h3>
                  <p className="text-sm text-gray-500">Client Delivery</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                94%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Projects</span>
                <span className="font-medium">8</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-teal-600 h-2 rounded-full" style={{ width: "94%" }}></div>
              </div>
            </div>
          </div>

          {/* LaunchLoop */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔬</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">LaunchLoop</h3>
                  <p className="text-sm text-gray-500">Continuous Optimization</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                81%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Running Experiments</span>
                <span className="font-medium">3</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "81%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎉 Freedom Suite is LIVE!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Your complete 8-system business operating system is now deployed and ready to scale your service business to $3M+ revenue.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="https://ai.scalewithruth.com"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              🧠 Executive Intelligence →
            </a>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              📊 Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}