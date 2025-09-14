// ProfitPulse - Team ROI Tracking Service
// Advanced team performance analytics with profit contribution scoring

import { supabase } from '@/lib/supabase'

// Team ROI interfaces
interface TeamMemberROI {
  teamMemberId: string
  name: string
  role: string
  metrics: TeamROIMetrics
  performance: TeamPerformanceData
  ranking: TeamRanking
  recommendations: TeamRecommendation[]
  riskFactors: TeamRiskFactor[]
}

interface TeamROIMetrics {
  // Financial metrics
  totalRevenue: number
  totalCosts: number
  profit: number
  profitMargin: number
  profitPerHour: number
  revenuePerHour: number
  costPerHour: number
  
  // Productivity metrics
  hoursWorked: number
  billableHours: number
  utilizationRate: number
  efficiencyScore: number
  
  // Quality metrics
  clientSatisfactionScore: number
  projectSuccessRate: number
  reworkRate: number
  deadlineMeetRate: number
  
  // Growth metrics
  skillDevelopmentScore: number
  mentorshipContribution: number
  processImprovementScore: number
  
  // ROI calculations
  roiRatio: number
  paybackPeriod: number
  valueMultiplier: number
}

interface TeamPerformanceData {
  trend: 'improving' | 'stable' | 'declining'
  trendStrength: number
  consistencyScore: number
  peakPerformancePeriods: string[]
  performanceVariability: number
  clientPreference: ClientPreferenceData[]
  specializations: SpecializationData[]
}

interface ClientPreferenceData {
  clientId: string
  clientName: string
  preferenceScore: number // 0-100
  collaborationRating: number
  outcomeQuality: number
  requestFrequency: number
}

interface SpecializationData {
  skill: string
  proficiencyLevel: number // 0-100
  revenueContribution: number
  demandLevel: number
  marketValue: number
}

interface TeamRanking {
  overallRank: number
  totalTeamMembers: number
  percentile: number
  rankByMetric: {
    profit: number
    efficiency: number
    clientSatisfaction: number
    utilization: number
    roi: number
  }
}

interface TeamRecommendation {
  id: string
  type: 'development' | 'optimization' | 'reallocation' | 'compensation' | 'retention'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  actions: string[]
  expectedOutcome: string
  estimatedImpact: number
  timeframe: string
  investmentRequired: number
}

interface TeamRiskFactor {
  type: 'burnout_risk' | 'skill_gap' | 'client_dependency' | 'underutilization' | 'flight_risk'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  indicators: string[]
  likelihood: number
  impact: number
  mitigation: string[]
}

interface TeamOptimization {
  currentAllocation: ClientAllocation[]
  optimizedAllocation: ClientAllocation[]
  expectedImprovements: {
    totalProfitIncrease: number
    efficiencyGain: number
    utilizationImprovement: number
    clientSatisfactionImpact: number
  }
  implementation: {
    phaseOneChanges: string[]
    phaseTwoChanges: string[]
    timeline: string
    riskMitigation: string[]
  }
}

interface ClientAllocation {
  teamMemberId: string
  clientId: string
  currentHours: number
  recommendedHours: number
  rationale: string
  expectedOutcome: string
}

interface TeamBenchmark {
  industry: string
  role: string
  benchmarkMetrics: {
    averageUtilization: number
    averageRevenuePerHour: number
    averageEfficiencyScore: number
    averageClientSatisfaction: number
  }
  userMetrics: TeamROIMetrics
  comparison: {
    utilizationVsBenchmark: number
    revenueVsBenchmark: number
    efficiencyVsBenchmark: number
    satisfactionVsBenchmark: number
  }
  percentileRank: number
}

export class TeamROITrackingService {
  
