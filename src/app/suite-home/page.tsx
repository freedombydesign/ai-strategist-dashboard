import Link from 'next/link'

export default function SuiteHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-3xl font-bold text-white">Freedom Suite</h1>
              <p className="text-blue-200">Advanced Business Management Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/20"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Advanced Business Suite
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto">
            World-class systems for 7-figure founders who want their business to run without them. 
            Sophisticated automation, delivery management, and profit optimization.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/suite"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg inline-flex items-center gap-3 font-semibold"
            >
              🚀 Access Business Suite
            </Link>
            
            <Link 
              href="/login"
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-lg inline-flex items-center gap-3"
            >
              📊 Login to Dashboard
            </Link>
          </div>
        </div>

        {/* Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">DeliverEase</h3>
            <p className="text-blue-200 text-sm mb-4">Automated client delivery management for zero founder involvement</p>
            <Link href="/deliver-ease" className="text-indigo-300 hover:text-indigo-200 text-sm font-medium">
              Access System →
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">ProfitPulse</h3>
            <p className="text-blue-200 text-sm mb-4">Financial intelligence and profit optimization analytics</p>
            <Link href="/profit-pulse" className="text-emerald-300 hover:text-emerald-200 text-sm font-medium">
              Access System →
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Cash Flow Command</h3>
            <p className="text-blue-200 text-sm mb-4">Advanced cash flow management and forecasting</p>
            <Link href="/cash-flow-command" className="text-blue-300 hover:text-blue-200 text-sm font-medium">
              Access System →
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Convert Flow</h3>
            <p className="text-blue-200 text-sm mb-4">Conversion optimization and analytics platform</p>
            <Link href="/convert-flow" className="text-purple-300 hover:text-purple-200 text-sm font-medium">
              Access System →
            </Link>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Built for 7-Figure Founders</h3>
          <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
            Every system is designed for <strong>minimal founder involvement</strong> and maximum operational efficiency. 
            Your business runs while you focus on strategy and growth.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-white mb-2">&lt;10hrs</div>
              <div className="text-blue-200 text-sm">Founder hours per week</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">94%</div>
              <div className="text-blue-200 text-sm">On-time delivery rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">AI-Powered</div>
              <div className="text-blue-200 text-sm">Automation throughout</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Scale Without You?</h3>
          <p className="text-blue-200 mb-8">
            Join sophisticated founders who've systematized their 7-figure operations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/suite"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold"
            >
              Access Your Business Suite
            </Link>
            
            <Link 
              href="https://scalewithruth.com"
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-lg"
            >
              Learn More About Our Systems
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}