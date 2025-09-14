import Link from 'next/link'

export default function FreedomSuitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Freedom by Design Suite</h1>
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">Premium</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/ai-intelligence"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Executive AI
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-4">Your Business Operating System</h2>
          <p className="text-xl opacity-90 mb-6">7 integrated systems working together to scale your service business</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <Link href="/cash-flow-command" className="block">
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
                  Active
                </div>
              </div>
            </div>
          </Link>

          <Link href="/profit-pulse" className="block">
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
                  Active
                </div>
              </div>
            </div>
          </Link>

          <Link href="/deliver-ease" className="block">
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
                  Active
                </div>
              </div>
            </div>
          </Link>

          <Link href="/convert-flow" className="block">
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
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Freedom Suite is LIVE!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Your complete business operating system is now deployed and ready to scale your service business.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/ai-intelligence"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Executive Intelligence
            </Link>
            <Link
              href="/suite"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Business Suite
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}