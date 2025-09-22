import Link from 'next/link'

export default function AIHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-3xl font-bold text-white">AI Executive Intelligence</h1>
              <p className="text-purple-200">Strategic AI Command Center</p>
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
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
            AI Executive Intelligence
          </h1>
          <p className="text-xl text-purple-200 mb-8 max-w-3xl mx-auto">
            Advanced AI-powered strategic guidance and business intelligence for executive-level decision making. 
            Your personal AI business strategist and implementation coach.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/ai-intelligence"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-lg inline-flex items-center gap-3 font-semibold"
            >
              ✨ Access AI Intelligence
            </Link>
            
            <Link 
              href="/login"
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-lg inline-flex items-center gap-3"
            >
              🚀 Login to Dashboard
            </Link>
          </div>
        </div>

        {/* AI Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Strategic Advisor AI</h3>
            <p className="text-purple-200 text-sm mb-4">AI-powered strategic guidance trained on advanced business frameworks</p>
            <Link href="/ai-strategist" className="text-emerald-300 hover:text-emerald-200 text-sm font-medium">
              Access System →
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Implementation Coach</h3>
            <p className="text-purple-200 text-sm mb-4">AI coach for systematic execution and sprint planning</p>
            <Link href="/implementation-coach" className="text-blue-300 hover:text-blue-200 text-sm font-medium">
              Access System →
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Decision Engine</h3>
            <p className="text-purple-200 text-sm mb-4">AI-assisted decision making and scenario analysis</p>
            <div className="text-purple-400 text-sm">Coming Soon</div>
          </div>
        </div>

        {/* Intelligence Metrics */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-16">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Executive Intelligence Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-2xl font-bold text-white mb-2">87%</div>
              <div className="text-purple-200 text-sm">AI Utilization Rate</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="text-2xl font-bold text-white mb-2">2.3x</div>
              <div className="text-purple-200 text-sm">Faster Decision Speed</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-2xl font-bold text-white mb-2">24</div>
              <div className="text-purple-200 text-sm">Strategic Insights This Week</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready for AI-Powered Strategic Leadership?</h3>
          <p className="text-purple-200 mb-8 max-w-2xl mx-auto">
            Access the same AI intelligence that's helping 7-figure founders make better decisions faster.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/ai-intelligence"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-lg font-semibold"
            >
              Access AI Intelligence Hub
            </Link>
            
            <Link
              href="https://scalewithruth.com"
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-lg"
            >
              Learn About Our AI Systems
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}