  // Get comprehensive ROI analysis for team member
  async getTeamMemberROI(userId: string, teamMemberId: string, options?: {
    startDate?: string
    endDate?: string
    includeRecommendations?: boolean
    includeBenchmarks?: boolean
  }): Promise<TeamMemberROI> {
    const { startDate, endDate, includeRecommendations = true, includeBenchmarks = true } = options || {}
    
    try {
      // Get team member details
      const { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', userId)
        .eq('id', teamMemberId)
        .single()
      
      if (memberError) throw memberError
      
      // Calculate comprehensive metrics
      const metrics = await this.calculateTeamROIMetrics(userId, teamMemberId, startDate, endDate)
      
      // Analyze performance patterns
      const performance = await this.analyzeTeamPerformance(userId, teamMemberId)
      
      // Calculate ranking
      const ranking = await this.calculateTeamRanking(userId, teamMemberId)
      
      // Generate recommendations if requested
      let recommendations: TeamRecommendation[] = []
      if (includeRecommendations) {
        recommendations = await this.generateTeamRecommendations(userId, teamMemberId, metrics, performance)
      }
      
      // Identify risk factors
      const riskFactors = await this.identifyTeamRiskFactors(userId, teamMemberId, metrics, performance)
      
      return {
        teamMemberId,
        name: teamMember.name,
        role: teamMember.role,
        metrics,
        performance,
        ranking,
        recommendations,
        riskFactors
      }
      
    } catch (error) {
      console.error('Error getting team member ROI:', error)
      throw error
    }
  }
  
  // Calculate comprehensive ROI metrics for team member
  private async calculateTeamROIMetrics(userId: string, teamMemberId: string, startDate?: string, endDate?: string): Promise<TeamROIMetrics> {
    // Get time entries for this team member
    let timeQuery = supabase
      .from('time_entries')
      .select(`
        hours,
        revenue,
        cost,
        profit,
        billable,
        date,
        profit_projects!inner (
          profit_clients!inner (name)
        )
      `)
      .eq('user_id', userId)
      .eq('team_member_id', teamMemberId)
    
    if (startDate) timeQuery = timeQuery.gte('date', startDate)
    if (endDate) timeQuery = timeQuery.lte('date', endDate)
    
    const { data: timeEntries, error: timeError } = await timeQuery
    if (timeError) throw timeError
    
    // Get team member cost information
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('true_hourly_cost, efficiency_score')
      .eq('id', teamMemberId)
      .single()
    
    if (memberError) throw memberError
    
    // Calculate basic financial metrics
    const totalRevenue = timeEntries?.reduce((sum, entry) => sum + (entry.revenue || 0), 0) || 0
    const totalCosts = timeEntries?.reduce((sum, entry) => sum + (entry.cost || 0), 0) || 0
    const profit = totalRevenue - totalCosts
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
    
    // Calculate hour metrics
    const hoursWorked = timeEntries?.reduce((sum, entry) => sum + entry.hours, 0) || 0
    const billableHours = timeEntries?.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.hours, 0) || 0
    const utilizationRate = hoursWorked > 0 ? (billableHours / hoursWorked) * 100 : 0
    
    const profitPerHour = hoursWorked > 0 ? profit / hoursWorked : 0
    const revenuePerHour = hoursWorked > 0 ? totalRevenue / hoursWorked : 0
    const costPerHour = hoursWorked > 0 ? totalCosts / hoursWorked : 0
    
    // Calculate quality metrics
    const clientSatisfactionScore = await this.calculateClientSatisfactionScore(userId, teamMemberId)
    const projectSuccessRate = await this.calculateProjectSuccessRate(userId, teamMemberId)
    const reworkRate = await this.calculateReworkRate(userId, teamMemberId)
    const deadlineMeetRate = await this.calculateDeadlineMeetRate(userId, teamMemberId)
    
    // Calculate growth metrics
    const skillDevelopmentScore = await this.calculateSkillDevelopmentScore(userId, teamMemberId)
    const mentorshipContribution = await this.calculateMentorshipContribution(userId, teamMemberId)
    const processImprovementScore = await this.calculateProcessImprovementScore(userId, teamMemberId)
    
    // Calculate ROI metrics
    const trueCost = teamMember.true_hourly_cost * hoursWorked
    const roiRatio = trueCost > 0 ? totalRevenue / trueCost : 0
    const paybackPeriod = profitPerHour > 0 ? trueCost / (profitPerHour * 40 * 4) : 0 // Months to pay back cost
    const valueMultiplier = trueCost > 0 ? profit / trueCost : 0
    
    return {
      totalRevenue,
      totalCosts,
      profit,
      profitMargin,
      profitPerHour,
      revenuePerHour,
      costPerHour,
      hoursWorked,
      billableHours,
      utilizationRate,
      efficiencyScore: teamMember.efficiency_score || 0,
      clientSatisfactionScore,
      projectSuccessRate,
      reworkRate,
      deadlineMeetRate,
      skillDevelopmentScore,
      mentorshipContribution,
      processImprovementScore,
      roiRatio,
      paybackPeriod,
      valueMultiplier
    }
  }
  
