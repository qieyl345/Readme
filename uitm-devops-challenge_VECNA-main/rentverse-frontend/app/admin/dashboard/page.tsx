'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ContentWrapper from '@/components/ContentWrapper'
import {
  Shield,
  AlertTriangle,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  Server,
  Lock,
  UserCheck,
  UserX,
  FileCheck,
  FileX,
  LogIn,
  LogOut,
  Bell
} from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import { formatDistanceToNow } from 'date-fns'
import { createApiUrl } from '@/utils/apiConfig'
import { fetchSecurityAlerts, resolveSecurityAlert, getSeverityColor, getAlertTypeIcon } from '@/utils/securityApiClient'
import type { SecurityAlert } from '@/types/security'

// --- TYPE DEFINITIONS ---

interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  name:string
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

const getStatusFromAction = (action: string): { text: 'Success' | 'Failed' | 'Risk' | 'Info', Icon: React.ElementType, className: string } => {
  if (action.includes('FAILED') || action.includes('INVALID')) {
    return { text: 'Failed', Icon: XCircle, className: 'bg-orange-100 text-orange-800' };
  }
  if (action.includes('SUSPICIOUS') || action.includes('ANOMALY') || action.includes('ALERT')) {
    return { text: 'Risk', Icon: AlertTriangle, className: 'bg-red-100 text-red-800' };
  }
  if (action.includes('SUCCESS') || action.includes('RESOLVED') || action.includes('ENABLED')) {
    return { text: 'Success', Icon: CheckCircle, className: 'bg-green-100 text-green-800' };
  }
  return { text: 'Info', Icon: Activity, className: 'bg-blue-100 text-blue-800' };
};


