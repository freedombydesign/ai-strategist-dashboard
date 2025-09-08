'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  BarChart3,
  LineChart,
  PieChart,
  Users,
  FileText,
  Zap,
  Target,
  Shield,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

// Advanced mock data representing sophisticated cash flow analytics
const mockDashboardData = {
  currentCashPosition: 485750,
  projectedCashFlow: {
    conservative: 523840,
    realistic: 578320,
    optimistic: 634200,
    confidence: 87
  },
  weeklyForecast: [
    { week: 'Week 1', ending: '2024-01-07', inflow: 45000, outflow: 28000, netFlow: 17000, runningBalance: 502750, probability: 92 },
    { week: 'Week 2', ending: '2024-01-14', inflow: 52000, outflow: 31000, netFlow: 21000, runningBalance: 523750, probability: 89 },
    { week: 'Week 3', ending: '2024-01-21', inflow: 38000, outflow: 33000, netFlow: 5000, runningBalance: 528750, probability: 85 },
    { week: 'Week 4', ending: '2024-01-28', inflow: 61000, outflow: 35000, netFlow: 26000, runningBalance: 554750, probability: 88 },
    { week: 'Week 5', ending: '2024-02-04', inflow: 44000, outflow: 29000, netFlow: 15000, runningBalance: 569750, probability: 83 },
    { week: 'Week 6', ending: '2024-02-11', inflow: 39000, outflow: 32000, netFlow: 7000, runningBalance: 576750, probability: 81 }
  ],
  alerts: {
    critical: 2,
    high: 5,
    medium: 8,
    low: 3,
    items: [
      {
        id: 1,
        type: 'cash_gap_warning',
        severity: 'high',
        title: 'Projected Cash Shortage - Week 8',
        description: 'Conservative scenario shows potential $12K shortfall in 8 weeks',
        projectedDate: '2024-02-25',
        recommendedActions: ['Accelerate collections on $47K outstanding', 'Defer non-critical expenses'],
        timeToAction: '2 weeks'
      },
      {
        id: 2,
        type: 'payment_acceleration',
        severity: 'medium',
        title: 'Collection Opportunity Identified',
        description: '$89K in overdue invoices show high collection probability',
        expectedImpact: 'Improve cash position by $67K within 10 days',
        recommendedActions: ['Deploy automated collection sequence', 'Offer 2% early payment discount']
      }
    ]
  },
  paymentIntelligence: {
    totalOutstanding: 234750,
    overdueAmount: 89340,
    expectedCollections: 187250,
    collectionProbability: 79.6,
    averageCollectionDays: 38.5,
    riskDistribution: {
      lowRisk: 142000,
      mediumRisk: 67500,
      highRisk: 25250
    }
  },
  clientAnalytics: {
    totalClients: 47,
    averagePaymentScore: 78.3,
    topTierClients: 12,
    riskClients: 8,
    segmentPerformance: [
      { segment: 'Premium Partners', clients: 12, avgScore: 91.2, revenue: 215000, growth: 18.5 },
      { segment: 'Core Enterprise', clients: 18, avgScore: 82.1, revenue: 347000, growth: 12.3 },
      { segment: 'Growth Accounts', clients: 11, avgScore: 71.8, revenue: 156000, growth: 28.7 },
      { segment: 'Risk Management', clients: 6, avgScore: 54.2, revenue: 89000, growth: -5.2 }
    ]
  },
  accelerationMetrics: {
    activeStrategies: 8,
    collectionRate: 84.7,
    averageAcceleration: 12.3, // days
    revenueAccelerated: 167500,
    roi: 312.5,
    successfulInterventions: 23
  },
  keyInsights: [
    {
      type: 'forecast',
      title: 'Strong Q1 Outlook',
      description: '87% confidence in achieving $578K cash position by end of Q1',
      impact: 'positive',
      priority: 'high'
    },
    {
      type: 'risk',
      title: 'Client Concentration Risk',
      description: 'Top 3 clients represent 47% of outstanding receivables',
      impact: 'warning',
      priority: 'high'
    },
    {
      type: 'opportunity',
      title: 'Acceleration Potential',
      description: '$127K in receivables show high early payment probability',
      impact: 'opportunity',
      priority: 'medium'
    }
  ]
}

