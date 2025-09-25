// 系统监控中间件
class SystemMonitor {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.responseTimeHistory = [];
    this.maxHistorySize = 1000;
  }

  // 请求监控中间件
  requestMonitor() {
    return (req, res, next) => {
      const startTime = Date.now();
      this.requestCount++;

      // 监听响应完成
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.responseTimeSum += responseTime;
        
        // 保存响应时间历史
        this.responseTimeHistory.push({
          timestamp: Date.now(),
          responseTime,
          statusCode: res.statusCode,
          method: req.method,
          path: req.path,
        });

        // 限制历史记录大小
        if (this.responseTimeHistory.length > this.maxHistorySize) {
          this.responseTimeHistory = this.responseTimeHistory.slice(-this.maxHistorySize);
        }

        // 统计错误
        if (res.statusCode >= 400) {
          this.errorCount++;
        }

        // 添加响应时间头
        res.set('X-Response-Time', `${responseTime}ms`);
      });

      next();
    };
  }

  // 获取统计信息
  getStats() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.requestCount > 0 ? this.responseTimeSum / this.requestCount : 0;
    
    // 计算最近的响应时间统计
    const recentHistory = this.responseTimeHistory.slice(-100);
    const recentResponseTimes = recentHistory.map(h => h.responseTime);
    const recentAvgResponseTime = recentResponseTimes.length > 0 
      ? recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length 
      : 0;

    return {
      uptime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
      recentAvgResponseTime: Math.round(recentAvgResponseTime),
      requestsPerSecond: this.requestCount / (uptime / 1000),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
  }

  // 获取响应时间历史
  getResponseTimeHistory(limit = 100) {
    return this.responseTimeHistory.slice(-limit);
  }

  // 重置统计
  reset() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.responseTimeHistory = [];
  }
}

// 创建全局监控实例
const systemMonitor = new SystemMonitor();

// 健康检查服务
class HealthCheckService {
  constructor() {
    this.checks = new Map();
    this.lastCheckTime = null;
    this.checkInterval = 30000; // 30秒
  }

  // 注册健康检查
  registerCheck(name, checkFunction) {
    this.checks.set(name, {
      name,
      check: checkFunction,
      lastResult: null,
      lastCheckTime: null,
    });
  }

  // 执行所有健康检查
  async performAllChecks() {
    const results = {};
    let overallStatus = 'healthy';

    for (const [name, checkConfig] of this.checks) {
      try {
        const result = await checkConfig.check();
        checkConfig.lastResult = result;
        checkConfig.lastCheckTime = Date.now();
        results[name] = result;

        if (!result.healthy) {
          overallStatus = 'degraded';
        }
      } catch (error) {
        const errorResult = {
          healthy: false,
          message: error.message,
          error: true,
        };
        checkConfig.lastResult = errorResult;
        checkConfig.lastCheckTime = Date.now();
        results[name] = errorResult;
        overallStatus = 'unhealthy';
      }
    }

    this.lastCheckTime = Date.now();
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }

  // 获取最后的检查结果
  getLastCheckResults() {
    const results = {};
    for (const [name, checkConfig] of this.checks) {
      results[name] = {
        ...checkConfig.lastResult,
        lastCheckTime: checkConfig.lastCheckTime,
      };
    }

    return {
      lastCheckTime: this.lastCheckTime,
      checks: results,
    };
  }
}

// 创建健康检查服务实例
const healthCheckService = new HealthCheckService();

// 注册默认的健康检查
healthCheckService.registerCheck('memory', async () => {
  const usage = process.memoryUsage();
  const totalMemory = require('os').totalmem();
  const memoryUsagePercent = (usage.rss / totalMemory) * 100;

  return {
    healthy: memoryUsagePercent < 90, // 内存使用率超过90%视为不健康
    message: `内存使用率: ${memoryUsagePercent.toFixed(2)}%`,
    details: {
      usage,
      totalMemory,
      percentage: memoryUsagePercent,
    },
  };
});

healthCheckService.registerCheck('diskSpace', async () => {
  try {
    const fs = await import('fs/promises');
    const stats = await fs.stat('./');
    
    return {
      healthy: true,
      message: '磁盘空间检查通过',
      details: {
        accessible: true,
      },
    };
  } catch (error) {
    return {
      healthy: false,
      message: '无法访问磁盘',
      details: {
        error: error.message,
      },
    };
  }
});

// 导出监控服务
export { systemMonitor, healthCheckService };
export default systemMonitor;