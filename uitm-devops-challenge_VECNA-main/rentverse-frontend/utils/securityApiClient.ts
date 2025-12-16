import { createApiUrl } from './apiConfig';
import type { SecurityAlertsResponse, SecurityAlert } from '@/types/security';

/**
 * Fetch security alerts from the backend
 */
export async function fetchSecurityAlerts(): Promise<SecurityAlertsResponse> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(createApiUrl('auth/security-alerts'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch security alerts: ${response.statusText}`);
    }

    const data: SecurityAlertsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    throw error;
  }
}

/**
 * Resolve a security alert
 */
export async function resolveSecurityAlert(alertId: string): Promise<{ success: boolean; message: string }> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(createApiUrl(`security-monitoring/anomalies/${alertId}/resolve`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        resolution: 'Resolved by admin dashboard'
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to resolve security alert: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error resolving security alert:', error);
    throw error;
  }
}

/**
 * Get security alert severity color
 */
export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get security alert type icon
 */
export function getAlertTypeIcon(type: string): string {
  switch (type) {
    case 'MULTIPLE_FAILED_LOGINS':
    case 'MULTIPLE_FAILED_OTPS':
      return '🔐';
    case 'UNUSUAL_ACCESS_TIME':
      return '🕐';
    case 'SUSPICIOUS_LOCATION':
      return '📍';
    case 'MULTIPLE_SESSIONS':
      return '👥';
    case 'API_ABUSE':
      return '⚡';
    case 'HIGH_ERROR_RATE':
      return '📊';
    case 'SLOW_RESPONSE_ATTACK':
      return '🐌';
    case 'BRUTE_FORCE_ATTEMPT':
      return '🔨';
    case 'ANOMALY_DETECTED':
      return '🤖';
    default:
      return '⚠️';
  }
}