export default function CashFlowCommandDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [timeframe, setTimeframe] = useState('13-week')

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/freedom-suite" 
                className="text-slate-600 hover:text-slate-800 text-sm font-medium flex items-center gap-2"
              >
                ← Back to Systems
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                  Cash Flow Command
                </h1>
                <p className="text-slate-600 text-lg">
                  Advanced cash flow intelligence and predictive analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select 
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="13-week">13-Week Forecast</option>
                <option value="26-week">26-Week Forecast</option>
                <option value="52-week">52-Week Forecast</option>
              </select>
              <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50">
                Filters
              </button>
              <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50">
                Export
              </button>
              <button 
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 disabled:opacity-50" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium">
                Run Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Critical Alerts Banner */}
        {mockDashboardData.alerts.critical > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Critical Cash Flow Alerts</h3>
                  <p className="text-red-700 text-sm">
                    {mockDashboardData.alerts.critical} critical alerts require immediate attention
                  </p>
                </div>
              </div>
              <button className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
                View Alerts
              </button>
            </div>
          </div>
        )}

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ExecutiveMetricCard
            title="Current Cash Position"
            value={`$${(mockDashboardData.currentCashPosition / 1000).toFixed(0)}K`}
            subtitle="As of today"
            trend={{ value: 8.2, direction: 'up' }}
            icon={<DollarSign className="h-5 w-5" />}
            className="border-l-4 border-l-green-500"
          />
          <ExecutiveMetricCard
            title="13-Week Forecast"
            value={`$${(mockDashboardData.projectedCashFlow.realistic / 1000).toFixed(0)}K`}
            subtitle={`${mockDashboardData.projectedCashFlow.confidence}% confidence`}
            trend={{ value: 19.1, direction: 'up' }}
            icon={<TrendingUp className="h-5 w-5" />}
            className="border-l-4 border-l-blue-500"
          />
          <ExecutiveMetricCard
            title="Outstanding Receivables"
            value={`$${(mockDashboardData.paymentIntelligence.totalOutstanding / 1000).toFixed(0)}K`}
            subtitle={`${mockDashboardData.paymentIntelligence.collectionProbability}% collection probability`}
            trend={{ value: -3.1, direction: 'down' }}
            icon={<FileText className="h-5 w-5" />}
            className="border-l-4 border-l-amber-500"
          />
          <ExecutiveMetricCard
            title="Collection Performance"
            value={`${mockDashboardData.accelerationMetrics.collectionRate}%`}
            subtitle={`${mockDashboardData.accelerationMetrics.averageAcceleration} day acceleration`}
            trend={{ value: 5.7, direction: 'up' }}
            icon={<Target className="h-5 w-5" />}
            className="border-l-4 border-l-purple-500"
          />
        </div>

        {/* Main Dashboard Content */}
        <div className="space-y-6">
          <div className="flex gap-1 bg-slate-100/50 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('forecast')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'forecast' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              Forecast
            </button>
            <button 
              onClick={() => setActiveTab('alerts')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'alerts' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              Alerts
            </button>
            <button 
              onClick={() => setActiveTab('clients')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'clients' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              Clients
            </button>
            <button 
              onClick={() => setActiveTab('acceleration')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'acceleration' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              Acceleration
            </button>
            <button 
              onClick={() => setActiveTab('intelligence')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'intelligence' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              Intelligence
            </button>
          </div>

          {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cash Flow Forecast Chart */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="border-b border-slate-100 pb-4 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-blue-600" />
                      13-Week Cash Flow Forecast
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 border border-green-200 rounded text-sm text-green-700 bg-green-50">
                        {mockDashboardData.projectedCashFlow.confidence}% Confidence
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <CashFlowForecastChart data={mockDashboardData.weeklyForecast} />
                </div>
              </div>

              {/* Key Insights Panel */}
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="border-b border-slate-100 pb-4 p-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Strategic Insights
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {mockDashboardData.keyInsights.map((insight, index) => (
                      <InsightCard key={index} insight={insight} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Performance Matrix */}
            <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="border-b border-slate-100 pb-4 p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Client Performance Matrix
                </h3>
              </div>
              <div className="p-6">
                <ClientPerformanceMatrix segments={mockDashboardData.clientAnalytics.segmentPerformance} />
              </div>
            </div>

            {/* Payment Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="border-b border-slate-100 pb-4 p-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-emerald-600" />
                    Payment Risk Distribution
                  </h3>
                </div>
                <div className="p-6">
                  <PaymentRiskChart riskData={mockDashboardData.paymentIntelligence.riskDistribution} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="border-b border-slate-100 pb-4 p-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    Acceleration Performance
                  </h3>
                </div>
                <div className="p-6">
                  <AccelerationMetrics metrics={mockDashboardData.accelerationMetrics} />
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'forecast' && (
            <ForecastingInterface data={mockDashboardData} />
          )}

          {activeTab === 'alerts' && (
            <AlertsManagement alerts={mockDashboardData.alerts} />
          )}

          {activeTab === 'clients' && (
            <ClientAnalyticsDashboard analytics={mockDashboardData.clientAnalytics} />
          )}

          {activeTab === 'acceleration' && (
            <AccelerationDashboard metrics={mockDashboardData.accelerationMetrics} />
          )}

          {activeTab === 'intelligence' && (
            <BusinessIntelligence data={mockDashboardData} />
          )}
        </div>
      </div>
    </div>
  )
}

function ExecutiveMetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  className = "" 
}: {
  title: string
  value: string
  subtitle: string
  trend: { value: number; direction: 'up' | 'down' | 'flat' }
  icon: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <div className="text-slate-600">
                  {icon}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">{title}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{subtitle}</span>
                <div className={`flex items-center gap-1 text-xs ${
                  trend.direction === 'up' ? 'text-emerald-600' : 
                  trend.direction === 'down' ? 'text-red-600' : 
                  'text-slate-500'
                }`}>
                  {trend.direction === 'up' && <ArrowUpRight className="h-3 w-3" />}
                  {trend.direction === 'down' && <ArrowDownRight className="h-3 w-3" />}
                  {trend.direction === 'flat' && <Minus className="h-3 w-3" />}
                  <span className="font-medium">{Math.abs(trend.value)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CashFlowForecastChart({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg border">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Conservative</p>
          <p className="text-xl font-bold text-red-700 mt-1">$524K</p>
          <p className="text-xs text-red-600">80% confidence</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Realistic</p>
          <p className="text-xl font-bold text-blue-700 mt-1">$578K</p>
          <p className="text-xs text-blue-600">87% confidence</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Optimistic</p>
          <p className="text-xl font-bold text-green-700 mt-1">$634K</p>
          <p className="text-xs text-green-600">65% confidence</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {data.slice(0, 6).map((week, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-slate-900">{week.week}</div>
              <div className="text-xs text-slate-600">{week.ending}</div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-emerald-600 font-medium">+${(week.inflow / 1000).toFixed(0)}K</div>
              <div className="text-red-600 font-medium">-${(week.outflow / 1000).toFixed(0)}K</div>
              <div className={`font-bold ${week.netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {week.netFlow >= 0 ? '+' : ''}${(week.netFlow / 1000).toFixed(0)}K
              </div>
              <div className="text-slate-900 font-bold">${(week.runningBalance / 1000).toFixed(0)}K</div>
              <div className="text-xs bg-slate-200 px-2 py-1 rounded">{week.probability}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: any }) {
  const iconMap = {
    forecast: <TrendingUp className="h-4 w-4" />,
    risk: <AlertTriangle className="h-4 w-4" />,
    opportunity: <Target className="h-4 w-4" />
  }

  const colorMap = {
    positive: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    opportunity: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <div className={`p-3 rounded-lg border ${colorMap[insight.impact as keyof typeof colorMap]}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          {iconMap[insight.type as keyof typeof iconMap]}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
          <p className="text-xs leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </div>
  )
}

function ClientPerformanceMatrix({ segments }: { segments: any[] }) {
  return (
    <div className="space-y-4">
      {segments.map((segment, index) => (
        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm font-bold rounded">
              {segment.clients}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">{segment.segment}</h4>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Score: {segment.avgScore}</span>
                <span>Revenue: ${(segment.revenue / 1000).toFixed(0)}K</span>
                <div className={`flex items-center gap-1 ${segment.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {segment.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(segment.growth)}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900">${(segment.revenue / 1000).toFixed(0)}K</div>
            <div className="text-sm text-slate-600">Avg Score: {segment.avgScore}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PaymentRiskChart({ riskData }: { riskData: any }) {
  const total = riskData.lowRisk + riskData.mediumRisk + riskData.highRisk
  
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-sm font-medium">Low Risk</span>
          </div>
          <div className="text-right">
            <div className="font-bold">${(riskData.lowRisk / 1000).toFixed(0)}K</div>
            <div className="text-xs text-slate-500">{Math.round((riskData.lowRisk / total) * 100)}%</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-sm font-medium">Medium Risk</span>
          </div>
          <div className="text-right">
            <div className="font-bold">${(riskData.mediumRisk / 1000).toFixed(0)}K</div>
            <div className="text-xs text-slate-500">{Math.round((riskData.mediumRisk / total) * 100)}%</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">High Risk</span>
          </div>
          <div className="text-right">
            <div className="font-bold">${(riskData.highRisk / 1000).toFixed(0)}K</div>
            <div className="text-xs text-slate-500">{Math.round((riskData.highRisk / total) * 100)}%</div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">${(total / 1000).toFixed(0)}K</div>
          <div className="text-sm text-slate-600">Total Exposure</div>
        </div>
      </div>
    </div>
  )
}

function AccelerationMetrics({ metrics }: { metrics: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-slate-900">{metrics.activeStrategies}</div>
          <div className="text-xs text-slate-600 uppercase tracking-wide">Active Strategies</div>
        </div>
        <div className="text-center p-3 bg-emerald-50 rounded-lg">
          <div className="text-2xl font-bold text-emerald-700">{metrics.collectionRate}%</div>
          <div className="text-xs text-emerald-600 uppercase tracking-wide">Success Rate</div>
        </div>
      </div>
      
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Average Acceleration</span>
          <span className="font-bold">{metrics.averageAcceleration} days</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Revenue Accelerated</span>
          <span className="font-bold">${(metrics.revenueAccelerated / 1000).toFixed(0)}K</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">ROI</span>
          <span className="font-bold text-emerald-600">{metrics.roi}%</span>
        </div>
      </div>
    </div>
  )
}

// Placeholder components for other tabs
function ForecastingInterface({ data }: { data: any }) {
  return (
    <div className="bg-white border-0 shadow-lg rounded-lg">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold">Advanced Forecasting Interface</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600">Sophisticated forecasting interface with scenario modeling coming soon...</p>
      </div>
    </div>
  )
}

function AlertsManagement({ alerts }: { alerts: any }) {
  return (
    <div className="bg-white border-0 shadow-lg rounded-lg">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold">Alert Management Center</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600">Comprehensive alert management interface coming soon...</p>
      </div>
    </div>
  )
}

function ClientAnalyticsDashboard({ analytics }: { analytics: any }) {
  return (
    <div className="bg-white border-0 shadow-lg rounded-lg">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold">Client Analytics Dashboard</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600">Advanced client analytics and scoring interface coming soon...</p>
      </div>
    </div>
  )
}

function AccelerationDashboard({ metrics }: { metrics: any }) {
  return (
    <div className="bg-white border-0 shadow-lg rounded-lg">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold">Payment Acceleration Dashboard</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600">Payment acceleration tools and optimization interface coming soon...</p>
      </div>
    </div>
  )
}

function BusinessIntelligence({ data }: { data: any }) {
  return (
    <div className="bg-white border-0 shadow-lg rounded-lg">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold">Business Intelligence Center</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600">Advanced business intelligence and predictive analytics coming soon...</p>
      </div>
    </div>
  )
}