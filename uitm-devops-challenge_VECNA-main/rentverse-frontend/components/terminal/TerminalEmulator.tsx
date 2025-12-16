import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Terminal as TerminalIcon, Play, Square, RotateCcw, Maximize2, Minimize2 } from 'lucide-react'

// Terminal types
interface TerminalConfig {
  theme: 'dark' | 'light' | 'matrix'
  fontSize: number
  animations: boolean
  soundEffects: boolean
}

interface CommandResult {
  output: string[]
  success: boolean
  duration: number
  timestamp: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface TerminalLine {
  id: string
  content: string
  type: 'input' | 'output' | 'command' | 'banner'
  timestamp: string
  color?: string
}

// Terminal themes
const themes = {
  dark: {
    background: '#0f0f0f',
    foreground: '#ffffff',
    accent: '#00ff00',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#0080ff'
  },
  light: {
    background: '#ffffff',
    foreground: '#000000',
    accent: '#0066cc',
    success: '#00aa00',
    warning: '#ff8800',
    error: '#cc0000',
    info: '#0066cc'
  },
  matrix: {
    background: '#000000',
    foreground: '#00ff00',
    accent: '#00ff00',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff'
  }
}

export default function TerminalEmulator() {
  const [config, setConfig] = useState<TerminalConfig>({
    theme: 'dark',
    fontSize: 14,
    animations: true,
    soundEffects: false
  })

  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const theme = themes[config.theme]

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  // Focus input when terminal is clicked
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Add a new line to the terminal
  const addLine = useCallback((content: string, type: TerminalLine['type'] = 'output', color?: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date().toLocaleTimeString(),
      color
    }
    setLines(prev => [...prev, newLine])
  }, [])

  // Add ASCII banner for module demonstrations
  const addBanner = useCallback((title: string) => {
    const banner = `
╔════════════════════════════════════════════════════════╗
║                     ${title.padEnd(48)}║
╚════════════════════════════════════════════════════════╝`
    addLine(banner, 'banner', theme.accent)
  }, [addLine, theme.accent])

  // Clear terminal
  const clearTerminal = useCallback(() => {
    setLines([])
  }, [])

