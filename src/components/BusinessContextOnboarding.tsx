'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface BusinessContextData {
  // Business Basics
  businessName: string
  businessModel: 'B2B' | 'B2C' | 'B2B2C' | 'Marketplace' | 'Other'
  revenueModel: string
  currentRevenue: string
  teamSize: string
  growthStage: 'Startup' | 'Growth' | 'Scale' | 'Established'
  
  // Market & Positioning
  targetMarket: string
  idealClientProfile: {
    title: string
    companySize: string
    painPoints: string
  }
  uniqueValueProposition: string
  mainCompetitors: string
  competitiveAdvantage: string
  
  // Current Challenges
  topBottlenecks: string[]
  biggestChallenge: string
  previousFrameworks: string
  
  // Goals & Vision
  primaryGoal: string
  successMetrics: string
  timeframe: string
  
  // Additional Context
  industry: string
  businessAge: string
  websiteUrl: string
  additionalContext: string
}

interface BusinessContextOnboardingProps {
  onComplete: (data: BusinessContextData) => void
  onSkip: () => void
  existingData?: BusinessContextData
}

const BOTTLENECK_OPTIONS = [
  'Lead generation & marketing',
  'Sales process & conversion',
  'Service delivery & fulfillment', 
  'Team management & hiring',
  'Systems & processes',
  'Pricing & profitability',
  'Time management & overwhelm',
  'Cash flow & financial management',
  'Customer retention & growth',
  'Strategic planning & direction'
]

