// Security monitoring types

export interface SecurityAlert {
  id: string;
  type: SecurityAlertType;
  severity: SecuritySeverity;
  description: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export type SecurityAlertType =
  | 'MULTIPLE_FAILED_LOGINS'
  | 'MULTIPLE_FAILED_OTPS'
  | 'UNUSUAL_ACCESS_TIME'
  | 'SUSPICIOUS_LOCATION'
  | 'MULTIPLE_SESSIONS'
  | 'API_ABUSE'
  | 'HIGH_ERROR_RATE'
  | 'SLOW_RESPONSE_ATTACK'
  | 'BRUTE_FORCE_ATTEMPT'
  | 'ANOMALY_DETECTED';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityAlertsResponse {
  success: boolean;
  count: number;
  data: SecurityAlert[];
  message?: string;
}

export interface SecurityStats {
  totalAnomalies: number;
  unresolvedAnomalies: number;
  resolutionRate: number;
  highSeverityCount: number;
}

export interface SecurityDashboardData {
  summary: SecurityStats;
  recentAlerts: SecurityAlert[];
  lastUpdated: string;
}