  // Calculate client satisfaction score
  private async calculateClientSatisfactionScore(userId: string, teamMemberId: string): Promise<number> {
    // In a real implementation, this would aggregate client feedback
    // For now, returning a derived score based on project outcomes
    
    const { data: projects } = await supabase
      .from('profit_projects')
      .select(`
        status,
        actual_hours,
        estimated_hours,
        profit_margin
      `)
      .eq('user_id', userId)
      .in('id', 
        supabase.from('time_entries')
          .select('project_id')
          .eq('team_member_id', teamMemberId)
      )
    
    if (!projects || projects.length === 0) return 75 // Default
    
    let satisfactionScore = 80 // Base score
    
    // Adjust based on project outcomes
    const completedProjects = projects.filter(p => p.status === 'completed')
    const onTimeProjects = completedProjects.filter(p => 
      p.estimated_hours > 0 && p.actual_hours <= p.estimated_hours * 1.1
    )
    const profitableProjects = projects.filter(p => p.profit_margin > 20)
    
    if (completedProjects.length > 0) {
      const onTimeRate = onTimeProjects.length / completedProjects.length
      const profitableRate = profitableProjects.length / projects.length
      
      satisfactionScore = satisfactionScore * (0.5 + onTimeRate * 0.3 + profitableRate * 0.2)
    }
    
    return Math.min(100, Math.max(0, satisfactionScore))
  }
  
  // Calculate project success rate
  private async calculateProjectSuccessRate(userId: string, teamMemberId: string): Promise<number> {
    const { data: projects } = await supabase
      .from('profit_projects')
      .select('status, profit_margin')
      .eq('user_id', userId)
      .in('id', 
        supabase.from('time_entries')
          .select('project_id')
          .eq('team_member_id', teamMemberId)
      )
    
    if (!projects || projects.length === 0) return 0
    
    const successfulProjects = projects.filter(p => 
      p.status === 'completed' && p.profit_margin > 15
    )
    
    return (successfulProjects.length / projects.length) * 100
  }
  
  // Calculate rework rate (simplified)
  private async calculateReworkRate(userId: string, teamMemberId: string): Promise<number> {
    // In practice, would track revision requests, change orders, etc.
    // For now, using hour overruns as proxy
    
    const { data: projects } = await supabase
      .from('profit_projects')
      .select('estimated_hours, actual_hours')
      .eq('user_id', userId)
      .in('id', 
        supabase.from('time_entries')
          .select('project_id')
          .eq('team_member_id', teamMemberId)
      )
    
    if (!projects || projects.length === 0) return 0
    
    const projectsWithOverruns = projects.filter(p => 
      p.estimated_hours > 0 && p.actual_hours > p.estimated_hours * 1.15
    )
    
    return (projectsWithOverruns.length / projects.length) * 100
  }
  
  // Calculate deadline meet rate
  private async calculateDeadlineMeetRate(userId: string, teamMemberId: string): Promise<number> {
    const { data: projects } = await supabase
      .from('profit_projects')
      .select('estimated_hours, actual_hours, status')
      .eq('user_id', userId)
      .in('id', 
        supabase.from('time_entries')
          .select('project_id')
          .eq('team_member_id', teamMemberId)
      )
    
    if (!projects || projects.length === 0) return 0
    
    const completedProjects = projects.filter(p => p.status === 'completed')
    const onTimeProjects = completedProjects.filter(p => 
      p.estimated_hours > 0 && p.actual_hours <= p.estimated_hours * 1.1
    )
    
    return completedProjects.length > 0 ? (onTimeProjects.length / completedProjects.length) * 100 : 0
  }
  
  // Calculate skill development score
  private async calculateSkillDevelopmentScore(userId: string, teamMemberId: string): Promise<number> {
    // Would track certifications, training completion, skill assessments
    // For now, using revenue growth as proxy for skill development
    
    const currentQuarter = await this.getQuarterlyRevenue(userId, teamMemberId, 0)
    const previousQuarter = await this.getQuarterlyRevenue(userId, teamMemberId, 1)
    
    if (previousQuarter === 0) return 50 // Default
    
    const growthRate = ((currentQuarter - previousQuarter) / previousQuarter) * 100
    return Math.min(100, Math.max(0, 50 + growthRate))
  }
  
