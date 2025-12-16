import { useEffect, useRef, useState, useCallback } from 'react'

export interface WebSocketMessage {
  type: 'metric' | 'alert' | 'activity' | 'system' | 'security'
  data: any
  timestamp: string
  source: string
}

export interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: number
  responseTime: number
  activeConnections: number
  databaseConnections: number
  errorRate: number
}

export interface SecurityMetrics {
  failedLogins: number
  activeThreats: number
  blockedIPs: number
  suspiciousActivities: number
  securityScore: number
  lastScan: string
}

export interface ActivityEvent {
  id: string
  type: 'user_login' | 'property_upload' | 'booking_created' | 'payment_processed' | 'security_alert'
  user: string
  timestamp: string
  ipAddress: string
  status: 'success' | 'failed' | 'pending'
  details: string
}

interface WebSocketManagerOptions {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private isManualClose = false

  constructor(private options: WebSocketManagerOptions = {}) {
    this.options = {
      url: options.url || 'ws://localhost:8080/ws',
      reconnectInterval: options.reconnectInterval || 5000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      heartbeatInterval: options.heartbeatInterval || 30000,
      ...options
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.isManualClose = false
    
    try {
      this.ws = new WebSocket(this.options.url!)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.options.onConnect?.()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.options.onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.stopHeartbeat()
        this.options.onDisconnect?.()
        
        if (!this.isManualClose && this.reconnectAttempts < this.options.maxReconnectAttempts!) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.options.onError?.(error)
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.isManualClose = true
    this.stopHeartbeat()
    this.clearReconnectTimer()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts}`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, this.options.reconnectInterval)
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() })
      }
    }, this.options.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// React hook for using WebSocket manager
export function useWebSocketManager(options: WebSocketManagerOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const managerRef = useRef<WebSocketManager | null>(null)

  const handleMessage = useCallback((message: WebSocketMessage) => {
    setLastMessage(message)
    setError(null)
  }, [])

  const handleConnect = useCallback(() => {
    setIsConnected(true)
    setError(null)
  }, [])

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
  }, [])

  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error)
    setError('Connection error occurred')
  }, [])

  useEffect(() => {
    managerRef.current = new WebSocketManager({
      ...options,
      onMessage: handleMessage,
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
      onError: handleError
    })

    managerRef.current.connect()

    return () => {
      managerRef.current?.disconnect()
    }
  }, [handleMessage, handleConnect, handleDisconnect, handleError])

  const sendMessage = useCallback((message: any) => {
    managerRef.current?.send(message)
  }, [])

  const connect = useCallback(() => {
    managerRef.current?.connect()
  }, [])

  const disconnect = useCallback(() => {
    managerRef.current?.disconnect()
  }, [])

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect
  }
}

// Mock data generator for demonstration
export function generateMockMetrics(): SystemMetrics {
  return {
    cpu: Math.floor(Math.random() * 30) + 10, // 10-40%
    memory: Math.floor(Math.random() * 20) + 15, // 15-35%
    disk: Math.floor(Math.random() * 40) + 30, // 30-70%
    network: Math.floor(Math.random() * 100) + 50, // 50-150 MB/s
    uptime: 15 * 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // 15-22 days
    responseTime: Math.floor(Math.random() * 100) + 100, // 100-200ms
    activeConnections: Math.floor(Math.random() * 50) + 100, // 100-150
    databaseConnections: Math.floor(Math.random() * 20) + 5, // 5-25
    errorRate: Math.random() * 0.5 // 0-0.5%
  }
}

export function generateMockSecurityMetrics(): SecurityMetrics {
  return {
    failedLogins: Math.floor(Math.random() * 20) + 5,
    activeThreats: Math.floor(Math.random() * 3),
    blockedIPs: Math.floor(Math.random() * 10) + 2,
    suspiciousActivities: Math.floor(Math.random() * 8) + 1,
    securityScore: Math.floor(Math.random() * 10) + 90, // 90-100
    lastScan: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString() // Within last hour
  }
}

export function generateMockActivityEvent(): ActivityEvent {
  const eventTypes: ActivityEvent['type'][] = [
    'user_login', 'property_upload', 'booking_created', 'payment_processed', 'security_alert'
  ]
  
  const users = ['admin@rentverse.com', 'user@example.com', 'owner@rentverse.com', 'tenant@rentverse.com']
  const statuses: ActivityEvent['status'][] = ['success', 'failed', 'pending']
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    user: users[Math.floor(Math.random() * users.length)],
    timestamp: new Date().toISOString(),
    ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    details: 'Activity details here'
  }
}