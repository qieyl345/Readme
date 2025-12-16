// Phase 2 Performance Optimization & Monitoring
// Performance enhancements for Rentverse Phase 2 components

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Record performance metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
    
    // Keep only last 100 values to prevent memory leaks
    const values = this.metrics.get(name)!
    if (values.length > 100) {
      values.shift()
    }
  }

  // Get average performance
  getAverage(name: string): number {
    const values = this.metrics.get(name) || []
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }

  // Monitor component render time
  monitorRender(componentName: string, renderTime: number): void {
    this.recordMetric(`${componentName}_render_time`, renderTime)
  }

  // Monitor API response times
  monitorAPI(endpoint: string, responseTime: number): void {
    this.recordMetric(`api_${endpoint}_response_time`, responseTime)
  }

  // Monitor memory usage (if available)
  startMemoryMonitoring(): void {
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory
      this.recordMetric('heap_used', memoryInfo.usedJSHeapSize)
      this.recordMetric('heap_total', memoryInfo.totalJSHeapSize)
    }
  }

  // Generate performance report
  generateReport(): Record<string, any> {
    const report: Record<string, any> = {}
    
    for (const [name, values] of this.metrics) {
      report[name] = {
        average: this.getAverage(name),
        min: Math.min(...values),
        max: Math.max(...values),
        samples: values.length
      }
    }
    
    return report
  }
}

// Component performance hooks
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance()
  const renderStart = useRef<number>(0)

  useEffect(() => {
    renderStart.current = performance.now()
    
    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current
        monitor.monitorRender(componentName, renderTime)
      }
    }
  }, [componentName, monitor])

  return {
    recordMetric: monitor.recordMetric.bind(monitor),
    generateReport: monitor.generateReport.bind(monitor)
  }
}

// Lazy loading optimization
export function useLazyComponent<T>(importFn: () => Promise<{ default: T }>) {
  const [component, setComponent] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadComponent = useCallback(async () => {
    if (component || loading) return

    setLoading(true)
    setError(null)

    try {
      const startTime = performance.now()
      const module = await importFn()
      const loadTime = performance.now() - startTime

      PerformanceMonitor.getInstance().recordMetric('lazy_component_load_time', loadTime)
      setComponent(module.default)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [component, loading, importFn])

  return { component, loading, error, loadComponent }
}

// Virtual scrolling for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5)
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + 5
  )

  const visibleItems = items.slice(startIndex, endIndex + 1)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex
  }
}

// Debounced state updates
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Memoized expensive calculations
export function useMemoizedCalculation<T, R>(
  calculate: (input: T) => R,
  dependencies: React.DependencyList,
  input: T
): R {
  return useMemo(() => calculate(input), dependencies)
}

// Component lazy loading wrapper
export function withPerformanceOptimization<T extends React.ComponentType<any>>(
  Component: T,
  componentName: string
): React.FC<React.ComponentProps<T>> {
  const OptimizedComponent = (props: React.ComponentProps<T>) => {
    const { recordMetric } = usePerformanceMonitor(componentName)

    // Record mount time
    useEffect(() => {
      const mountTime = performance.now()
      return () => {
        const unmountTime = performance.now()
        recordMetric(`${componentName}_lifecycle_time`, unmountTime - mountTime)
      }
    }, [recordMetric])

    return React.createElement(Component, props)
  }

  OptimizedComponent.displayName = `Optimized(${componentName})`
  return OptimizedComponent
}

// Chart performance optimization
export function useChartOptimization() {
  const performanceMonitor = PerformanceMonitor.getInstance()

  // Optimize chart data updates
  const optimizeChartUpdate = useCallback((chart: any, data: any[]) => {
    const startTime = performance.now()
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      chart.data.datasets.forEach((dataset: any, index: number) => {
        dataset.data = data[index] || []
      })
      
      const updateTime = performance.now() - startTime
      performanceMonitor.recordMetric('chart_update_time', updateTime)
      
      chart.update('none') // Silent update for better performance
    })
  }, [performanceMonitor])

  // Throttled real-time updates
  const createThrottledUpdater = useCallback((interval: number = 100) => {
    let lastUpdate = 0
    let timeoutId: NodeJS.Timeout

    return (updateFn: () => void) => {
      const now = Date.now()
      if (now - lastUpdate >= interval) {
        lastUpdate = now
        updateFn()
      } else {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          lastUpdate = Date.now()
          updateFn()
        }, interval - (now - lastUpdate))
      }
    }
  }, [])

  return {
    optimizeChartUpdate,
    createThrottledUpdater
  }
}

// Memory leak prevention
export function useMemoryManagement() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const subscriptionsRef = useRef<Set<() => void>>(new Set())

  useEffect(() => {
    return () => {
      // Cleanup all timeouts
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current.clear()

      // Cleanup all intervals
      intervalsRef.current.forEach(clearInterval)
      intervalsRef.current.clear()

      // Cleanup all subscriptions
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe())
      subscriptionsRef.current.clear()
    }
  }, [])

  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutsRef.current.delete(timeoutId)
      callback()
    }, delay)
    timeoutsRef.current.add(timeoutId)
    return timeoutId
  }, [])

  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const intervalId = setInterval(callback, delay)
    intervalsRef.current.add(intervalId)
    return intervalId
  }, [])

  const addSubscription = useCallback((unsubscribe: () => void) => {
    subscriptionsRef.current.add(unsubscribe)
    return () => {
      subscriptionsRef.current.delete(unsubscribe)
      unsubscribe()
    }
  }, [])

  return {
    safeSetTimeout,
    safeSetInterval,
    addSubscription
  }
}

// Network optimization
export function useNetworkOptimization() {
  const performanceMonitor = PerformanceMonitor.getInstance()

  // Intelligent caching strategy
  const getCachedData = useCallback(<T>(key: string, fetchFn: () => Promise<T>, ttl: number = 5 * 60 * 1000): Promise<T> => {
    const cached = localStorage.getItem(key)
    const timestamp = localStorage.getItem(`${key}_timestamp`)

    if (cached && timestamp && Date.now() - parseInt(timestamp) < ttl) {
      return Promise.resolve(JSON.parse(cached))
    }

    const startTime = performance.now()
    return fetchFn().then(data => {
      const fetchTime = performance.now() - startTime
      performanceMonitor.recordMetric('network_fetch_time', fetchTime)
      
      localStorage.setItem(key, JSON.stringify(data))
      localStorage.setItem(`${key}_timestamp`, Date.now().toString())
      
      return data
    })
  }, [performanceMonitor])

  // Request deduplication
  const requestCache = useRef<Map<string, Promise<any>>>(new Map())

  const deduplicateRequest = useCallback(<T>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
    if (requestCache.current.has(key)) {
      return requestCache.current.get(key)!
    }

    const promise = fetchFn().finally(() => {
      requestCache.current.delete(key)
    })

    requestCache.current.set(key, promise)
    return promise
  }, [])

  return {
    getCachedData,
    deduplicateRequest
  }
}

// Export all utilities
export default {
  PerformanceMonitor,
  usePerformanceMonitor,
  useLazyComponent,
  useVirtualScrolling,
  useDebouncedValue,
  useMemoizedCalculation,
  withPerformanceOptimization,
  useChartOptimization,
  useMemoryManagement,
  useNetworkOptimization
}