export default function SecurityDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real-time data states
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isLogsLoading, setIsLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState<string | null>(null)

  // Security alerts states
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [isLoadingSecurityAlerts, setIsLoadingSecurityAlerts] = useState(true)
  const [resolvingAlerts, setResolvingAlerts] = useState<Set<string>>(new Set())

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  const { isLoggedIn } = useAuthStore()

  const fetchActivityLogs = useCallback(async () => {
    setIsLogsLoading(true)
    setLogsError(null)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) throw new Error('Authentication token not found')

      const apiUrl = '/api/auth/activity-logs'
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) throw new Error(`Failed to fetch activity logs: ${response.statusText}`)

      const data = await response.json()
      if (data.success && data.data) {
        // Handle different response formats - auth endpoint returns data.data as array
        const activities = Array.isArray(data.data) ? data.data : data.data.activities || []
        setActivityLogs(activities)
      } else {
        throw new Error(data.message || 'Failed to fetch logs')
      }
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLogsLoading(false)
    }
  }, [])

  const fetchRealtimeThreats = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const realtimeUrl = createApiUrl('security-monitoring/realtime')
      const response = await fetch(realtimeUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.metrics.activeThreats > 0) {
          const threatCount = data.data.metrics.activeThreats;
          showToastMessage(`⚠️ ${threatCount} active security threat${threatCount > 1 ? 's' : ''} detected! Review immediately.`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch real-time threats:", err);
    }
  }, []);

  const fetchSecurityAlertsData = useCallback(async () => {
    setIsLoadingSecurityAlerts(true)
    try {
      const response = await fetchSecurityAlerts()
      if (response.success) {
        setSecurityAlerts(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch security alerts:', err)
    } finally {
      setIsLoadingSecurityAlerts(false)
    }
  }, [])

  const handleResolveAlert = useCallback(async (alertId: string) => {
    setResolvingAlerts(prev => new Set(prev).add(alertId))
    try {
      const response = await resolveSecurityAlert(alertId)
      if (response.success) {
        setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId))
        showToastMessage('Security alert resolved successfully')
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err)
      showToastMessage('Failed to resolve security alert')
    } finally {
      setResolvingAlerts(prev => {
        const newSet = new Set(prev)
        newSet.delete(alertId)
        return newSet
      })
    }
  }, [])

  // Main effect for initialization and polling
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
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`)

        const data = await response.json()

        if (data.success && data.data.user && data.data.user.role === 'ADMIN') {
          setUser(data.data.user)
          fetchActivityLogs();
          fetchSecurityAlertsData();
          // fetchRealtimeThreats(); // Temporarily disabled
        } else {
          setError(data.data.user.role !== 'ADMIN' ? 'Access denied. Admin role required.' : 'Failed to load user data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify admin access')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminRole();

    // Set up polling for real-time threats
    const interval = setInterval(() => {
      if (isLoggedIn && user?.role === 'ADMIN') {
        // fetchRealtimeThreats(); // Temporarily disabled
      }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval); // Cleanup on unmount

  }, [isLoggedIn, user?.role, fetchActivityLogs, fetchSecurityAlertsData, fetchRealtimeThreats])

  // Polling for security alerts
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return
    const interval = setInterval(() => {
      fetchSecurityAlertsData()
    }, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [user, fetchSecurityAlertsData])

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 5000)
  }

  // Loading UI
  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="text-slate-600">Verifying admin access...</p>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Error or non-admin UI
  if (error || !user) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-6 max-w-md">
            <Shield className="w-60 h-60 text-slate-300 mx-auto" />
            <div className="space-y-3">
              <h3 className="text-xl font-sans font-medium text-slate-900">Access Denied</h3>
              <p className="text-base text-slate-500 leading-relaxed">
                {error || "You don't have permission to view the security dashboard."}
              </p>
            </div>
            <Link href="/" className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              Go to Home
            </Link>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      {/* Toast Notification */}
      {showToast && toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{toastMessage}</p>
            </div>
            <button onClick={() => setShowToast(false)} className="text-slate-400 hover:text-slate-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-8 h-8 text-teal-600" />
              <h1 className="text-3xl font-bold text-slate-900">Security Dashboard</h1>
            </div>
            <p className="text-slate-600">Real-time security monitoring and activity log</p>
          </div>
          <button
            onClick={fetchActivityLogs}
            disabled={isLogsLoading}
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors bg-teal-600 hover:bg-teal-700 text-white disabled:bg-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLogsLoading ? 'animate-spin' : ''}`} />
            <span>{isLogsLoading ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-red-600" />
              Security Alerts
              {securityAlerts.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                  {securityAlerts.length}
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">Live</span>
            </div>
          </div>
        </div>

        {isLoadingSecurityAlerts && <p className="p-6 text-slate-500">Loading security alerts...</p>}
        {!isLoadingSecurityAlerts && (
          <div className="p-6">
            {securityAlerts.length > 0 ? (
              <div className="space-y-4">
                {securityAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getAlertTypeIcon(alert.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-slate-900">{alert.type.replace(/_/g, ' ')}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>{alert.severity}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{alert.description}</p>
                        <div className="text-xs text-slate-500">
                          <span>User: {alert.user.name || alert.user.email}</span>
                          <span className="mx-2">·</span>
                          <span>IP: {alert.ipAddress}</span>
                          <span className="mx-2">·</span>
                          <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      disabled={resolvingAlerts.has(alert.id)}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-300 text-sm"
                    >
                      {resolvingAlerts.has(alert.id) ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>{resolvingAlerts.has(alert.id) ? 'Resolving...' : 'Resolve'}</span>
                    </button>
                  </div>
                ))}
                {securityAlerts.length > 5 && (
                  <p className="text-sm text-slate-500 text-center">... and {securityAlerts.length - 5} more alerts</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-slate-600">No security alerts at this time.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Activity Feed (Module 5) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Live Activity Feed
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">Live</span>
            </div>
          </div>
        </div>

        {isLogsLoading && <p className="p-6 text-slate-500">Loading activity feed...</p>}
        {logsError && <p className="p-6 text-red-500">Error: {logsError}</p>}
        {!isLogsLoading && !logsError && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {activityLogs.map((log) => {
                  const status = getStatusFromAction(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        <div className="flex items-center">
                          {getActivityIcon(log.action)}
                          <span className="ml-3">{log.action.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-slate-400 mr-2" />
                          {log.user ? log.user.name || log.user.email : 'System/Anonymous'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                          {log.ipAddress || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                          <status.Icon className="w-3 h-3 mr-1" />
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-slate-400 mr-2" />
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ContentWrapper>
  )
}
