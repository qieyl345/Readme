'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ContentWrapper from '@/components/ContentWrapper'
import TerminalEmulator from '@/components/terminal/TerminalEmulator'
import RealTimeMetrics from '@/components/admin/RealTimeMetrics'
import useAuthStore from '@/stores/authStore'
import { 
  Terminal, 
  Activity, 
  Shield, 
  Users, 
  BarChart3,
  Settings,
  RefreshCw,
  Maximize2,
  Database,
  Bell,
  LogIn,
  LogOut,
  UserCheck,
  UserX,
  FileCheck,
  FileX,
  AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'


// --- TYPE DEFINITIONS ---

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  role: string
}

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
}

// --- HELPER FUNCTIONS ---

const getActivityIcon = (action: string) => {
  if (action.includes('SUCCESS')) return <UserCheck className="w-5 h-5 text-green-500" />;
  if (action.includes('FAILED')) return <UserX className="w-5 h-5 text-red-500" />;
  if (action.includes('SUSPICIOUS')) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  if (action.includes('GENERATED')) return <FileCheck className="w-5 h-5 text-blue-500" />;
  if (action.includes('DELETED')) return <FileX className="w-5 h-5 text-gray-500" />;
  if (action.startsWith('LOGIN')) return <LogIn className="w-5 h-5 text-gray-500" />;
  if (action.startsWith('LOGOUT')) return <LogOut className="w-5 h-5 text-gray-500" />;
  return <Activity className="w-5 h-5 text-gray-400" />;
};

// --- COMPONENT ---

export default function EnhancedDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'terminal' | 'monitoring' | 'security'>('overview')
  
  // State for activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isLogsLoading, setIsLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState<string | null>(null)

  const { isLoggedIn } = useAuthStore()

  const fetchActivityLogs = useCallback(async () => {
    setIsLogsLoading(true)
    setLogsError(null)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch('/api/security-monitoring/activity?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch activity logs: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.success && data.data.activities) {
        setActivityLogs(data.data.activities)
      } else {
        throw new Error(data.message || 'Failed to fetch logs')
      }
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLogsLoading(false)
    }
  }, [])

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!isLoggedIn) {
        setIsLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          setError('Authentication token not found')
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.success && data.data.user) {
          if (data.data.user.role === 'ADMIN') {
            setUser(data.data.user)
            // Fetch logs only if user is admin
            fetchActivityLogs();
          } else {
            setError('Access denied. Admin role required.')
          }
        } else {
          setError('Failed to load user data')
        }
      } catch (err) {
        console.error('Error checking admin role:', err)
        setError(err instanceof Error ? err.message : 'Failed to verify admin access')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminRole()
  }, [isLoggedIn, fetchActivityLogs])

  const handleRefresh = () => {
    if (user?.role === 'ADMIN') {
      fetchActivityLogs();
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="text-slate-600">Verifying access...</p>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Show error or non-admin state
  if (error || !user) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <Shield className="w-60 h-60 text-slate-300" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-sans font-medium text-slate-900">
                Access Denied
              </h3>
              <p className="text-base text-slate-500 leading-relaxed">
                {error || "You don't have permission to access the enhanced admin dashboard."}
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </ContentWrapper>
    )
  }
  
  return (
    <ContentWrapper>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Enhanced Admin Dashboard</h1>
            <p className="text-slate-600">Comprehensive monitoring and control center for {user.firstName}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLogsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards (Could be made dynamic later) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* ... existing stat cards ... */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">2,847</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Properties</p>
              <p className="text-2xl font-bold text-gray-900">1,456</p>
            </div>
            <Database className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-green-600">99.9%</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Security Score</p>
              <p className="text-2xl font-bold text-green-600">A+</p>
            </div>
            <Shield className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {/* ... existing tabs ... */}
        </nav>
      </div>
      
      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Recent Activity Logs */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Activity Log</h3>
          {isLogsLoading && <p className="text-slate-500">Loading logs...</p>}
          {logsError && <p className="text-red-500">Error loading logs: {logsError}</p>}
          {!isLogsLoading && !logsError && (
            <div className="space-y-3">
              {activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getActivityIcon(log.action)}
                      <div>
                        <p className="font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-600">
                          {log.user ? `User: ${log.user.name || log.user.email}` : 'System Action'}
                          <span className="mx-2">·</span>
                          IP: {log.ipAddress || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No activity logs found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </ContentWrapper>
  )
}