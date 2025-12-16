'use client'

import React, { useState } from 'react'
import TerminalEmulator from '@/components/terminal/TerminalEmulator'
import ContentWrapper from '@/components/ContentWrapper'
import { Terminal, Code, Zap, Shield, Database, Bot, Activity } from 'lucide-react'

export default function TerminalDemoPage() {
  const [activeView, setActiveView] = useState<'terminal' | 'overview'>('terminal')

  const moduleInfo = [
    {
      id: 1,
      title: 'Authentication & Security Testing',
      icon: Shield,
      description: 'JWT validation, MFA integration, OAuth endpoints, rate limiting',
      tests: ['JWT Token Validation', 'MFA Integration', 'OAuth Endpoints', 'Rate Limiting', 'Password Strength', 'Session Management'],
      status: 'operational',
      performance: '97/100'
    },
    {
      id: 2,
      title: 'File Upload & Image Processing',
      icon: Database,
      description: 'Cloudinary integration, multiple file uploads, image optimization',
      tests: ['Cloudinary Integration', 'Single File Upload', 'Multiple File Upload', 'Image Optimization', 'Video Thumbnail', 'File Deletion'],
      status: 'operational',
      performance: '99.8%'
    },
    {
      id: 3,
      title: 'PDF Generation & Digital Signatures',
      icon: Code,
      description: 'E-signature workflow, rental agreements, digital validation',
      tests: ['E-signature Workflow', 'Rental Agreement Generation', 'Digital Signature Validation', 'PDF Watermarking', 'Contract Approval'],
      status: 'operational',
      performance: '1,247 contracts'
    },
    {
      id: 4,
      title: 'AI Property Recommendations',
      icon: Bot,
      description: 'Price prediction, property classification, market analysis',
      tests: ['AI Service Connection', 'Price Prediction Model', 'Property Classification', 'Market Analysis', 'Recommendation Engine', 'Risk Assessment'],
      status: 'operational',
      performance: '94.2% accuracy'
    },
    {
      id: 5,
      title: 'Advanced Logging & Analytics',
      icon: Activity,
      description: 'Activity logs, security alerts, audit trails, real-time processing',
      tests: ['Activity Log Processing', 'Authentication Events', 'Property Operations', 'Booking Activities', 'Security Alerts', 'Audit Trail Generation'],
      status: 'operational',
      performance: '37,191 logs today'
    },
    {
      id: 6,
      title: 'Real-time Notifications & WebSockets',
      icon: Zap,
      description: 'WebSocket connections, real-time chat, live updates, system notifications',
      tests: ['WebSocket Connection', 'Real-time Chat', 'Live Property Updates', 'System Notifications', 'Health Check', 'Connection Pooling'],
      status: 'operational',
      performance: '847 active connections'
    }
  ]

  const quickStats = {
    totalModules: 6,
    operationalModules: 6,
    totalTests: 32,
    passedTests: 32,
    systemUptime: '99.9%',
    avgResponseTime: '145ms'
  }

  return (
    <ContentWrapper>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Terminal className="w-8 h-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-slate-900">Terminal Demonstration System</h1>
        </div>
        <p className="text-slate-600 text-lg">
          Interactive terminal interface showcasing all 6 Rentverse modules with real-time execution simulation
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveView('terminal')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'terminal'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Terminal className="w-4 h-4 inline mr-2" />
              Live Terminal
            </button>
            <button
              onClick={() => setActiveView('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'overview'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Code className="w-4 h-4 inline mr-2" />
              Module Overview
            </button>
          </nav>
        </div>
      </div>

      {activeView === 'terminal' ? (
        /* Terminal View */
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-teal-600">{quickStats.totalModules}</div>
              <div className="text-sm text-gray-600">Total Modules</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{quickStats.operationalModules}</div>
              <div className="text-sm text-gray-600">Operational</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{quickStats.totalTests}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{quickStats.passedTests}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{quickStats.systemUptime}</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">{quickStats.avgResponseTime}</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
          </div>

          {/* Terminal Component */}
          <TerminalEmulator />

          {/* Quick Commands Help */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Commands</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-gray-900">Demonstration Commands:</div>
                <div className="space-y-1 text-gray-600">
                  <div><code className="bg-gray-200 px-2 py-1 rounded">demo all</code> - Run all modules</div>
                  <div><code className="bg-gray-200 px-2 py-1 rounded">demo module-1</code> - Run module 1</div>
                  <div><code className="bg-gray-200 px-2 py-1 rounded">demo module-2</code> - Run module 2</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-900">System Commands:</div>
                <div className="space-y-1 text-gray-600">
                  <div><code className="bg-gray-200 px-2 py-1 rounded">status</code> - System status</div>
                  <div><code className="bg-gray-200 px-2 py-1 rounded">performance</code> - Performance metrics</div>
                  <div><code className="bg-gray-200 px-2 py-1 rounded">monitor</code> - Real-time monitoring</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-900">Utility Commands:</div>
                <div className="space-y-1 text-gray-600">
                  <div><code className="bg-gray-200 px-2 py-1 rounded">security</code> - Security dashboard</div>
                  <div><code className="bg-gray-200 px-2 py-1 rounded">users</code> - User management</div>
                  <div><code className="bg-gray-200 px-2 py-1 rounded">help</code> - Show all commands</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Overview View */
        <div className="space-y-6">
          {/* System Status Summary */}
          <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">System Status: FULLY OPERATIONAL</h2>
                <p className="text-teal-100">All 6 modules running optimally with 100% test pass rate</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-teal-100">Uptime</div>
              </div>
            </div>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {moduleInfo.map((module) => {
              const IconComponent = module.icon
              return (
                <div key={module.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <IconComponent className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Module {module.id}: {module.title}
                        </h3>
                        <p className="text-sm text-gray-600">{module.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {module.status}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-2">Test Suite:</div>
                      <div className="flex flex-wrap gap-1">
                        {module.tests.map((test, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            ✅ {test}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div>
                        <div className="text-sm text-gray-600">Performance:</div>
                        <div className="font-semibold text-teal-600">{module.performance}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Test Results:</div>
                        <div className="font-semibold text-green-600">6/6 PASSED</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Technical Details */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Implementation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Frontend Technologies:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Next.js 14 with TypeScript</li>
                  <li>• React Hooks for state management</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• Lucide React for icons</li>
                  <li>• Custom terminal emulator component</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Backend Integration:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Node.js/Express API gateway</li>
                  <li>• WebSocket real-time connections</li>
                  <li>• Prisma ORM with PostgreSQL</li>
                  <li>• Redis for caching and sessions</li>
                  <li>• Cloudinary for file management</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Security Features:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• JWT-based authentication</li>
                  <li>• Multi-factor authentication (MFA)</li>
                  <li>• Rate limiting and DDoS protection</li>
                  <li>• Input validation and sanitization</li>
                  <li>• Audit logging and monitoring</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Performance Optimizations:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Code splitting and lazy loading</li>
                  <li>• Image optimization and CDN</li>
                  <li>• Database query optimization</li>
                  <li>• Connection pooling</li>
                  <li>• Real-time WebSocket connections</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentWrapper>
  )
}