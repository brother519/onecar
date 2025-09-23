/**
 * 性能监控和优化工具
 */

interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  interactionDelay: number;
}

class PerformanceTracker {
  private entries: PerformanceEntry[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];

  /**
   * 开始性能测量
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }

    this.entries.push({
      name,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      metadata,
    });
  }

  /**
   * 结束性能测量
   */
  end(name: string): number {
    const endTime = Date.now();
    
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    const entry = this.entries.find(
      (e) => e.name === name && e.endTime === 0
    );

    if (entry) {
      entry.endTime = endTime;
      entry.duration = endTime - entry.startTime;
      return entry.duration;
    }

    return 0;
  }

  /**
   * 获取性能指标
   */
  getMetrics(name?: string): PerformanceEntry[] {
    if (name) {
      return this.entries.filter((e) => e.name === name);
    }
    return [...this.entries];
  }

  /**
   * 清除性能记录
   */
  clear(): void {
    this.entries = [];
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  /**
   * 获取平均执行时间
   */
  getAverageDuration(name: string): number {
    const entries = this.getMetrics(name);
    if (entries.length === 0) return 0;

    const total = entries.reduce((sum, entry) => sum + entry.duration, 0);
    return total / entries.length;
  }

  /**
   * 监控 FPS
   */
  startFpsMonitoring(): void {
    const updateFps = (timestamp: number) => {
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;
        this.fpsHistory.push(fps);
        
        // 保持最近 60 帧的记录
        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }
      }
      
      this.lastFrameTime = timestamp;
      this.frameCount++;
      
      requestAnimationFrame(updateFps);
    };
    
    requestAnimationFrame(updateFps);
  }

  /**
   * 获取当前 FPS
   */
  getCurrentFps(): number {
    if (this.fpsHistory.length === 0) return 0;
    
    const sum = this.fpsHistory.reduce((total, fps) => total + fps, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  /**
   * 监控长任务
   */
  observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // 长于 50ms 的任务
            console.warn('Long task detected:', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', observer);
      } catch (e) {
        console.warn('Long task observation not supported');
      }
    }
  }

  /**
   * 监控用户交互延迟
   */
  observeInteractionDelay(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const delay = entry.processingStart - entry.startTime;
            if (delay > 100) { // 延迟超过 100ms
              console.warn('Interaction delay detected:', {
                type: entry.name,
                delay: delay,
                duration: entry.duration,
              });
            }
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['event'] });
        this.observers.set('interaction', observer);
      } catch (e) {
        console.warn('Interaction timing observation not supported');
      }
    }
  }

  /**
   * 停止所有监控
   */
  stopObserving(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  /**
   * 生成性能报告
   */
  generateReport(): PerformanceMetrics & { entries: PerformanceEntry[] } {
    return {
      fps: this.getCurrentFps(),
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.getAverageDuration('render'),
      interactionDelay: this.getAverageDuration('interaction'),
      entries: this.getMetrics(),
    };
  }
}

// 性能优化工具函数

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 批量更新状态
 */
export function batchUpdates<T>(
  updates: (() => void)[],
  callback?: () => void
): void {
  // 在 React 18 中，setState 自动批处理
  // 对于更老的版本，可以使用 unstable_batchedUpdates
  updates.forEach(update => update());
  
  if (callback) {
    // 使用 setTimeout 确保更新完成后执行回调
    setTimeout(callback, 0);
  }
}

/**
 * 懒加载图片
 */
export function lazyLoadImage(
  src: string,
  placeholder?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    
    img.src = src;
  });
}

/**
 * 虚拟化计算
 */
export function calculateVirtualization(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  bufferSize: number = 5
): { startIndex: number; endIndex: number; totalHeight: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(
    totalItems - 1,
    startIndex + visibleCount + bufferSize * 2
  );
  const totalHeight = totalItems * itemHeight;

  return { startIndex, endIndex, totalHeight };
}

/**
 * 内存使用监控
 */
export function monitorMemoryUsage(): {
  used: number;
  total: number;
  limit: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / (1024 * 1024)), // MB
      total: Math.round(memory.totalJSHeapSize / (1024 * 1024)), // MB
      limit: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)), // MB
    };
  }
  return null;
}

/**
 * 检测设备性能等级
 */
export function detectDevicePerformance(): 'high' | 'medium' | 'low' {
  const navigatorInfo = navigator as any;
  
  // 检查硬件并发数
  const cores = navigatorInfo.hardwareConcurrency || 1;
  
  // 检查内存
  const memory = navigatorInfo.deviceMemory || 1;
  
  // 检查连接速度
  const connection = navigatorInfo.connection;
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g'
  );

  if (cores >= 4 && memory >= 4 && !isSlowConnection) {
    return 'high';
  } else if (cores >= 2 && memory >= 2) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * 优化配置基于设备性能
 */
export function getOptimizedConfig(performance: 'high' | 'medium' | 'low') {
  const configs = {
    high: {
      virtualScrollBufferSize: 10,
      maxRenderItems: 100,
      debounceDelay: 100,
      enableAnimations: true,
      imageQuality: 'high',
    },
    medium: {
      virtualScrollBufferSize: 5,
      maxRenderItems: 50,
      debounceDelay: 150,
      enableAnimations: true,
      imageQuality: 'medium',
    },
    low: {
      virtualScrollBufferSize: 3,
      maxRenderItems: 20,
      debounceDelay: 300,
      enableAnimations: false,
      imageQuality: 'low',
    },
  };

  return configs[performance];
}

// 创建全局性能追踪器实例
export const performanceTracker = new PerformanceTracker();

// React hooks for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const start = () => performanceTracker.start(componentName);
  const end = () => performanceTracker.end(componentName);
  
  return { start, end };
}

// 性能监控装饰器
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  func: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    performanceTracker.start(name);
    try {
      const result = func(...args);
      
      // 如果是 Promise，等待完成后结束监控
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          performanceTracker.end(name);
        });
      }
      
      performanceTracker.end(name);
      return result;
    } catch (error) {
      performanceTracker.end(name);
      throw error;
    }
  }) as T;
}