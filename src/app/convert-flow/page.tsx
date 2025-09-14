'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  FileText, 
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

// Mock data - in production this would come from API calls
const mockDashboardData = {
  summary: {
    leads: {
      total: 847,
      qualified: 203,
      qualificationRate: 24,
      growth: 18.5,
      avgScore: 67
    },
    proposals: {
      total: 89,
      accepted: 34,
      winRate: 38.2,
      totalValue: 2850000,
      avgValue: 32000
    },
    revenue: {
      total: 1650000,
      growth: 23.7,
      proposals: 1200000,
      funnels: 450000
    },
    funnels: {
      active: 12
    }
  },
  topPerformingFunnels: [
    {
      id: '1',
      name: 'Strategic Consulting Authority Builder',
      type: 'consulting',
      revenue: 450000,
      conversions: 89,
      visitors: 2340,
      avgConversionRate: 3.8,
      revenuePerVisitor: 192.31
    },
    {
      id: '2', 
      name: 'Legal Business Protection Audit',
      type: 'legal',
      revenue: 280000,
      conversions: 67,
      visitors: 1890,
      avgConversionRate: 3.5,
      revenuePerVisitor: 148.15
    }
  ],
  recentActivities: [
    {
      id: '1',
      type: 'proposal_created',
      leadName: 'Sarah Chen',
      company: 'TechFlow Innovations',
      description: 'New proposal generated for strategic consulting',
      timestamp: '2024-01-15T10:30:00Z',
      scoreChange: 15
    },
    {
      id: '2',
      type: 'lead_qualified', 
      leadName: 'Michael Rodriguez',
      company: 'Growth Partners LLC',
      description: 'Lead qualification completed - scored as HOT',
      timestamp: '2024-01-15T09:45:00Z',
      scoreChange: 25
    }
  ]
}

