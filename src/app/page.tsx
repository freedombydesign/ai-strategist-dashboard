import Link from 'next/link'
import { CogIcon, DocumentTextIcon, RocketLaunchIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Business Systemizer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transform your service business into a systematic, scalable operation.
            Get AI-powered workflows, templates, and step-by-step guidance to deliver consistent results.
          </p>
        </div>

        {/* Main CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
              <CogIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Systemize Your Business?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Start with our Service Delivery Systemizer to create workflows, templates,
            and standard operating procedures for consistent service delivery.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/service-delivery-systemizer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg inline-flex items-center gap-3 text-lg font-semibold"
            >
              <CogIcon className="w-6 h-6" />
              Start Systemizing
            </Link>

            <Link
              href="/dashboard"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-lg inline-flex items-center gap-3"
            >
              <RocketLaunchIcon className="w-6 h-6" />
              Access Dashboard
            </Link>
          </div>

          <div className="mt-8 flex justify-center items-center gap-4">
            <div className="text-sm text-gray-500">Already have an account?</div>
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign In
            </Link>
            <div className="w-px h-4 bg-gray-300"></div>
            <Link
              href="/signup"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-blue-100 mb-4 flex items-center justify-center mx-auto">
              <CogIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Delivery Systemizer</h3>
            <p className="text-gray-600">
              Create comprehensive workflows and standard operating procedures for consistent service delivery
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-purple-100 mb-4 flex items-center justify-center mx-auto">
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Template Manager</h3>
            <p className="text-gray-600">
              Generate and customize templates for proposals, onboarding, project management, and more
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-green-100 mb-4 flex items-center justify-center mx-auto">
              <SparklesIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Export Manager</h3>
            <p className="text-gray-600">
              Export your systems to Trello, Asana, ClickUp, Monday.com, or Notion with one click
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}