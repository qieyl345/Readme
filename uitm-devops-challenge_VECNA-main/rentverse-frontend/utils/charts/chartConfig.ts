import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  TimeScale
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  TimeScale
)

// Chart theme configuration
export const chartTheme = {
  colors: {
    primary: '#0f766e', // teal-700
    secondary: '#0369a1', // blue-700
    success: '#059669', // emerald-600
    warning: '#d97706', // amber-600
    danger: '#dc2626', // red-600
    info: '#0ea5e9', // sky-500
    light: '#f8fafc', // slate-50
    dark: '#1e293b', // slate-800
    gray: '#64748b', // slate-500
  },
  fonts: {
    family: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'Fira Code, Monaco, Consolas, monospace',
    },
    size: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
    },
    weight: {
      normal: 'normal',
      bold: 'bold',
    },
  },
  grid: {
    color: '#e2e8f0',
    borderDash: [5, 5],
  },
}

// Default chart options
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: chartTheme.fonts.family.sans,
          size: chartTheme.fonts.size.sm,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      borderColor: '#475569',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      titleFont: {
        family: chartTheme.fonts.family.sans,
        size: chartTheme.fonts.size.sm,
        weight: chartTheme.fonts.weight.bold,
      },
      bodyFont: {
        family: chartTheme.fonts.family.sans,
        size: chartTheme.fonts.size.sm,
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: chartTheme.grid.color,
        borderDash: chartTheme.grid.borderDash,
      },
      ticks: {
        font: {
          family: chartTheme.fonts.family.sans,
          size: chartTheme.fonts.size.xs,
        },
        color: chartTheme.colors.gray,
      },
    },
    y: {
      grid: {
        color: chartTheme.grid.color,
        borderDash: chartTheme.grid.borderDash,
      },
      ticks: {
        font: {
          family: chartTheme.fonts.family.sans,
          size: chartTheme.fonts.size.xs,
        },
        color: chartTheme.colors.gray,
      },
    },
  },
}

// Performance monitoring chart configuration
export const performanceChartConfig = {
  type: 'line' as const,
  data: {
    labels: [],
    datasets: [
      {
        label: 'API Response Time',
        data: [],
        borderColor: chartTheme.colors.primary,
        backgroundColor: `${chartTheme.colors.primary}20`,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Database Query Time',
        data: [],
        borderColor: chartTheme.colors.secondary,
        backgroundColor: `${chartTheme.colors.secondary}20`,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  },
  options: {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: 'System Performance Metrics',
        font: {
          family: chartTheme.fonts.family.sans,
          size: chartTheme.fonts.size.lg,
          weight: chartTheme.fonts.weight.bold,
        },
        color: chartTheme.colors.dark,
      },
    },
    scales: {
      ...defaultChartOptions.scales,
      y: {
        ...defaultChartOptions.scales.y,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Response Time (ms)',
          font: {
            family: chartTheme.fonts.family.sans,
            size: chartTheme.fonts.size.sm,
          },
          color: chartTheme.colors.gray,
        },
      },
      x: {
        ...defaultChartOptions.scales.x,
        title: {
          display: true,
          text: 'Time',
          font: {
            family: chartTheme.fonts.family.sans,
            size: chartTheme.fonts.size.sm,
          },
          color: chartTheme.colors.gray,
        },
      },
    },
  },
}

// System resource usage chart configuration
export const resourceChartConfig = {
  type: 'bar' as const,
  data: {
    labels: ['CPU', 'Memory', 'Disk', 'Network'],
    datasets: [
      {
        label: 'Current Usage (%)',
        data: [0, 0, 0, 0],
        backgroundColor: [
          chartTheme.colors.primary,
          chartTheme.colors.secondary,
          chartTheme.colors.success,
          chartTheme.colors.warning,
        ],
        borderColor: [
          chartTheme.colors.primary,
          chartTheme.colors.secondary,
          chartTheme.colors.success,
          chartTheme.colors.warning,
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  },
  options: {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: 'System Resource Usage',
        font: {
          family: chartTheme.fonts.family.sans,
          size: chartTheme.fonts.size.lg,
          weight: chartTheme.fonts.weight.bold,
        },
        color: chartTheme.colors.dark,
      },
    },
    scales: {
      ...defaultChartOptions.scales,
      y: {
        ...defaultChartOptions.scales.y,
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Usage (%)',
          font: {
            family: chartTheme.fonts.family.sans,
            size: chartTheme.fonts.size.sm,
          },
          color: chartTheme.colors.gray,
        },
      },
    },
  },
}