export default function ConvertFlowDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
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
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  ConvertFlow
                </h1>
                <p className="text-slate-600 mt-1">
                  Automated sales systems that convert prospects into clients
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                New Funnel
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Leads"
            value={mockDashboardData.summary.leads.total.toLocaleString()}
            subtitle={`${mockDashboardData.summary.leads.qualified} qualified`}
            change={mockDashboardData.summary.leads.growth}
            icon={<Users className="h-5 w-5" />}
            trend="up"
          />
          <MetricCard
            title="Proposal Win Rate"
            value={`${mockDashboardData.summary.proposals.winRate}%`}
            subtitle={`${mockDashboardData.summary.proposals.accepted}/${mockDashboardData.summary.proposals.total} accepted`}
            change={5.2}
            icon={<FileText className="h-5 w-5" />}
            trend="up"
          />
          <MetricCard
            title="Revenue Generated"
            value={`$${(mockDashboardData.summary.revenue.total / 1000000).toFixed(1)}M`}
            subtitle="Last 30 days"
            change={mockDashboardData.summary.revenue.growth}
            icon={<DollarSign className="h-5 w-5" />}
            trend="up"
          />
          <MetricCard
            title="Active Funnels"
            value={mockDashboardData.summary.funnels.active}
            subtitle="Converting prospects"
            change={2}
            icon={<Target className="h-5 w-5" />}
            trend="up"
          />
        </div>

        {/* Main Content Tabs */}
        <div className="space-y-6">
          <div className="flex gap-1 bg-slate-100/50 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'overview' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('funnels')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'funnels' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              <Target className="h-4 w-4" />
              Funnels
            </button>
            <button 
              onClick={() => setActiveTab('leads')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'leads' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              <Users className="h-4 w-4" />
              Leads
            </button>
            <button 
              onClick={() => setActiveTab('proposals')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'proposals' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              <FileText className="h-4 w-4" />
              Proposals
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'analytics' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              <PieChart className="h-4 w-4" />
              Analytics
            </button>
          </div>

          {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Performing Funnels */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="border-b border-slate-100 pb-4 p-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Top Performing Funnels
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {mockDashboardData.topPerformingFunnels.map((funnel, index) => (
                      <FunnelPerformanceRow key={funnel.id} funnel={funnel} rank={index + 1} />
                    ))}
                  </div>
                  <button className="w-full mt-4 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50">
                    View All Funnels
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="border-b border-slate-100 pb-4 p-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Recent Activity
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {mockDashboardData.recentActivities.map((activity) => (
                      <ActivityRow key={activity.id} activity={activity} />
                    ))}
                  </div>
                  <button className="w-full mt-4 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50">
                    View All Activity
                  </button>
                </div>
              </div>
            </div>

            {/* Revenue Forecast */}
            <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="border-b border-slate-100 pb-4 p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Revenue Forecast
                </h3>
              </div>
              <div className="p-6">
                <RevenueForecastChart />
              </div>
            </div>
          </div>
          )}

          {activeTab === 'funnels' && (
            <FunnelManagement />
          )}

          {activeTab === 'leads' && (
            <LeadManagement />
          )}

          {activeTab === 'proposals' && (
            <ProposalManagement />
          )}

          {activeTab === 'analytics' && (
            <AdvancedAnalytics />
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  change, 
  icon, 
  trend 
}: {
  title: string
  value: string | number
  subtitle: string
  change: number
  icon: React.ReactNode
  trend: 'up' | 'down'
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="text-blue-600">
                {icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">{title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">{value}</span>
                <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{Math.abs(change)}%</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FunnelPerformanceRow({ funnel, rank }: { funnel: any, rank: number }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded">
          {rank}
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">{funnel.name}</h4>
          <p className="text-sm text-slate-600">
            {funnel.conversions} conversions • {funnel.avgConversionRate}% rate
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg text-slate-900">
          ${(funnel.revenue / 1000).toFixed(0)}K
        </p>
        <p className="text-sm text-slate-600">
          ${funnel.revenuePerVisitor.toFixed(0)}/visitor
        </p>
      </div>
    </div>
  )
}

function ActivityRow({ activity }: { activity: any }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'proposal_created':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'lead_qualified':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'email_opened':
        return <Activity className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-slate-600" />
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-50 rounded-lg mt-1">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900">{activity.leadName}</p>
        <p className="text-sm text-slate-600">{activity.company}</p>
        <p className="text-sm text-slate-500 mt-1">{activity.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white">
            +{activity.scoreChange} points
          </span>
          <span className="text-xs text-slate-500">
            {new Date(activity.timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}

function RevenueForecastChart() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-sm font-medium text-red-600">Conservative</p>
          <p className="text-2xl font-bold text-red-700 mt-1">$890K</p>
          <p className="text-xs text-red-600 mt-1">80% confidence</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-600">Realistic</p>
          <p className="text-2xl font-bold text-green-700 mt-1">$1.2M</p>
          <p className="text-xs text-green-600 mt-1">85% confidence</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Optimistic</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">$1.6M</p>
          <p className="text-xs text-blue-600 mt-1">65% confidence</p>
        </div>
      </div>
      
      {/* Placeholder for actual chart */}
      <div className="h-64 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg flex items-center justify-center">
        <p className="text-slate-500">Revenue Forecast Chart</p>
      </div>
    </div>
  )
}

function FunnelManagement() {
  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-slate-100 pb-4 p-6">
        <h3 className="text-lg font-semibold">Funnel Management</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600">Funnel management interface coming soon...</p>
      </div>
    </div>
  )
}

function LeadManagement() {
  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-slate-100 pb-4 p-6">
        <h3 className="text-lg font-semibold">Lead Management</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600">Lead management interface coming soon...</p>
      </div>
    </div>
  )
}

function ProposalManagement() {
  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-slate-100 pb-4 p-6">
        <h3 className="text-lg font-semibold">Proposal Management</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600">Proposal management interface coming soon...</p>
      </div>
    </div>
  )
}

function AdvancedAnalytics() {
  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-slate-100 pb-4 p-6">
        <h3 className="text-lg font-semibold">Advanced Analytics</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-600">Advanced analytics interface coming soon...</p>
      </div>
    </div>
  )
}