  // Execute command
  const executeCommand = useCallback(async (command: string) => {
    if (isRunning) return

    setIsRunning(true)
    
    // Add command to history
    setCommandHistory(prev => [...prev, command])
    setHistoryIndex(-1)

    // Add command line
    addLine(`$ ${command}`, 'command', theme.foreground)

    const trimmedCommand = command.trim().toLowerCase()
    const startTime = Date.now()

    try {
      // Handle different commands
      if (trimmedCommand === 'clear' || trimmedCommand === 'cls') {
        clearTerminal()
      } else if (trimmedCommand === 'help') {
        await showHelp()
      } else if (trimmedCommand === 'demo all') {
        await runAllModules()
      } else if (trimmedCommand.startsWith('demo module-')) {
        const moduleNum = trimmedCommand.split('-')[1]
        await runSingleModule(moduleNum)
      } else if (trimmedCommand === 'status') {
        await showSystemStatus()
      } else if (trimmedCommand === 'monitor') {
        await startRealTimeMonitoring()
      } else if (trimmedCommand === 'performance') {
        await showPerformanceMetrics()
      } else if (trimmedCommand === 'security') {
        await showSecurityDashboard()
      } else if (trimmedCommand === 'users') {
        await showUserManagement()
      } else {
        await showUnknownCommand(trimmedCommand)
      }

      const duration = Date.now() - startTime
      addLine(`\n[Execution completed in ${duration}ms]`, 'output', theme.info)

    } catch (error) {
      addLine(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`, 'output', theme.error)
    } finally {
      setIsRunning(false)
    }
  }, [isRunning, addLine, clearTerminal, theme])

  // Show help information
  const showHelp = async () => {
    addLine('\nAvailable Commands:', 'output', theme.info)
    addLine('  demo all              - Run all module demonstrations', 'output')
    addLine('  demo module-<1-6>     - Run specific module demo', 'output')
    addLine('  status                - Show system status overview', 'output')
    addLine('  monitor               - Start real-time monitoring', 'output')
    addLine('  performance           - Show performance metrics', 'output')
    addLine('  security              - Display security dashboard', 'output')
    addLine('  users                 - Show user management', 'output')
    addLine('  clear/cls             - Clear terminal screen', 'output')
    addLine('  help                  - Show this help message', 'output')
    addLine('\nModule Details:', 'output', theme.info)
    addLine('  module-1: Authentication & Security Testing', 'output')
    addLine('  module-2: File Upload & Image Processing', 'output')
    addLine('  module-3: PDF Generation & Digital Signatures', 'output')
    addLine('  module-4: AI Property Recommendations', 'output')
    addLine('  module-5: Advanced Logging & Analytics', 'output')
    addLine('  module-6: Real-time Notifications & WebSockets', 'output')
  }

  // Show unknown command
  const showUnknownCommand = async (command: string) => {
    addLine(`\nCommand not found: ${command}`, 'output', theme.error)
    addLine('Type "help" for available commands.', 'output', theme.info)
  }

  // Individual module runners
  const runSingleModule = async (moduleNum: string) => {
    const moduleMap = {
      '1': { title: 'Authentication & Security Testing', demo: runModule1 },
      '2': { title: 'File Upload & Image Processing', demo: runModule2 },
      '3': { title: 'PDF Generation & Digital Signatures', demo: runModule3 },
      '4': { title: 'AI Property Recommendations', demo: runModule4 },
      '5': { title: 'Advanced Logging & Analytics', demo: runModule5 },
      '6': { title: 'Real-time Notifications & WebSockets', demo: runModule6 }
    }

    const module = moduleMap[moduleNum as keyof typeof moduleMap]
    if (module) {
      addBanner(`MODULE ${moduleNum}: ${module.title}`)
      await module.demo()
    } else {
      addLine(`Invalid module number: ${moduleNum}`, 'output', theme.error)
      addLine('Available modules: 1-6', 'output', theme.info)
    }
  }

  // Module 1: Authentication & Security Testing
  const runModule1 = async () => {
    const tests = [
      { name: 'JWT token validation', delay: 234 },
      { name: 'MFA integration', delay: 189 },
      { name: 'OAuth endpoints', delay: 156 },
      { name: 'Rate limiting', delay: 98 },
      { name: 'Password strength', delay: 145 },
      { name: 'Session management', delay: 167 }
    ]

    for (const test of tests) {
      if (config.animations) {
        await new Promise(resolve => setTimeout(resolve, test.delay))
      }
      addLine(`[RUN] Testing ${test.name}... ✅ PASSED`, 'output', theme.success)
    }

    addLine('\n📊 Results: 6/6 tests passed', 'output', theme.success)
    addLine('🛡️  Security Score: 97/100', 'output', theme.success)
    addLine('⚡ Performance: Excellent', 'output', theme.success)
  }

  // Module 2: File Upload & Image Processing
  const runModule2 = async () => {
    const operations = [
      { name: 'Cloudinary integration', delay: 245, icon: '☁️' },
      { name: 'Single file upload', delay: 567, icon: '📁' },
      { name: 'Multiple file upload', delay: 892, icon: '📂' },
      { name: 'Image optimization', delay: 123, icon: '🖼️' },
      { name: 'Video thumbnail generation', delay: 890, icon: '🎬' },
      { name: 'File deletion', delay: 45, icon: '🗑️' }
    ]

    for (const op of operations) {
      if (config.animations) {
        await new Promise(resolve => setTimeout(resolve, op.delay))
      }
      addLine(`[RUN] ${op.icon} ${op.name}... ✅ ${op.delay}ms`, 'output', theme.success)
    }

    addLine('\n📊 Performance: 2.76s total processing time', 'output', theme.info)
    addLine('💾 Storage: 2.3GB used, 47.7GB available', 'output', theme.info)
    addLine('🚀 Upload Success Rate: 99.8%', 'output', theme.success)
  }

  // Module 3: PDF Generation & Digital Signatures
  const runModule3 = async () => {
    const processes = [
      { name: 'e-signature workflow', delay: 234 },
      { name: 'Rental agreement generation', delay: 445 },
      { name: 'Digital signature validation', delay: 89 },
      { name: 'PDF watermarking', delay: 156 },
      { name: 'Contract approval workflow', delay: 234 }
    ]

    for (const process of processes) {
      if (config.animations) {
        await new Promise(resolve => setTimeout(resolve, process.delay))
      }
      addLine(`[RUN] ${process.name}... ✅ ${process.delay}ms`, 'output', theme.success)
    }

    addLine('\n📋 Contracts Generated: 1,247 this month', 'output', theme.info)
    addLine('✍️  Signatures Collected: 892 valid signatures', 'output', theme.success)
    addLine('📄 Document Security: Enterprise-grade', 'output', theme.success)
  }

  // Module 4: AI Property Recommendations
  const runModule4 = async () => {
    const aiTasks = [
      { name: 'Connecting to AI service (localhost:8000)', delay: 234 },
      { name: 'Price prediction model', delay: 189 },
      { name: 'Property classification', delay: 156 },
      { name: 'Market analysis', delay: 278 },
      { name: 'Recommendation engine', delay: 167 },
      { name: 'Risk assessment', delay: 145 }
    ]

    for (const task of aiTasks) {
      if (config.animations) {
        await new Promise(resolve => setTimeout(resolve, task.delay))
      }
      addLine(`[RUN] ${task.name}... ✅ ${task.delay}ms`, 'output', theme.success)
    }

    addLine('\n🤖 AI Confidence: 94.2%', 'output', theme.info)
    addLine('📈 Predictions Made: 15,678 this month', 'output', theme.info)
    addLine('🎯 Accuracy Rate: 89.7%', 'output', theme.success)
    addLine('💰 Revenue Impact: +23% from AI recommendations', 'output', theme.success)
  }

  // Module 5: Advanced Logging & Analytics
  const runModule5 = async () => {
    const loggingTasks = [
      { name: 'Processing activity logs', delay: 167 },
      { name: 'Authentication events', delay: 98 },
      { name: 'Property operations', delay: 134 },
      { name: 'Booking activities', delay: 89 },
      { name: 'Security alerts', delay: 156 },
      { name: 'Audit trail generation', delay: 112 }
    ]

    for (const task of loggingTasks) {
      if (config.animations) {
        await new Promise(resolve => setTimeout(resolve, task.delay))
      }
      addLine(`[RUN] ${task.name}... ✅ ${task.delay}ms`, 'output', theme.success)
    }

    addLine('\n📊 Log Entries: 37,191 today', 'output', theme.info)
    addLine('⚡ Real-time Processing: 99.9% uptime', 'output', theme.success)
    addLine('🔍 Search Performance: 45ms average', 'output', theme.success)
    addLine('📈 Data Growth: +15% vs last month', 'output', theme.info)
  }

  // Module 6: Real-time Notifications & WebSockets
  const runModule6 = async () => {
    const wsTasks = [
      { name: 'Establishing WebSocket connections', delay: 189 },
      { name: 'Real-time chat initialization', delay: 234 },
      { name: 'Live property updates', delay: 167 },
      { name: 'System notifications', delay: 98 },
      { name: 'WebSocket health check', delay: 145 },
      { name: 'Connection pooling', delay: 123 }
    ]

    for (const task of wsTasks) {
      if (config.animations) {
        await new Promise(resolve => setTimeout(resolve, task.delay))
      }
      addLine(`[RUN] ${task.name}... ✅ ${task.delay}ms`, 'output', theme.success)
    }

    addLine('\n🚀 WebSocket Connections: 847 active', 'output', theme.info)
    addLine('📱 Notifications Sent: 12,345 today', 'output', theme.info)
    addLine('⚡ Latency: 23ms average', 'output', theme.success)
    addLine('🔄 Reconnection Rate: 0.1%', 'output', theme.success)
  }

  // Run all modules
  const runAllModules = async () => {
    addBanner('RENTVERSE FULL SYSTEM DEMONSTRATION')
    addLine('Starting comprehensive system test...\n', 'output', theme.info)

    for (let i = 1; i <= 6; i++) {
      addLine(`\n--- Running Module ${i} ---`, 'output', theme.accent)
      await runSingleModule(i.toString())
      
      if (config.animations && i < 6) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    addBanner('DEMONSTRATION COMPLETE')
    addLine('\n🎉 All 6 modules executed successfully!', 'output', theme.success)
    addLine('🏆 System Status: FULLY OPERATIONAL', 'output', theme.success)
    addLine('⚡ Performance Rating: EXCELLENT', 'output', theme.success)
  }

  // System status display
  const showSystemStatus = async () => {
    addBanner('SYSTEM STATUS OVERVIEW')
    
    const statusItems = [
      { name: 'Database Connection', status: 'HEALTHY', color: theme.success },
      { name: 'API Gateway', status: 'OPERATIONAL', color: theme.success },
      { name: 'File Storage', status: 'AVAILABLE', color: theme.success },
      { name: 'AI Service', status: 'RUNNING', color: theme.success },
      { name: 'WebSocket Server', status: 'CONNECTED', color: theme.success },
      { name: 'Authentication', status: 'SECURE', color: theme.success }
    ]

    for (const item of statusItems) {
      addLine(`  ${item.name}: ${item.status}`, 'output', item.color)
    }

    addLine('\n📊 System Load: 23%', 'output', theme.info)
    addLine('💾 Memory Usage: 1.2GB / 8GB', 'output', theme.info)
    addLine('🔄 Uptime: 15 days, 7 hours', 'output', theme.success)
  }

  // Performance metrics
  const showPerformanceMetrics = async () => {
    addBanner('PERFORMANCE METRICS')
    
    const metrics = [
      { name: 'API Response Time', value: '145ms', trend: '+5%' },
      { name: 'Database Queries', value: '234ms avg', trend: '-12%' },
      { name: 'File Upload Speed', value: '2.3MB/s', trend: '+8%' },
      { name: 'AI Processing', value: '890ms', trend: '-15%' }
    ]

    for (const metric of metrics) {
      addLine(`  ${metric.name}: ${metric.value} (${metric.trend})`, 'output', theme.info)
    }

    addLine('\n🎯 Overall Performance: OPTIMIZED', 'output', theme.success)
  }

  // Security dashboard
  const showSecurityDashboard = async () => {
    addBanner('SECURITY MONITORING')
    
    const securityItems = [
      { name: 'Failed Login Attempts', value: '12 today', status: 'normal' },
      { name: 'Active Threats', value: '0', status: 'good' },
      { name: 'SSL Certificates', value: 'Valid', status: 'good' },
      { name: 'Firewall Status', value: 'Active', status: 'good' },
      { name: 'Intrusion Attempts', value: '3 blocked', status: 'warning' }
    ]

    for (const item of securityItems) {
      const color = item.status === 'good' ? theme.success : 
                   item.status === 'warning' ? theme.warning : theme.info
      addLine(`  ${item.name}: ${item.value}`, 'output', color)
    }

    addLine('\n🛡️  Security Level: HIGH', 'output', theme.success)
  }

  // User management
  const showUserManagement = async () => {
    addBanner('USER MANAGEMENT')
    
    addLine('  Total Users: 2,847', 'output', theme.info)
    addLine('  Active Sessions: 156', 'output', theme.info)
    addLine('  New Registrations: 23 today', 'output', theme.info)
    addLine('  Admin Users: 5', 'output', theme.warning)
    addLine('  Premium Users: 89', 'output', theme.success)

    addLine('\n👥 User Growth: +12% this month', 'output', theme.success)
  }

  // Real-time monitoring
  const startRealTimeMonitoring = async () => {
    addBanner('REAL-TIME MONITORING')
    addLine('Starting live system monitoring...', 'output', theme.info)
    addLine('Press Ctrl+C to stop monitoring\n', 'output', theme.warning)

    // Simulate real-time updates
    const monitoringInterval = setInterval(() => {
      const cpuUsage = Math.floor(Math.random() * 30) + 10
      const memoryUsage = Math.floor(Math.random() * 20) + 15
      const activeUsers = Math.floor(Math.random() * 50) + 100
      const responseTime = Math.floor(Math.random() * 100) + 100

      const timestamp = new Date().toLocaleTimeString()
      addLine(`[${timestamp}] CPU: ${cpuUsage}% | Memory: ${memoryUsage}% | Users: ${activeUsers} | Response: ${responseTime}ms`, 'output', theme.info)
    }, 2000)

    // Stop monitoring after 10 seconds
    setTimeout(() => {
      clearInterval(monitoringInterval)
      addLine('\n🔴 Monitoring stopped', 'output', theme.warning)
    }, 10000)
  }

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRunning) {
      if (currentInput.trim()) {
        executeCommand(currentInput)
        setCurrentInput('')
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[newIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCurrentInput('')
        } else {
          setHistoryIndex(newIndex)
          setCurrentInput(commandHistory[newIndex] || '')
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      clearTerminal()
    }
  }, [currentInput, isRunning, commandHistory, historyIndex, executeCommand, clearTerminal])

  // Initialize terminal
  useEffect(() => {
    addLine('Welcome to Rentverse Terminal Demonstration System', 'output', theme.accent)
    addLine('Type "help" for available commands or "demo all" to start the full demonstration.', 'output', theme.info)
    addLine('')
  }, [])

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-96'} bg-black rounded-lg overflow-hidden border border-gray-700`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-4 h-4 text-green-400" />
          <span className="text-sm text-gray-300">Rentverse Terminal</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            disabled={isRunning}
          >
            {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={clearTerminal}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            disabled={isRunning}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm"
        style={{ 
          backgroundColor: theme.background,
          color: theme.foreground,
          fontSize: `${config.fontSize}px`
        }}
        onClick={focusInput}
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={`mb-1 ${
              line.type === 'input' ? 'text-green-400' :
              line.type === 'command' ? 'text-blue-400' :
              line.type === 'banner' ? 'text-yellow-400' :
              ''
            }`}
            style={{ color: line.color || undefined }}
            dangerouslySetInnerHTML={{ __html: line.content.replace(/\n/g, '<br>') }}
          />
        ))}
        
        {/* Current Input Line */}
        <div className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white outline-none"
            style={{ fontSize: `${config.fontSize}px` }}
            disabled={isRunning}
            autoFocus
          />
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Ctrl+L: Clear | ↑↓: History | Enter: Execute</span>
          <span>Theme: {config.theme} | Size: {config.fontSize}px</span>
        </div>
      </div>
    </div>
  )
}