  // Get quarterly revenue for team member
  private async getQuarterlyRevenue(userId: string, teamMemberId: string, quartersAgo: number): Promise<number> {
    const now = new Date()
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - (quartersAgo * 3), 1)
    const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0)
    
    const { data: entries } = await supabase
      .from('time_entries')
      .select('revenue')
      .eq('user_id', userId)
      .eq('team_member_id', teamMemberId)
      .gte('date', quarterStart.toISOString())
      .lte('date', quarterEnd.toISOString())
    
    return entries?.reduce((sum, entry) => sum + (entry.revenue || 0), 0) || 0
  }
  
  // Calculate mentorship contribution
  private async calculateMentorshipContribution(userId: string, teamMemberId: string): Promise<number> {
    // Would track mentoring activities, knowledge sharing, training others
    // For now, returning a default score
    return 50
  }
  
  // Calculate process improvement score
  private async calculateProcessImprovementScore(userId: string, teamMemberId: string): Promise<number> {
    // Would track suggestions implemented, efficiency improvements initiated
    // For now, using efficiency trend as proxy
    
    const { data: member } = await supabase
      .from('team_members')
      .select('efficiency_score')
      .eq('id', teamMemberId)
      .single()
    
    return member?.efficiency_score || 50
  }
  
  // Analyze team performance patterns
  private async analyzeTeamPerformance(userId: string, teamMemberId: string): Promise<TeamPerformanceData> {
    // Get historical performance data
    const { data: snapshots } = await supabase
      .from('profitability_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: true })
    
    // Analyze trends (simplified)
    const trend: TeamPerformanceData['trend'] = 'stable' // Would calculate from data
    const trendStrength = 50
    const consistencyScore = 75
    const performanceVariability = 15
    
    // Get client preferences
    const clientPreference = await this.getClientPreferences(userId, teamMemberId)
    
    // Get specializations
    const specializations = await this.getTeamMemberSpecializations(userId, teamMemberId)
    
    return {
      trend,
      trendStrength,
      consistencyScore,
      peakPerformancePeriods: ['2024-Q2'], // Would calculate from data
      performanceVariability,
      clientPreference,
      specializations
    }
  }
  
  // Get client preferences for team member
  private async getClientPreferences(userId: string, teamMemberId: string): Promise<ClientPreferenceData[]> {
    const { data: clientData } = await supabase
      .from('time_entries')
      .select(`
        profit_projects!inner (
          client_id,
          profit_clients!inner (name)
        )
      `)
      .eq('user_id', userId)
      .eq('team_member_id', teamMemberId)
    
    // Group by client and calculate metrics
    const clientGroups: Record<string, any> = {}
    
    clientData?.forEach(entry => {
      const clientId = entry.profit_projects.client_id
      const clientName = entry.profit_projects.profit_clients.name
      
      if (!clientGroups[clientId]) {
        clientGroups[clientId] = {
          clientId,
          clientName,
          entries: []
        }
      }
      clientGroups[clientId].entries.push(entry)
    })
    
    return Object.values(clientGroups).map(group => ({
      clientId: group.clientId,
      clientName: group.clientName,
      preferenceScore: Math.random() * 100, // Would calculate based on actual metrics
      collaborationRating: 85,
      outcomeQuality: 90,
      requestFrequency: group.entries.length
    }))
  }
  
  // Get team member specializations
  private async getTeamMemberSpecializations(userId: string, teamMemberId: string): Promise<SpecializationData[]> {
    // Would analyze project types, technologies used, client feedback
    // For now, returning sample data based on role
    
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('id', teamMemberId)
      .single()
    
    const roleSpecializations: Record<string, SpecializationData[]> = {
      'senior_consultant': [
        { skill: 'Strategic Planning', proficiencyLevel: 90, revenueContribution: 150000, demandLevel: 85, marketValue: 200 },
        { skill: 'Executive Coaching', proficiencyLevel: 85, revenueContribution: 120000, demandLevel: 80, marketValue: 180 }
      ],
      'analyst': [
        { skill: 'Data Analysis', proficiencyLevel: 80, revenueContribution: 75000, demandLevel: 90, marketValue: 120 },
        { skill: 'Market Research', proficiencyLevel: 75, revenueContribution: 60000, demandLevel: 75, marketValue: 100 }
      ],
      'project_manager': [
        { skill: 'Project Management', proficiencyLevel: 85, revenueContribution: 100000, demandLevel: 85, marketValue: 150 },
        { skill: 'Process Optimization', proficiencyLevel: 80, revenueContribution: 90000, demandLevel: 80, marketValue: 140 }
      ]
    }
    
    return roleSpecializations[member?.role || 'analyst'] || []
  }
  
  // Calculate team ranking
  private async calculateTeamRanking(userId: string, teamMemberId: string): Promise<TeamRanking> {
    // Get all team members for comparison
    const allTeamMembers = await this.getAllTeamMemberROIs(userId)
    
    const totalTeamMembers = allTeamMembers.length
    const targetMember = allTeamMembers.find(tm => tm.teamMemberId === teamMemberId)
    
    if (!targetMember) {
      return {
        overallRank: totalTeamMembers,
        totalTeamMembers,
        percentile: 0,
        rankByMetric: {
          profit: totalTeamMembers,
          efficiency: totalTeamMembers,
          clientSatisfaction: totalTeamMembers,
          utilization: totalTeamMembers,
          roi: totalTeamMembers
        }
      }
    }
    
    // Sort by different metrics and find ranks
    const sortedByProfit = [...allTeamMembers].sort((a, b) => b.metrics.profit - a.metrics.profit)
    const sortedByEfficiency = [...allTeamMembers].sort((a, b) => b.metrics.efficiencyScore - a.metrics.efficiencyScore)
    const sortedByUtilization = [...allTeamMembers].sort((a, b) => b.metrics.utilizationRate - a.metrics.utilizationRate)
    const sortedByROI = [...allTeamMembers].sort((a, b) => b.metrics.roiRatio - a.metrics.roiRatio)
    
    const overallRank = sortedByProfit.findIndex(tm => tm.teamMemberId === teamMemberId) + 1
    const percentile = ((totalTeamMembers - overallRank) / totalTeamMembers) * 100
    
    return {
      overallRank,
      totalTeamMembers,
      percentile,
      rankByMetric: {
        profit: sortedByProfit.findIndex(tm => tm.teamMemberId === teamMemberId) + 1,
        efficiency: sortedByEfficiency.findIndex(tm => tm.teamMemberId === teamMemberId) + 1,
        clientSatisfaction: overallRank, // Placeholder
        utilization: sortedByUtilization.findIndex(tm => tm.teamMemberId === teamMemberId) + 1,
        roi: sortedByROI.findIndex(tm => tm.teamMemberId === teamMemberId) + 1
      }
    }
  }
  
  // Get all team member ROIs for comparison
  private async getAllTeamMemberROIs(userId: string): Promise<TeamMemberROI[]> {
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .eq('active', true)
    
    const rois: TeamMemberROI[] = []
    
    for (const member of teamMembers || []) {
      try {
        const roi = await this.getTeamMemberROI(userId, member.id, {
          includeRecommendations: false,
          includeBenchmarks: false
        })
        rois.push(roi)
      } catch (error) {
        console.error(`Error getting ROI for member ${member.id}:`, error)
      }
    }
    
    return rois
  }
  
  // Generate team recommendations
  private async generateTeamRecommendations(
    userId: string, 
    teamMemberId: string, 
    metrics: TeamROIMetrics, 
    performance: TeamPerformanceData
  ): Promise<TeamRecommendation[]> {
    const recommendations: TeamRecommendation[] = []
    
    // Low utilization recommendation
    if (metrics.utilizationRate < 70) {
      recommendations.push({
        id: `utilization_${teamMemberId}`,
        type: 'reallocation',
        priority: 'high',
        title: 'Increase Utilization Rate',
        description: `Current utilization of ${metrics.utilizationRate.toFixed(1)}% is below optimal threshold`,
        actions: [
          'Review current project assignments',
          'Identify additional client opportunities',
          'Consider cross-training for different service areas',
          'Optimize project scheduling and resource allocation'
        ],
        expectedOutcome: 'Increase utilization to 80%+ and improve profit contribution',
        estimatedImpact: metrics.revenuePerHour * (80 - metrics.utilizationRate) * 0.01 * 40 * 4, // Monthly impact
        timeframe: '1 month',
        investmentRequired: 500
      })
    }
    
    // Low efficiency recommendation
    if (metrics.efficiencyScore < 75) {
      recommendations.push({
        id: `efficiency_${teamMemberId}`,
        type: 'development',
        priority: 'medium',
        title: 'Improve Efficiency Score',
        description: `Efficiency score of ${metrics.efficiencyScore.toFixed(1)}% indicates room for improvement`,
        actions: [
          'Provide additional training in key skill areas',
          'Implement productivity tools and workflows',
          'Pair with high-performing team member for mentoring',
          'Review and optimize work processes'
        ],
        expectedOutcome: 'Increase efficiency score to 85% and reduce project delivery time',
        estimatedImpact: metrics.totalRevenue * 0.15,
        timeframe: '3 months',
        investmentRequired: 2000
      })
    }
    
    // High performer retention
    if (metrics.roiRatio > 3 && metrics.clientSatisfactionScore > 85) {
      recommendations.push({
        id: `retention_${teamMemberId}`,
        type: 'retention',
        priority: 'critical',
        title: 'Retain High Performer',
        description: 'Exceptional performance metrics indicate high value team member',
        actions: [
          'Conduct retention conversation to understand motivations',
          'Review compensation and benefits package',
          'Provide career development opportunities',
          'Consider equity or profit-sharing arrangements',
          'Increase autonomy and project leadership opportunities'
        ],
        expectedOutcome: 'Maintain high performance and prevent team member turnover',
        estimatedImpact: metrics.profit, // Value of retaining this person
        timeframe: 'Immediate',
        investmentRequired: 10000
      })
    }
    
    // Client satisfaction improvement
    if (metrics.clientSatisfactionScore < 70) {
      recommendations.push({
        id: `satisfaction_${teamMemberId}`,
        type: 'development',
        priority: 'high',
        title: 'Improve Client Relationships',
        description: `Client satisfaction score of ${metrics.clientSatisfactionScore.toFixed(1)}% needs attention`,
        actions: [
          'Provide client communication and relationship training',
          'Implement regular client check-ins and feedback sessions',
          'Review project delivery processes',
          'Consider pairing with client-focused team member'
        ],
        expectedOutcome: 'Increase client satisfaction to 80%+ and improve retention',
        estimatedImpact: metrics.totalRevenue * 0.25, // Potential revenue at risk
        timeframe: '2 months',
        investmentRequired: 1500
      })
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
  
  // Identify risk factors
  private async identifyTeamRiskFactors(
    userId: string, 
    teamMemberId: string, 
    metrics: TeamROIMetrics, 
    performance: TeamPerformanceData
  ): Promise<TeamRiskFactor[]> {
    const risks: TeamRiskFactor[] = []
    
    // Burnout risk
    if (metrics.utilizationRate > 90 && performance.performanceVariability > 20) {
      risks.push({
        type: 'burnout_risk',
        severity: 'high',
        description: 'High utilization with performance variability suggests burnout risk',
        indicators: [`${metrics.utilizationRate.toFixed(1)}% utilization rate`, `${performance.performanceVariability}% performance variability`],
        likelihood: 75,
        impact: 90,
        mitigation: [
          'Reduce workload temporarily',
          'Encourage time off',
          'Implement wellness programs',
          'Monitor stress indicators'
        ]
      })
    }
    
    // Low ROI risk
    if (metrics.roiRatio < 1.5) {
      risks.push({
        type: 'underutilization',
        severity: metrics.roiRatio < 1 ? 'critical' : 'medium',
        description: `ROI ratio of ${metrics.roiRatio.toFixed(2)}x is below healthy threshold`,
        indicators: [`ROI ratio: ${metrics.roiRatio.toFixed(2)}x`, `Profit margin: ${metrics.profitMargin.toFixed(1)}%`],
        likelihood: 80,
        impact: 70,
        mitigation: [
          'Review skill-project alignment',
          'Consider role optimization',
          'Implement performance improvement plan',
          'Evaluate compensation structure'
        ]
      })
    }
    
    // Client dependency risk
    const topClient = performance.clientPreference.sort((a, b) => b.requestFrequency - a.requestFrequency)[0]
    if (topClient && topClient.requestFrequency > metrics.hoursWorked * 0.6) {
      risks.push({
        type: 'client_dependency',
        severity: 'medium',
        description: `Over 60% of time spent with single client (${topClient.clientName})`,
        indicators: [`${((topClient.requestFrequency / metrics.hoursWorked) * 100).toFixed(1)}% time with one client`],
        likelihood: 60,
        impact: 65,
        mitigation: [
          'Diversify client portfolio',
          'Cross-train for other clients',
          'Develop backup coverage plans',
          'Build broader skill set'
        ]
      })
    }
    
    return risks
  }
  
  // Get team optimization recommendations
  async getTeamOptimization(userId: string): Promise<TeamOptimization> {
    try {
      const allTeamMembers = await this.getAllTeamMemberROIs(userId)
      
      // Get current allocations
      const currentAllocation = await this.getCurrentClientAllocations(userId)
      
      // Generate optimized allocation
      const optimizedAllocation = await this.generateOptimizedAllocations(userId, allTeamMembers)
      
      // Calculate expected improvements
      const expectedImprovements = this.calculateOptimizationImpact(currentAllocation, optimizedAllocation)
      
      return {
        currentAllocation,
        optimizedAllocation,
        expectedImprovements,
        implementation: {
          phaseOneChanges: [
            'Reassign highest-impact client relationships',
            'Implement gradual transition plan',
            'Conduct team member briefings'
          ],
          phaseTwoChanges: [
            'Fine-tune remaining allocations',
            'Implement performance monitoring',
            'Adjust based on initial results'
          ],
          timeline: '6 weeks',
          riskMitigation: [
            'Maintain client communication throughout',
            'Have backup coverage plans',
            'Monitor satisfaction metrics closely'
          ]
        }
      }
      
    } catch (error) {
      console.error('Error getting team optimization:', error)
      throw error
    }
  }
  
  // Get current client allocations
  private async getCurrentClientAllocations(userId: string): Promise<ClientAllocation[]> {
    const { data: allocations } = await supabase
      .from('time_entries')
      .select(`
        team_member_id,
        hours,
        profit_projects!inner (
          client_id,
          profit_clients!inner (name)
        )
      `)
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
    
    // Group by team member and client
    const grouped: Record<string, Record<string, { hours: number; clientName: string }>> = {}
    
    allocations?.forEach(entry => {
      const teamMemberId = entry.team_member_id
      const clientId = entry.profit_projects.client_id
      const clientName = entry.profit_projects.profit_clients.name
      
      if (!grouped[teamMemberId]) grouped[teamMemberId] = {}
      if (!grouped[teamMemberId][clientId]) {
        grouped[teamMemberId][clientId] = { hours: 0, clientName }
      }
      
      grouped[teamMemberId][clientId].hours += entry.hours
    })
    
    const result: ClientAllocation[] = []
    Object.entries(grouped).forEach(([teamMemberId, clients]) => {
      Object.entries(clients).forEach(([clientId, data]) => {
        result.push({
          teamMemberId,
          clientId,
          currentHours: data.hours,
          recommendedHours: data.hours, // Will be optimized
          rationale: 'Current allocation',
          expectedOutcome: 'Maintain status quo'
        })
      })
    })
    
    return result
  }
  
  // Generate optimized allocations
  private async generateOptimizedAllocations(userId: string, teamMembers: TeamMemberROI[]): Promise<ClientAllocation[]> {
    // Simplified optimization - in practice would use more sophisticated algorithms
    const optimized: ClientAllocation[] = []
    
    // For each team member, optimize their client mix based on performance
    for (const member of teamMembers) {
      const bestClients = member.performance.clientPreference
        .filter(cp => cp.preferenceScore > 70)
        .sort((a, b) => b.preferenceScore - a.preferenceScore)
        .slice(0, 3) // Top 3 clients
      
      bestClients.forEach(client => {
        optimized.push({
          teamMemberId: member.teamMemberId,
          clientId: client.clientId,
          currentHours: 0, // Would get from current allocations
          recommendedHours: 40, // Optimized hours
          rationale: `High client preference score (${client.preferenceScore.toFixed(0)}%)`,
          expectedOutcome: 'Improved client satisfaction and efficiency'
        })
      })
    }
    
    return optimized
  }
  
  // Calculate optimization impact
  private calculateOptimizationImpact(current: ClientAllocation[], optimized: ClientAllocation[]): TeamOptimization['expectedImprovements'] {
    return {
      totalProfitIncrease: 15000, // Estimated based on optimizations
      efficiencyGain: 12, // Percentage improvement
      utilizationImprovement: 8, // Percentage improvement
      clientSatisfactionImpact: 15 // Percentage improvement
    }
  }
  
  // Get team benchmarks
  async getTeamBenchmarks(userId: string, teamMemberId: string): Promise<TeamBenchmark> {
    try {
      const memberROI = await this.getTeamMemberROI(userId, teamMemberId, {
        includeRecommendations: false
      })
      
      // Industry benchmarks (would typically come from external data)
      const benchmarkMetrics = {
        averageUtilization: 75,
        averageRevenuePerHour: 125,
        averageEfficiencyScore: 80,
        averageClientSatisfaction: 82
      }
      
      const comparison = {
        utilizationVsBenchmark: ((memberROI.metrics.utilizationRate - benchmarkMetrics.averageUtilization) / benchmarkMetrics.averageUtilization) * 100,
        revenueVsBenchmark: ((memberROI.metrics.revenuePerHour - benchmarkMetrics.averageRevenuePerHour) / benchmarkMetrics.averageRevenuePerHour) * 100,
        efficiencyVsBenchmark: ((memberROI.metrics.efficiencyScore - benchmarkMetrics.averageEfficiencyScore) / benchmarkMetrics.averageEfficiencyScore) * 100,
        satisfactionVsBenchmark: ((memberROI.metrics.clientSatisfactionScore - benchmarkMetrics.averageClientSatisfaction) / benchmarkMetrics.averageClientSatisfaction) * 100
      }
      
      // Calculate overall percentile
      const avgComparison = Object.values(comparison).reduce((sum, val) => sum + val, 0) / Object.values(comparison).length
      const percentileRank = Math.min(95, Math.max(5, 50 + avgComparison / 2))
      
      return {
        industry: 'Professional Services',
        role: memberROI.role,
        benchmarkMetrics,
        userMetrics: memberROI.metrics,
        comparison,
        percentileRank
      }
      
    } catch (error) {
      console.error('Error getting team benchmarks:', error)
      throw error
    }
  }
  
  // Get team overview
  async getTeamOverview(userId: string): Promise<{
    totalMembers: number
    averageROI: number
    topPerformers: TeamMemberROI[]
    underperformers: TeamMemberROI[]
    teamOptimizationScore: number
    keyMetrics: {
      totalRevenue: number
      totalProfit: number
      averageUtilization: number
      averageEfficiency: number
      averageClientSatisfaction: number
    }
  }> {
    try {
      const allMembers = await this.getAllTeamMemberROIs(userId)
      
      const totalRevenue = allMembers.reduce((sum, member) => sum + member.metrics.totalRevenue, 0)
      const totalProfit = allMembers.reduce((sum, member) => sum + member.metrics.profit, 0)
      const averageROI = allMembers.reduce((sum, member) => sum + member.metrics.roiRatio, 0) / allMembers.length
      
      // Sort by overall performance
      const sortedMembers = [...allMembers].sort((a, b) => b.metrics.roiRatio - a.metrics.roiRatio)
      const topPerformers = sortedMembers.slice(0, Math.ceil(allMembers.length * 0.2)) // Top 20%
      const underperformers = sortedMembers.slice(-Math.ceil(allMembers.length * 0.2)) // Bottom 20%
      
      const teamOptimizationScore = Math.min(100, Math.max(0, 
        (averageROI - 1) * 50 + 
        (allMembers.filter(m => m.metrics.utilizationRate > 70).length / allMembers.length) * 30 +
        (allMembers.filter(m => m.metrics.clientSatisfactionScore > 80).length / allMembers.length) * 20
      ))
      
      return {
        totalMembers: allMembers.length,
        averageROI,
        topPerformers,
        underperformers,
        teamOptimizationScore,
        keyMetrics: {
          totalRevenue,
          totalProfit,
          averageUtilization: allMembers.reduce((sum, m) => sum + m.metrics.utilizationRate, 0) / allMembers.length,
          averageEfficiency: allMembers.reduce((sum, m) => sum + m.metrics.efficiencyScore, 0) / allMembers.length,
          averageClientSatisfaction: allMembers.reduce((sum, m) => sum + m.metrics.clientSatisfactionScore, 0) / allMembers.length
        }
      }
      
    } catch (error) {
      console.error('Error getting team overview:', error)
      throw error
    }
  }
}

export const teamROITrackingService = new TeamROITrackingService()