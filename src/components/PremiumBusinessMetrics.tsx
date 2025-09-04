'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { businessMetricsService } from '@/services/businessMetricsService'
import { motion } from 'framer-motion'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card'
import { Progress } from './ui/Progress'
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, formatPercentage } from '@/lib/utils'

// Sample data - in real implementation, this would come from your backend
const revenueData = [
  { month: 'Jan', revenue: 42000, profit: 12600 },
  { month: 'Feb', revenue: 38000, profit: 11400 },
  { month: 'Mar', revenue: 45000, profit: 13500 },
  { month: 'Apr', revenue: 52000, profit: 15600 },
  { month: 'May', revenue: 48000, profit: 14400 },
  { month: 'Jun', revenue: 56000, profit: 16800 },
]

const clientHealthData = [
  { name: 'Excellent', value: 35, color: '#10B981' },
  { name: 'Good', value: 40, color: '#D4AF37' },
  { name: 'At Risk', value: 20, color: '#F59E0B' },
  { name: 'Critical', value: 5, color: '#EF4444' },
]

const kpiData = [
  {
    title: 'Monthly Revenue',
    value: '$56,000',
    change: '+12.5%',
    trend: 'up',
    icon: CurrencyDollarIcon,
    description: 'vs last month'
  },
  {
    title: 'Active Clients',
    value: '34',
    change: '+2',
    trend: 'up', 
    icon: UsersIcon,
    description: 'new this month'
  },
  {
    title: 'Avg. Project Value',
    value: '$8,400',
    change: '+5.2%',
    trend: 'up',
    icon: TrophyIcon,
    description: 'vs last quarter'
  },
  {
    title: 'Time to Delivery',
    value: '12 days',
    change: '-2.1%',
    trend: 'down',
    icon: ClockIcon,
    description: 'improvement'
  },
]

interface KPICardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
  description: string
  index: number
}

function KPICard({ title, value, change, trend, icon: Icon, description, index }: KPICardProps) {
  const isPositive = trend === 'up'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card variant="default" hover="lift">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isPositive 
                  ? 'bg-gradient-to-br from-success/10 to-success/20 text-success'
                  : 'bg-gradient-to-br from-warning/10 to-warning/20 text-warning'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-body text-sm text-medium-gray font-medium">{title}</p>
                <p className="text-display text-2xl font-bold text-foreground mt-1">{value}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`flex items-center gap-1 ${
                isPositive ? 'text-success' : 'text-warning'
              }`}>
                {isPositive ? (
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                )}
                <span className="text-sm font-semibold">{change}</span>
              </div>
              <p className="text-xs text-medium-gray mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function PremiumBusinessMetrics() {
  const { user } = useAuth()
  const [businessData, setBusinessData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadBusinessData()
    }
  }, [user?.id])

  const loadBusinessData = async () => {
    try {
      const data = await businessMetricsService.getBusinessAnalytics(user!.id)
      setBusinessData(data)
    } catch (error) {
      console.error('[BUSINESS-METRICS] Error loading data:', error)
      // Use sample data as fallback
      setBusinessData({
        totalSnapshots: 0,
        latestRevenue: 0,
        latestExpenses: 0,
        recentTrend: 'stable'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-64 bg-light-gray rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-light-gray rounded-lg"></div>
          <div className="h-48 bg-light-gray rounded-lg"></div>
        </div>
      </div>
    )
  }

  // Use real data or show empty state
  const hasData = businessData && businessData.totalSnapshots > 0
  const currentRevenue = businessData?.latestRevenue || 0
  const displayData = hasData ? businessData : { revenue: 0, profit: 0, trend: 'stable' }

  return (
    <div className="space-y-8">
      {/* KPI Overview */}
      <section>
        <div className="mb-6">
          <h2 className="text-display text-2xl font-bold text-foreground mb-2">
            Business Performance
          </h2>
          <p className="text-body text-medium-gray">
            Real-time insights into your business health and growth metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <KPICard key={kpi.title} {...kpi} index={index} />
          ))}
        </div>
      </section>

      {/* Revenue & Profit Trends */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card variant="default" hover="glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rich-gold to-rose-gold flex items-center justify-center">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-white" />
                </div>
                Revenue & Profit Trends
              </CardTitle>
              <CardDescription>
                Monthly performance over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B76E79" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#B76E79" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    fill="#8E8E8E"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    fill="#8E8E8E"
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value, name) => [
                      `$${value?.toLocaleString()}`, 
                      name === 'revenue' ? 'Revenue' : 'Profit'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#D4AF37" 
                    strokeWidth={3}
                    fill="url(#revenueGradient)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#B76E79" 
                    strokeWidth={3}
                    fill="url(#profitGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Client Health Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card variant="default" hover="glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-green-600 flex items-center justify-center">
                  <UsersIcon className="w-4 h-4 text-white" />
                </div>
                Client Health Score
              </CardTitle>
              <CardDescription>
                Distribution of your client relationship health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={clientHealthData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {clientHealthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid rgba(0,0,0,0.05)',
                          borderRadius: '12px',
                        }}
                        formatter={(value) => [`${value}%`, 'Percentage']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3 ml-4">
                  {clientHealthData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="text-body text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-medium-gray">
                          {item.value}% ({Math.round(34 * item.value / 100)} clients)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Business Health Score */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card variant="gold" hover="glow">
          <CardHeader>
            <CardTitle className="text-xl">
              Overall Business Health Score
            </CardTitle>
            <CardDescription>
              Comprehensive view of your business performance across all key metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
              <div className="text-center">
                <Progress 
                  value={87} 
                  size="xl" 
                  variant="gold"
                  animate
                  showValue
                />
                <p className="text-body font-medium text-foreground mt-4">
                  Excellent Health
                </p>
                <p className="text-sm text-medium-gray">
                  Top 10% of businesses
                </p>
              </div>
              
              <div className="md:col-span-3 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body font-medium text-foreground">Financial Stability</span>
                    <span className="text-success font-semibold">92%</span>
                  </div>
                  <Progress value={92} variant="success" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body font-medium text-foreground">Client Satisfaction</span>
                    <span className="text-rich-gold font-semibold">88%</span>
                  </div>
                  <Progress value={88} variant="gold" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body font-medium text-foreground">Operational Efficiency</span>
                    <span className="text-rose-gold font-semibold">81%</span>
                  </div>
                  <Progress value={81} variant="rose" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body font-medium text-foreground">Growth Potential</span>
                    <span className="text-warning font-semibold">85%</span>
                  </div>
                  <Progress value={85} variant="warning" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  )
}