export default function BusinessContextOnboarding({ onComplete, onSkip, existingData }: BusinessContextOnboardingProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<BusinessContextData>(existingData || {
    businessName: '',
    businessModel: 'B2B',
    revenueModel: '',
    currentRevenue: '',
    teamSize: '',
    growthStage: 'Growth',
    targetMarket: '',
    idealClientProfile: {
      title: '',
      companySize: '',
      painPoints: ''
    },
    uniqueValueProposition: '',
    mainCompetitors: '',
    competitiveAdvantage: '',
    topBottlenecks: [],
    biggestChallenge: '',
    previousFrameworks: '',
    primaryGoal: '',
    successMetrics: '',
    timeframe: '',
    industry: '',
    businessAge: '',
    websiteUrl: '',
    additionalContext: ''
  })

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof BusinessContextData] as any),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleBottleneckToggle = (bottleneck: string) => {
    setFormData(prev => ({
      ...prev,
      topBottlenecks: prev.topBottlenecks.includes(bottleneck)
        ? prev.topBottlenecks.filter(b => b !== bottleneck)
        : [...prev.topBottlenecks, bottleneck].slice(0, 3) // Max 3
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/business-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          contextData: formData
        })
      })

      if (response.ok) {
        onComplete(formData)
      } else {
        console.error('Failed to save business context')
        alert('Failed to save your information. Please try again.')
      }
    } catch (error) {
      console.error('Error saving business context:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return formData.businessName && formData.businessModel && formData.industry
      case 2:
        return formData.currentRevenue && formData.teamSize && formData.growthStage
      case 3:
        return formData.targetMarket && formData.idealClientProfile.title && formData.uniqueValueProposition
      case 4:
        return formData.topBottlenecks.length > 0 && formData.biggestChallenge
      case 5:
        return formData.primaryGoal && formData.timeframe
      default:
        return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Let's Get Your AI Strategist Up to Speed
        </h2>
        <p className="text-gray-600">
          The more I know about your business, the better I can help you grow
        </p>
        
        {/* Progress Bar */}
        <div className="mt-6 max-w-md mx-auto">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {currentStep} of 5</span>
            <span>{Math.round((currentStep / 5) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[500px]">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Basic Business Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business/Company Name *
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry/Niche *
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Digital Marketing, SaaS, Consulting, E-commerce"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Model *
              </label>
              <select
                value={formData.businessModel}
                onChange={(e) => handleInputChange('businessModel', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="B2B">B2B (Business to Business)</option>
                <option value="B2C">B2C (Business to Consumer)</option>
                <option value="B2B2C">B2B2C (Business to Business to Consumer)</option>
                <option value="Marketplace">Marketplace/Platform</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revenue Model
              </label>
              <input
                type="text"
                value={formData.revenueModel}
                onChange={(e) => handleInputChange('revenueModel', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Subscription, One-time sales, Commission, Retainer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Business Scale & Stage</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Annual Revenue Range *
              </label>
              <select
                value={formData.currentRevenue}
                onChange={(e) => handleInputChange('currentRevenue', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select revenue range...</option>
                <option value="Pre-revenue">Pre-revenue</option>
                <option value="$0-10k">$0 - $10k</option>
                <option value="$10k-50k">$10k - $50k</option>
                <option value="$50k-100k">$50k - $100k</option>
                <option value="$100k-500k">$100k - $500k</option>
                <option value="$500k-1M">$500k - $1M</option>
                <option value="$1M-5M">$1M - $5M</option>
                <option value="$5M+">$5M+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Size (including yourself) *
              </label>
              <select
                value={formData.teamSize}
                onChange={(e) => handleInputChange('teamSize', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select team size...</option>
                <option value="Just me">Just me (solopreneur)</option>
                <option value="2-5">2-5 people</option>
                <option value="6-10">6-10 people</option>
                <option value="11-25">11-25 people</option>
                <option value="26-50">26-50 people</option>
                <option value="50+">50+ people</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Growth Stage *
              </label>
              <div className="space-y-3">
                {[
                  { value: 'Startup', label: 'Startup - Validating product-market fit' },
                  { value: 'Growth', label: 'Growth - Scaling revenue and operations' },
                  { value: 'Scale', label: 'Scale - Optimizing and systematizing' },
                  { value: 'Established', label: 'Established - Mature, stable business' }
                ].map((option) => (
                  <label key={option.value} className="flex items-start">
                    <input
                      type="radio"
                      name="growthStage"
                      value={option.value}
                      checked={formData.growthStage === option.value}
                      onChange={(e) => handleInputChange('growthStage', e.target.value)}
                      className="mt-1 mr-3 focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.value}</div>
                      <div className="text-sm text-gray-600">{option.label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How long have you been in business?
              </label>
              <select
                value={formData.businessAge}
                onChange={(e) => handleInputChange('businessAge', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select business age...</option>
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1-2 years">1-2 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="6-10 years">6-10 years</option>
                <option value="10+ years">10+ years</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Target Market & Positioning</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Market Description *
              </label>
              <textarea
                value={formData.targetMarket}
                onChange={(e) => handleInputChange('targetMarket', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                placeholder="Who is your target market? Be as specific as possible..."
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ideal Client Job Title *
                </label>
                <input
                  type="text"
                  value={formData.idealClientProfile.title}
                  onChange={(e) => handleInputChange('idealClientProfile.title', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., CEO, Marketing Director"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <input
                  type="text"
                  value={formData.idealClientProfile.companySize}
                  onChange={(e) => handleInputChange('idealClientProfile.companySize', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 50-500 employees"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Their Main Pain Points
                </label>
                <input
                  type="text"
                  value={formData.idealClientProfile.painPoints}
                  onChange={(e) => handleInputChange('idealClientProfile.painPoints', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What keeps them up at night?"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unique Value Proposition *
              </label>
              <textarea
                value={formData.uniqueValueProposition}
                onChange={(e) => handleInputChange('uniqueValueProposition', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                placeholder="What makes you different from competitors? What unique value do you provide?"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Competitors
                </label>
                <input
                  type="text"
                  value={formData.mainCompetitors}
                  onChange={(e) => handleInputChange('mainCompetitors', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="List your top 3 competitors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Competitive Advantage
                </label>
                <input
                  type="text"
                  value={formData.competitiveAdvantage}
                  onChange={(e) => handleInputChange('competitiveAdvantage', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What do you do better?"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Current Challenges & Bottlenecks</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Top 3 Bottlenecks * ({formData.topBottlenecks.length}/3)
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                {BOTTLENECK_OPTIONS.map((bottleneck) => (
                  <label key={bottleneck} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.topBottlenecks.includes(bottleneck)}
                      onChange={() => handleBottleneckToggle(bottleneck)}
                      disabled={formData.topBottlenecks.length >= 3 && !formData.topBottlenecks.includes(bottleneck)}
                      className="mr-3 mt-1 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className={formData.topBottlenecks.includes(bottleneck) ? 'font-medium text-blue-900' : 'text-gray-700'}>
                      {bottleneck}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your biggest challenge right now? *
              </label>
              <textarea
                value={formData.biggestChallenge}
                onChange={(e) => handleInputChange('biggestChallenge', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                placeholder="Describe your biggest business challenge in detail..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Have you used any business frameworks or methodologies before?
              </label>
              <textarea
                value={formData.previousFrameworks}
                onChange={(e) => handleInputChange('previousFrameworks', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                placeholder="e.g., EOS, Scaling Up, StoryBrand, specific coaching programs, etc."
              />
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Goals & Vision</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your primary business goal for the next 12 months? *
              </label>
              <textarea
                value={formData.primaryGoal}
                onChange={(e) => handleInputChange('primaryGoal', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                placeholder="Be specific about what you want to achieve..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How will you measure success?
              </label>
              <input
                type="text"
                value={formData.successMetrics}
                onChange={(e) => handleInputChange('successMetrics', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Revenue growth, number of clients, time savings..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your timeline for achieving this goal? *
              </label>
              <select
                value={formData.timeframe}
                onChange={(e) => handleInputChange('timeframe', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select timeframe...</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="12 months">12 months</option>
                <option value="18 months">18 months</option>
                <option value="2+ years">2+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anything else you'd like me to know about your business?
              </label>
              <textarea
                value={formData.additionalContext}
                onChange={(e) => handleInputChange('additionalContext', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                placeholder="Share any additional context that would help me better understand your business and provide more personalized guidance..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          )}
          
          <button
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Skip for now
          </button>
        </div>

        <div>
          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              disabled={!isStepComplete(currentStep)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isStepComplete(currentStep)
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStepComplete(currentStep) || isSubmitting}
              className={`px-8 py-2 rounded-lg font-medium transition-colors ${
                isStepComplete(currentStep) && !isSubmitting
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}