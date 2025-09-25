// 前端调试工具类
interface DebugInfo {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  source?: string;
}

class FrontendDebugger {
  private enabled: boolean;
  private logs: DebugInfo[] = [];
  private maxLogs: number = 1000;
  private startTime: number;

  constructor() {
    this.enabled = import.meta.env.VITE_ENABLE_DEBUG === 'true';
    this.startTime = Date.now();
    
    if (this.enabled) {
      this.setupConsoleInterception();
      this.setupErrorHandling();
      this.setupPerformanceMonitoring();
      this.addDebugToWindow();
    }
  }

  // 设置控制台拦截
  private setupConsoleInterception() {
    const originalMethods = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    Object.keys(originalMethods).forEach(method => {
      (console as any)[method] = (...args: any[]) => {
        this.addLog(method as any, args.join(' '), args);
        (originalMethods as any)[method](...args);
      };
    });
  }

  // 设置错误处理
  private setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.addLog('error', `Global Error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.addLog('error', `Unhandled Promise Rejection: ${event.reason}`, {
        reason: event.reason,
        promise: event.promise,
      });
    });
  }

  // 设置性能监控
  private setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 100) { // 只记录耗时超过100ms的操作
            this.addLog('warn', `Performance: ${entry.name} took ${entry.duration}ms`, {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              entryType: entry.entryType,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
    }
  }

  // 将调试工具添加到全局对象
  private addDebugToWindow() {
    (window as any).__ONECAR_DEBUG__ = {
      getLogs: () => this.getLogs(),
      clearLogs: () => this.clearLogs(),
      exportLogs: () => this.exportLogs(),
      getSystemInfo: () => this.getSystemInfo(),
      measurePerformance: (name: string, fn: () => any) => this.measurePerformance(name, fn),
      enabled: this.enabled,
    };
  }

  // 添加日志
  addLog(level: DebugInfo['level'], message: string, data?: any, source = 'app') {
    if (!this.enabled) return;

    const logEntry: DebugInfo = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      source,
    };

    this.logs.push(logEntry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  // 调试方法
  debug(message: string, data?: any) {
    this.addLog('debug', message, data);
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data);
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data);
  }

  // 获取日志
  getLogs(level?: DebugInfo['level'], limit = 100) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    return filteredLogs.slice(-limit);
  }

  // 清除日志
  clearLogs() {
    this.logs = [];
  }

  // 导出日志
  exportLogs() {
    const logsData = {
      exportTime: new Date().toISOString(),
      appInfo: this.getSystemInfo(),
      logs: this.logs,
    };

    const blob = new Blob([JSON.stringify(logsData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onecar-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 获取系统信息
  getSystemInfo() {
    const nav = navigator;
    const screen = window.screen;
    const performance = window.performance;

    return {
      // 浏览器信息
      userAgent: nav.userAgent,
      platform: nav.platform,
      language: nav.language,
      languages: nav.languages,
      cookieEnabled: nav.cookieEnabled,
      onLine: nav.onLine,

      // 屏幕信息
      screenWidth: screen.width,
      screenHeight: screen.height,
      screenColorDepth: screen.colorDepth,
      devicePixelRatio: window.devicePixelRatio,

      // 视口信息
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,

      // 性能信息
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null,

      // 网络信息
      connection: (nav as any).connection ? {
        effectiveType: (nav as any).connection.effectiveType,
        downlink: (nav as any).connection.downlink,
        rtt: (nav as any).connection.rtt,
      } : null,

      // 应用信息
      appStartTime: this.startTime,
      appUptime: Date.now() - this.startTime,
      currentUrl: window.location.href,
      referrer: document.referrer,
    };
  }

  // 性能测量
  measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    this.addLog('info', `Performance: ${name} took ${duration.toFixed(2)}ms`, {
      operation: name,
      duration,
      start,
      end,
    });

    return result;
  }

  // API 调用追踪
  trackApiCall(url: string, method: string, duration: number, status: number, error?: any) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    
    this.addLog(level, `API: ${method} ${url} - ${status} (${duration}ms)`, {
      url,
      method,
      status,
      duration,
      error: error?.message,
      timestamp: Date.now(),
    });
  }

  // 组件渲染追踪
  trackComponentRender(componentName: string, props?: any, renderTime?: number) {
    this.addLog('debug', `Component: ${componentName} rendered`, {
      component: componentName,
      props,
      renderTime,
      timestamp: Date.now(),
    });
  }

  // 用户交互追踪
  trackUserInteraction(event: string, element?: string, data?: any) {
    this.addLog('info', `User Interaction: ${event}`, {
      event,
      element,
      data,
      timestamp: Date.now(),
      url: window.location.pathname,
    });
  }

  // 路由变化追踪
  trackRouteChange(from: string, to: string) {
    this.addLog('info', `Route Change: ${from} -> ${to}`, {
      from,
      to,
      timestamp: Date.now(),
    });
  }
}

// 创建全局调试器实例
export const debugger = new FrontendDebugger();

// 导出类型
export type { DebugInfo };
export default debugger;