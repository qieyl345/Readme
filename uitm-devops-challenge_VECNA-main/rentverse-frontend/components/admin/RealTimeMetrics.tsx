import React, { useEffect, useState, useRef } from 'react'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import { 
  Activity, 
  Cpu, 
  Database, 
  Wifi, 
  Users, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react'
import { 
  performanceChartConfig, 
  resourceChartConfig, 
  userActivityChartConfig, 
  securityChartConfig,
  activityTimelineConfig,
  chartTheme,
  ChartDataProcessor,
  colorUtils
} from '@/utils/charts/chartConfig'
import { 
  generateMockMetrics, 
  generateMockSecurityMetrics, 
  generateMockActivityEvent,
  SystemMetrics,
  SecurityMetrics,
  ActivityEvent 
} from '@/utils/websocket/WebSocketManager'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'stable'
  icon: React.ElementType
  color: string
  isLive?: boolean
}

function MetricCard({ title, value, change, trend, icon: Icon, color, isLive }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm flex items-center mt-1 ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {isLive && (
        <div className="flex items-center mt-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-xs text-green-600 font-medium">LIVE</span>
        </div>
      )}
    </div>
  )
}

export default function RealTimeMetrics() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null)
  const [recentActivities, setRecentActivities] = useState<ActivityEvent[]>([])
  const [isRealTimeActive, setIsRealTimeActive] = useState(true)
  
  const performanceChartRef = useRef<any>(null)
  const resourceChartRef = useRef<any>(null)
  const userActivityChartRef = useRef<any>(null)
  const securityChartRef = useRef<any>(null)
  const activityChartRef = useRef<any>(null)

  // Simulate real-time data updates
  useEffect(() => {
    if (!isRealTimeActive) return

    const updateInterval = setInterval(() => {
      // Update system metrics
      const newMetrics = generateMockMetrics()
      setSystemMetrics(newMetrics)

      // Update security metrics
      const newSecurityMetrics = generateMockSecurityMetrics()
      setSecurityMetrics(newSecurityMetrics)

      // Add new activity event
      const newActivity = generateMockActivityEvent()
      setRecentActivities(prev => [newActivity, ...prev.slice(0, 19)]) // Keep last 20 activities

      // Update charts
      updateCharts(newMetrics, newSecurityMetrics)
    }, 3000) // Update every 3 seconds

    return () => clearInterval(updateInterval)
  }, [isRealTimeActive])

  // Initialize data
  useEffect(() => {
    const initialMetrics = generateMockMetrics()
    const initialSecurityMetrics = generateMockSecurityMetrics()
    
    setSystemMetrics(initialMetrics)
    setSecurityMetrics(initialSecurityMetrics)
    
    // Generate initial activity events
    const initialActivities = Array.from({ length: 10 }, () => generateMockActivityEvent())
    setRecentActivities(initialActivities)
  }, [])

  const updateCharts = (metrics: SystemMetrics, securityMetrics: SecurityMetrics) => {
    const timestamp = new Date().toLocaleTimeString()

    // Update performance chart
    if (performanceChartRef.current) {
      ChartDataProcessor.addDataPoint(
        performanceChartRef.current,
        timestamp,
        [metrics.responseTime, metrics.databaseConnections]
      )
    }

    // Update resource chart
    if (resourceChartRef.current) {
      ChartDataProcessor.updateDataset(
        resourceChartRef.current,
        0,
        [metrics.cpu, metrics.memory, metrics.disk, metrics.network]
      )
    }

    // Update user activity chart
    if (userActivityChartRef.current) {
      const activeUsers = Math.floor(Math.random() * 200) + 100
      const newRegistrations = Math.floor(Math.random() * 50) + 10
      const premiumUsers = Math.floor(Math.random() * 100) + 20
      const adminUsers = 5

      ChartDataProcessor.updateDataset(
        userActivityChartRef.current,
        0,
        [activeUsers, newRegistrations, premiumUsers, adminUsers]
      )
    }

    // Update security chart
    if (securityChartRef.current) {
      ChartDataProcessor.updateDataset(
        securityChartRef.current,
        0,
        [securityMetrics.securityScore, 95, 88, 92, 96, 94] // Example security scores
      )
    }

    // Update activity timeline
    if (activityChartRef.current) {
      const userLogins = Math.floor(Math.random() * 50) + 20
      const propertyUploads = Math.floor(Math.random() * 20) + 5
      const bookings = Math.floor(Math.random() * 15) + 3

      ChartDataProcessor.addDataPoint(
        activityChartRef.current,
        timestamp,
        [userLogins, propertyUploads, bookings]
      )
    }
  }

  const toggleRealTime = () => {
    setIsRealTimeActive(!isRealTimeActive)
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    return colorUtils.getPerformanceColor(value, thresholds)
  }

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60 * 1000))
    const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    return `${days}d ${hours}h`
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} MB`
    return `${(bytes / 1024).toFixed(1)} GB`
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-Time System Monitoring</h2>
          <p className="text-gray-600">Live performance metrics and system health indicators</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleRealTime}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isRealTimeActive
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isRealTimeActive ? (
              <>
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Live Updates ON
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 inline mr-2" />
                Live Updates OFF
              </>
            )}
          </button>
        </div>
      </div>

      {/* System Metrics Grid */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="CPU Usage"
            value={`${systemMetrics.cpu}%`}
            change={`${systemMetrics.cpu > 30 ? '+' : ''}${(systemMetrics.cpu % 5) - 2}%`}
            trend={systemMetrics.cpu > 30 ? 'up' : 'down'}
            icon={Cpu}
            color="bg-blue-500"
            isLive={isRealTimeActive}
          />
          <MetricCard
            title="Memory Usage"
            value={`${systemMetrics.memory}%`}
            change={`${systemMetrics.memory > 25 ? '+' : ''}${(systemMetrics.memory % 4) - 1}%`}
            trend={systemMetrics.memory > 25 ? 'up' : 'down'}
            icon={Database}
            color="bg-purple-500"
            isLive={isRealTimeActive}
          />
          <MetricCard
            title="Active Connections"
            value={systemMetrics.activeConnections}
            change={`+${Math.floor(Math.random() * 10) + 1}`}
            trend="up"
            icon={Wifi}
            color="bg-green-500"
            isLive={isRealTimeActive}
          />
          <MetricCard
            title="System Uptime"
            value={formatUptime(systemMetrics.uptime)}
            change="Stable"
            trend="stable"
            icon={Activity}
            color="bg-orange-500"
            isLive={isRealTimeActive}
          />
        </div>
      )}

      {/* Performance and Resource Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="h-80">
            <Line 
              ref={performanceChartRef}
              data={performanceChartConfig.data}
              options={performanceChartConfig.options as any}
            />
          </div>
        </div>

        {/* Resource Usage Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="h-80">
            <Bar 
              ref={resourceChartRef}
              data={resourceChartConfig.data}
              options={resourceChartConfig.options as any}
            />
          </div>
        </div>
      </div>

      {/* User Activity and Security Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="h-80">
            <Doughnut 
              ref={userActivityChartRef}
              data={userActivityChartConfig.data}
              options={userActivityChartConfig.options as any}
            />
          </div>
        </div>

        {/* Security Metrics Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="h-80">
            <Radar 
              ref={securityChartRef}
              data={securityChartConfig.data}
              options={securityChartConfig.options as any}
            />
          </div>
        </div>
      </div>

      {/* Activity Timeline and Security Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
          <div className="h-64">
            <Line 
              ref={activityChartRef}
              data={activityTimelineConfig.data}
              options={activityTimelineConfig.options as any}
            />
          </div>
        </div>

        {/* Security Metrics Panel */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Overview</h3>
          {securityMetrics ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Security Score</span>
                <span className="font-semibold text-green-600">{securityMetrics.securityScore}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Failed Logins</span>
                <span className="font-semibold text-red-600">{securityMetrics.failedLogins}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Threats</span>
                <span className="font-semibold text-orange-600">{securityMetrics.activeThreats}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Blocked IPs</span>
                <span className="font-semibold text-blue-600">{securityMetrics.blockedIPs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Suspicious Activities</span>
                <span className="font-semibold text-yellow-600">{securityMetrics.suspiciousActivities}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Security Scan</span>
                  <span className="text-sm text-gray-500">
                    {new Date(securityMetrics.lastScan).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Shield className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Loading security metrics...</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Feed</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.details}</p>
                    <p className="text-xs text-gray-500">{activity.user} • {activity.ipAddress}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}