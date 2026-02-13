import express from 'express';

const router = express.Router();

// 基础健康检查
router.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memoryUsage: process.memoryUsage(),
    pid: process.pid,
  };

  res.status(200).json(healthData);
});

// 详细健康检查
router.get('/health/detailed', async (req, res) => {
  const checks = {
    server: true,
    database: false,
    redis: false,
    fileSystem: false,
  };

  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks,
    details: {},
  };

  try {
    // 检查文件系统
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      await fs.access('./uploads');
      checks.fileSystem = true;
      results.details.fileSystem = { status: 'ok', message: '上传目录可访问' };
    } catch (error) {
      results.details.fileSystem = { status: 'error', message: '上传目录不可访问' };
    }

    // 检查数据库连接（如果配置了数据库）
    // 这里可以添加数据库连接检查逻辑
    results.details.database = { status: 'skip', message: '数据库未配置' };

    // 检查 Redis 连接（如果配置了 Redis）
    // 这里可以添加 Redis 连接检查逻辑
    results.details.redis = { status: 'skip', message: 'Redis 未配置' };

    // 计算总体状态
    const hasErrors = Object.values(checks).some(check => check === false);
    if (hasErrors) {
      results.status = 'degraded';
    }

    res.status(results.status === 'healthy' ? 200 : 503).json(results);
  } catch (error) {
    results.status = 'unhealthy';
    results.details.error = error.message;
    res.status(503).json(results);
  }
});

// 就绪检查（Readiness probe）
router.get('/ready', (req, res) => {
  // 检查应用是否准备好接收请求
  const readyData = {
    ready: true,
    timestamp: new Date().toISOString(),
    checks: {
      server: true,
      dependencies: true,
    },
  };

  res.status(200).json(readyData);
});

// 存活检查（Liveness probe）
router.get('/live', (req, res) => {
  // 简单的存活检查
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    pid: process.pid,
  });
});

// 系统信息
router.get('/info', (req, res) => {
  const systemInfo = {
    app: {
      name: 'OneCar Backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    system: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      pid: process.pid,
      ppid: process.ppid,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(systemInfo);
});

// 性能指标
router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      ...process.memoryUsage(),
      unit: 'bytes',
    },
    cpu: {
      ...process.cpuUsage(),
      unit: 'microseconds',
    },
    system: {
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
      totalMemory: require('os').totalmem(),
      freeMemory: require('os').freemem(),
    },
  };

  res.json(metrics);
});

export default router;