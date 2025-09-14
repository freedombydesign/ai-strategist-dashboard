'use client'

import { motion } from 'framer-motion'
import { 
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { 
  Line, 
  LineChart, 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis,
  Bar,
  BarChart
} from 'recharts'

const revenueData = [
  { month: 'Jan', value: 65000 },
  { month: 'Feb', value: 71000 },
  { month: 'Mar', value: 78000 },
  { month: 'Apr', value: 85000 },
  { month: 'May', value: 92000 },
  { month: 'Jun', value: 98000 }
]

const engagementData = [
  { day: 'Mon', users: 1200, sessions: 2800 },
  { day: 'Tue', users: 1400, sessions: 3200 },
  { day: 'Wed', users: 1100, sessions: 2600 },
  { day: 'Thu', users: 1600, sessions: 3800 },
  { day: 'Fri', users: 1800, sessions: 4200 },
  { day: 'Sat', users: 900, sessions: 2100 },
  { day: 'Sun', users: 800, sessions: 1900 }
]

interface MetricCardProps {
  title: string
  value: string
  change?: number
  trend?: 'up' | 'down'
  icon: React.ElementType
  description?: string
  delay?: number
}

function MetricCard({ title, value, change, trend, icon: Icon, description, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      className="card-editorial p-6 group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl transition-all duration-300 ${
          trend === 'up' 
            ? 'bg-success/10 text-success group-hover:bg-success group-hover:text-champagne' 
            : trend === 'down'
            ? 'bg-error/10 text-error group-hover:bg-error group-hover:text-champagne'
            : 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-champagne'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
            trend === 'up' 
              ? 'bg-success/10 text-success' 
              : 'bg-error/10 text-error'
          }`}>
            {trend === 'up' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="display-2 font-bold transition-colors duration-300 group-hover:text-accent">
          {value}
        </h3>
        <p className="subhead font-medium">{title}</p>
        {description && (
          <p className="body-medium text-muted group-hover:text-muted/80 transition-colors duration-300">
            {description}
          </p>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-copper opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  )
}

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  delay?: number
}

function ChartCard({ title, subtitle, children, delay = 0 }: ChartCardProps) {
  return (
    <motion.div
      className="card-editorial p-6 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="mb-6">
        <h3 className="headline-2 mb-2">{title}</h3>
        {subtitle && (
          <p className="body-medium text-muted">{subtitle}</p>
        )}
      </div>
      
      <div className="h-64">
        {children}
      </div>
    </motion.div>
  )
}

interface ActivityItem {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'success' | 'info' | 'warning'
  icon: React.ElementType
}

const recentActivities: ActivityItem[] = [
  {
    id: '1',
    title: 'Sprint Goal Completed',
    description: 'Marketing automation workflow successfully deployed',
    timestamp: '2 hours ago',
    type: 'success',
    icon: CheckCircleIcon
  },
  {
    id: '2', 
    title: 'New Client Onboarded',
    description: 'Premium package client added to CRM system',
    timestamp: '4 hours ago',
    type: 'info',
    icon: UsersIcon
  },
  {
    id: '3',
    title: 'Revenue Milestone',
    description: 'Monthly revenue target exceeded by 15%',
    timestamp: '6 hours ago',
    type: 'success',
    icon: CurrencyDollarIcon
  },
  {
    id: '4',
    title: 'Strategy Session Scheduled',
    description: 'Q4 planning meeting with AI strategist',
    timestamp: '1 day ago',
    type: 'info',
    icon: SparklesIcon
  }
]

function ActivityCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="card-editorial p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-accent/10 rounded-xl">
          <ClockIcon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="headline-2">Recent Activity</h3>
          <p className="body-medium text-muted">Latest business updates</p>
        </div>
      </div>
      
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {recentActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: delay + (index * 0.1) }}
            whileHover={{ x: 4 }}
          >
            <div className={`p-2 rounded-lg ${
              activity.type === 'success' 
                ? 'bg-success/10 text-success'
                : activity.type === 'warning'
                ? 'bg-warning/10 text-warning'
                : 'bg-accent-secondary/10 text-accent-secondary'
            }`}>
              <activity.icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="body-medium font-semibold mb-1">{activity.title}</h4>
              <p className="body-medium text-muted mb-2">{activity.description}</p>
              <p className="caption text-muted">{activity.timestamp}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export function DashboardCards() {
  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Revenue"
          value="$98,400"
          change={12.5}
          trend="up"
          icon={CurrencyDollarIcon}
          description="vs last month"
          delay={0.1}
        />
        <MetricCard
          title="Active Clients"
          value="247"
          change={8.2}
          trend="up"
          icon={UsersIcon}
          description="premium subscribers"
          delay={0.2}
        />
        <MetricCard
          title="Conversion Rate"
          value="3.4%"
          change={-2.1}
          trend="down"
          icon={ChartBarIcon}
          description="30-day average"
          delay={0.3}
        />
        <MetricCard
          title="Freedom Score"
          value="84"
          change={15.3}
          trend="up"
          icon={SparklesIcon}
          description="business automation"
          delay={0.4}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Revenue Trend"
          subtitle="6-month performance overview"
          delay={0.5}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--copper)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--copper)" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
              />
              <YAxis hide />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--copper)"
                strokeWidth={3}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="User Engagement"
          subtitle="Weekly active users and sessions"
          delay={0.6}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engagementData}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
              />
              <YAxis hide />
              <Bar 
                dataKey="users" 
                fill="var(--copper)" 
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Bar 
                dataKey="sessions" 
                fill="var(--accent-secondary)" 
                radius={[4, 4, 0, 0]}
                opacity={0.6}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityCard delay={0.7} />
        </div>
        
        <div className="space-y-6">
          <MetricCard
            title="AI Insights"
            value="12"
            icon={SparklesIcon}
            description="new recommendations"
            delay={0.8}
          />
          <MetricCard
            title="Automation Rate"
            value="67%"
            change={23.1}
            trend="up"
            icon={ChartBarIcon}
            description="processes automated"
            delay={0.9}
          />
        </div>
      </div>
    </div>
  )
}

export default DashboardCards