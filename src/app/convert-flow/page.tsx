'use client'

import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                ConvertFlow
              </h1>
              <p className="text-slate-600 mt-1">
                Automated sales systems that convert prospects into clients
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2">
                <Zap className="h-4 w-4" />
                New Funnel
              </Button>
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="funnels" className="gap-2">
              <Target className="h-4 w-4" />
              Funnels
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="proposals" className="gap-2">
              <FileText className="h-4 w-4" />
              Proposals
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <PieChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Performing Funnels */}
              <Card className="lg:col-span-2 border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Top Performing Funnels
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {mockDashboardData.topPerformingFunnels.map((funnel, index) => (
                      <FunnelPerformanceRow key={funnel.id} funnel={funnel} rank={index + 1} />
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Funnels
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {mockDashboardData.recentActivities.map((activity) => (
                      <ActivityRow key={activity.id} activity={activity} />
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Activity
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Forecast */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Revenue Forecast
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <RevenueForecastChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funnels">
            <FunnelManagement />
          </TabsContent>

          <TabsContent value="leads">
            <LeadManagement />
          </TabsContent>

          <TabsContent value="proposals">
            <ProposalManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AdvancedAnalytics />
          </TabsContent>
        </Tabs>
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
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardContent className="p-6">
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
      </CardContent>
    </Card>
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
          <Badge variant="outline" className="text-xs">
            +{activity.scoreChange} points
          </Badge>
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
    <Card className="border-0 shadow-md">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Funnel Management</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-slate-600">Funnel management interface coming soon...</p>
      </CardContent>
    </Card>
  )
}

function LeadManagement() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Lead Management</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-slate-600">Lead management interface coming soon...</p>
      </CardContent>
    </Card>
  )
}

function ProposalManagement() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Proposal Management</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-slate-600">Proposal management interface coming soon...</p>
      </CardContent>
    </Card>
  )
}

function AdvancedAnalytics() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Advanced Analytics</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-slate-600">Advanced analytics interface coming soon...</p>
      </CardContent>
    </Card>
  )
}