// User activity chart configuration
export const userActivityChartConfig = {
  type: 'doughnut' as const,
  data: {
    labels: ['Active Users', 'New Registrations', 'Premium Users', 'Admin Users'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: [
          chartTheme.colors.primary,
          chartTheme.colors.success,
          chartTheme.colors.warning,
          chartTheme.colors.info,
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  },
  options: {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: 'User Distribution',
        font: {
          family: chartTheme.fonts.family.sans,
          size: chartTheme.fonts.size.lg,
          weight: chartTheme.fonts.weight.bold,
        },
        color: chartTheme.colors.dark,
      },
      legend: {
        ...defaultChartOptions.plugins.legend,
        position: 'bottom' as const,
      },
    },
    cutout: '60%',
  },
}

// Security metrics chart configuration
export const securityChartConfig = {
  type: 'radar' as const,
  data: {
    labels: ['Authentication', 'Authorization', 'Data Protection', 'Network Security', 'Audit Logging', 'Incident Response'],
    datasets: [
      {
        label: 'Security Score',
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: `${chartTheme.colors.danger}20`,
        borderColor: chartTheme.colors.danger,
        borderWidth: 2,
        pointBackgroundColor: chartTheme.colors.danger,
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: chartTheme.colors.danger,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  },
  options: {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: 'Security Assessment',
        font: {
          family: chartTheme.fonts.family.sans,
          size: chartTheme.fonts.size.lg,
          weight: chartTheme.fonts.weight.bold,
        },
        color: chartTheme.colors.dark,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          font: {
            family: chartTheme.fonts.family.sans,
            size: chartTheme.fonts.size.xs,
          },
          color: chartTheme.colors.gray,
        },
        grid: {
          color: chartTheme.grid.color,
        },
        pointLabels: {
          font: {
            family: chartTheme.fonts.family.sans,
            size: chartTheme.fonts.size.sm,
          },
          color: chartTheme.colors.dark,
        },
      },
    },
  },
}

// Activity timeline chart configuration
export const activityTimelineConfig = {
  type: 'line' as const,
  data: {
    labels: [],
    datasets: [
      {
        label: 'User Logins',
        data: [],
        borderColor: chartTheme.colors.primary,
        backgroundColor: `${chartTheme.colors.primary}30`,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Property Uploads',
        data: [],
        borderColor: chartTheme.colors.success,
        backgroundColor: `${chartTheme.colors.success}30`,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Bookings',
        data: [],
        borderColor: chartTheme.colors.warning,
        backgroundColor: `${chartTheme.colors.warning}30`,
        tension: 0.3,
        fill: true,
      },
    ],
  },
  options: {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: 'Activity Timeline',
        font: {
          family: chartTheme.fonts.family.sans,
          size: chartTheme.fonts.size.lg,
          weight: chartTheme.fonts.weight.bold,
        },
        color: chartTheme.colors.dark,
      },
    },
    scales: {
      ...defaultChartOptions.scales,
      y: {
        ...defaultChartOptions.scales.y,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Activity Count',
          font: {
            family: chartTheme.fonts.family.sans,
            size: chartTheme.fonts.size.sm,
          },
          color: chartTheme.colors.gray,
        },
      },
    },
  },
}

// Data processing utilities
export class ChartDataProcessor {
  static addDataPoint(
    chart: any,
    label: string,
    data: number[],
    maxDataPoints: number = 20
  ): void {
    chart.data.labels.push(label)
    
    chart.data.datasets.forEach((dataset: any, index: number) => {
      dataset.data.push(data[index] || 0)
      
      // Keep only the last maxDataPoints
      if (dataset.data.length > maxDataPoints) {
        dataset.data.shift()
      }
    })
    
    // Keep only the last maxDataPoints labels
    if (chart.data.labels.length > maxDataPoints) {
      chart.data.labels.shift()
    }
    
    chart.update('none')
  }

  static updateDataset(
    chart: any,
    datasetIndex: number,
    newData: number[]
  ): void {
    if (chart.data.datasets[datasetIndex]) {
      chart.data.datasets[datasetIndex].data = newData
      chart.update('none')
    }
  }

  static animateChart(chart: any): void {
    chart.update('active')
  }

  static resetChart(chart: any): void {
    chart.data.labels = []
    chart.data.datasets.forEach((dataset: any) => {
      dataset.data = []
    })
    chart.update('none')
  }
}

// Color utilities
export const colorUtils = {
  getStatusColor: (status: 'success' | 'warning' | 'danger' | 'info'): string => {
    switch (status) {
      case 'success':
        return chartTheme.colors.success
      case 'warning':
        return chartTheme.colors.warning
      case 'danger':
        return chartTheme.colors.danger
      case 'info':
        return chartTheme.colors.info
      default:
        return chartTheme.colors.gray
    }
  },

  getPerformanceColor: (value: number, thresholds: { good: number; warning: number }): string => {
    if (value <= thresholds.good) return chartTheme.colors.success
    if (value <= thresholds.warning) return chartTheme.colors.warning
    return chartTheme.colors.danger
  },

  getUsageColor: (percentage: number): string => {
    if (percentage < 50) return chartTheme.colors.success
    if (percentage < 80) return chartTheme.colors.warning
    return chartTheme.colors.danger
  },
}

export default chartTheme