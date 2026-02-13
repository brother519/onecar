// 前端健康检查和监控服务
interface HealthStatus {
  healthy: boolean;
  timestamp: string;
  message?: string;
  details?: any;
}

interface SystemStats {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    navigation?: PerformanceNavigationTiming;
    resources?: PerformanceResourceTiming[];
  };
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

class FrontendMonitor {
  private startTime: number;
  private errorCount: number;
  private apiCallCount: number;
  private apiErrorCount: number;
  private performanceMetrics: PerformanceEntry[];

  constructor() {
    this.startTime = Date.now();
    this.errorCount = 0;
    this.apiCallCount = 0;
    this.apiErrorCount = 0;
    this.performanceMetrics = [];
    
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
  }

  // 设置错误处理
  private setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.errorCount++;
      console.error('前端错误:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.errorCount++;
      console.error('未处理的 Promise 拒绝:', event.reason);
    });
  }

  // 设置性能监控
  private setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.performanceMetrics.push(...entries);
        
        // 保持最近的 100 条记录
        if (this.performanceMetrics.length > 100) {
          this.performanceMetrics = this.performanceMetrics.slice(-100);
        }
      });

      observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
    }
  }

  // 记录 API 调用
  recordApiCall(success: boolean) {
    this.apiCallCount++;
    if (!success) {
      this.apiErrorCount++;
    }
  }

  // 获取系统统计信息
  getSystemStats(): SystemStats {
    const memory = (performance as any).memory || { used: 0, total: 0 };
    const connection = (navigator as any).connection;
    
    return {
      memory: {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
        percentage: memory.totalJSHeapSize 
          ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100 
          : 0,
      },
      performance: {
        navigation: performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming,
        resources: performance.getEntriesByType('resource').slice(-10) as PerformanceResourceTiming[],
      },
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      } : undefined,
    };
  }

  // 获取应用统计信息
  getAppStats() {
    const uptime = Date.now() - this.startTime;
    
    return {
      uptime,
      errorCount: this.errorCount,
      apiCallCount: this.apiCallCount,
      apiErrorCount: this.apiErrorCount,
      apiSuccessRate: this.apiCallCount > 0 
        ? ((this.apiCallCount - this.apiErrorCount) / this.apiCallCount) * 100 
        : 100,
      performanceEntries: this.performanceMetrics.length,
    };
  }

  // 检查后端健康状态
  async checkBackendHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          healthy: true,
          timestamp: new Date().toISOString(),
          message: '后端服务正常',
          details: data,
        };
      } else {
        return {
          healthy: false,
          timestamp: new Date().toISOString(),
          message: `后端服务异常 (${response.status})`,
        };
      }
    } catch (error) {
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        message: '无法连接到后端服务',
        details: { error: error.message },
      };
    }
  }

  // 检查浏览器兼容性
  checkBrowserCompatibility(): HealthStatus {
    const requiredFeatures = [
      'fetch',
      'Promise',
      'localStorage',
      'sessionStorage',
      'addEventListener',
    ];

    const missingFeatures = requiredFeatures.filter(feature => !(feature in window));

    return {
      healthy: missingFeatures.length === 0,
      timestamp: new Date().toISOString(),
      message: missingFeatures.length === 0 
        ? '浏览器兼容性良好' 
        : `缺少必需功能: ${missingFeatures.join(', ')}`,
      details: {
        userAgent: navigator.userAgent,
        missingFeatures,
        supportedFeatures: requiredFeatures.filter(feature => feature in window),
      },
    };
  }

  // 执行完整的健康检查
  async performHealthCheck() {
    const [backendHealth, browserHealth] = await Promise.allSettled([
      this.checkBackendHealth(),
      Promise.resolve(this.checkBrowserCompatibility()),
    ]);

    const systemStats = this.getSystemStats();
    const appStats = this.getAppStats();

    const results = {
      timestamp: new Date().toISOString(),
      overall: {
        healthy: true,
        issues: [],
      },
      checks: {
        backend: backendHealth.status === 'fulfilled' ? backendHealth.value : {
          healthy: false,
          timestamp: new Date().toISOString(),
          message: '后端健康检查失败',
          details: { error: backendHealth.reason },
        },
        browser: browserHealth.status === 'fulfilled' ? browserHealth.value : {
          healthy: false,
          timestamp: new Date().toISOString(),
          message: '浏览器兼容性检查失败',
        },
      },
      stats: {
        system: systemStats,
        app: appStats,
      },
    };

    // 计算总体健康状态
    if (!results.checks.backend.healthy) {
      results.overall.healthy = false;
      results.overall.issues.push('后端服务不可用');
    }

    if (!results.checks.browser.healthy) {
      results.overall.healthy = false;
      results.overall.issues.push('浏览器兼容性问题');
    }

    // 检查错误率
    if (appStats.apiErrorCount > 0 && appStats.apiSuccessRate < 80) {
      results.overall.healthy = false;
      results.overall.issues.push('API 错误率过高');
    }

    // 检查内存使用
    if (systemStats.memory.percentage > 90) {
      results.overall.healthy = false;
      results.overall.issues.push('内存使用率过高');
    }

    return results;
  }

  // 重置统计信息
  reset() {
    this.startTime = Date.now();
    this.errorCount = 0;
    this.apiCallCount = 0;
    this.apiErrorCount = 0;
    this.performanceMetrics = [];
  }
}

// 创建全局监控实例
export const frontendMonitor = new FrontendMonitor();

// 导出类型
export type { HealthStatus, SystemStats };
export default frontendMonitor;