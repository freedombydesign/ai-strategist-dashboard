import Link from 'next/link'
import { CogIcon, DocumentDuplicateIcon, ShareIcon, ChartBarIcon, ArrowPathIcon, BoltIcon, HomeIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <CogIcon className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Business Systemizer
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your service delivery workflows into streamlined, repeatable systems.
            Generate custom templates and export to your favorite platforms.
          </p>
        </div>

        {/* Main Value Proposition */}
        <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-12 mb-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Discover Your Business Freedom Score & Systemize Everything
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto">
            Take our Freedom Diagnostic to discover your business archetype and get personalized sprint recommendations.
            Then analyze workflows, generate custom templates, and export to Trello, Asana, ClickUp, Monday.com, and Notion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-5 rounded-xl inline-flex items-center gap-3 text-lg font-semibold shadow-lg transition-all"
            >
              <HomeIcon className="w-6 h-6" />
              Open Dashboard
            </Link>

            <Link
              href="/login"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-5 rounded-xl inline-flex items-center gap-3 text-lg font-semibold shadow-lg transition-all"
            >
              <ChartBarIcon className="w-6 h-6" />
              Take Freedom Diagnostic
            </Link>

            <Link
              href="/login"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-5 rounded-xl inline-flex items-center gap-3 text-lg font-semibold shadow-lg transition-all"
            >
              <ArrowPathIcon className="w-6 h-6" />
              Analyze Workflow
            </Link>

            <Link
              href="/login"
              className="border-2 border-purple-600 hover:bg-purple-50 text-purple-700 px-10 py-5 rounded-xl inline-flex items-center gap-3 text-lg font-semibold transition-all"
            >
              <DocumentDuplicateIcon className="w-6 h-6" />
              Browse Templates
            </Link>

            <Link
              href="/login"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-5 rounded-xl inline-flex items-center gap-3 text-lg font-semibold shadow-lg transition-all"
            >
              <ChartBarIcon className="w-6 h-6" />
              Track Daily Activity
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-pink-100 mb-6 flex items-center justify-center mx-auto">
                <ChartBarIcon className="w-8 h-8 text-pink-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">1. Diagnose</h4>
              <p className="text-gray-600">
                Take our 15-question Freedom Diagnostic to discover your business archetype and get personalized recommendations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 mb-6 flex items-center justify-center mx-auto">
                <CogIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">2. Analyze</h4>
              <p className="text-gray-600">
                Describe your current workflows. Our AI identifies inefficiencies and generates sprint recommendations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 mb-6 flex items-center justify-center mx-auto">
                <BoltIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">3. Generate</h4>
              <p className="text-gray-600">
                Get customized templates, SOPs, and automation workflows optimized for your business freedom goals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 mb-6 flex items-center justify-center mx-auto">
                <ShareIcon className="w-8 h-8 text-violet-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">4. Export</h4>
              <p className="text-gray-600">
                One-click export to Trello, Asana, ClickUp, Monday.com, or Notion. Your team starts using it immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Integrations */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-12 text-center text-white mb-20">
          <h3 className="text-3xl font-bold mb-8">Seamless Platform Integration</h3>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Export your optimized workflows directly to the platforms your team already uses
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-lg font-semibold">
            <div className="bg-blue-600 px-6 py-3 rounded-lg">Trello</div>
            <div className="bg-red-500 px-6 py-3 rounded-lg">Asana</div>
            <div className="bg-purple-600 px-6 py-3 rounded-lg">ClickUp</div>
            <div className="bg-blue-500 px-6 py-3 rounded-lg">Monday.com</div>
            <div className="bg-gray-700 px-6 py-3 rounded-lg">Notion</div>
          </div>
          <div className="mt-8">
            <Link
              href="/login"
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-xl inline-flex items-center gap-3 font-semibold transition-all"
            >
              <ShareIcon className="w-6 h-6" />
              See Export Demo
            </Link>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Systemize Your Service Delivery?
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join service providers who've streamlined their workflows and freed up 10+ hours per week
          </p>
          <Link
            href="/login"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-12 py-6 rounded-xl inline-flex items-center gap-3 text-xl font-semibold shadow-lg transition-all"
          >
            <CogIcon className="w-7 h-7" />
            Start Systemizing Now
          </Link>
        </div>
      </div>
    </div>
  )
}