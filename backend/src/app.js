import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import os from 'os';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { requestLogger } from './middleware/logger.js';

// 路由导入
import productRoutes from '../routes/products.js';
import captchaRoutes from '../routes/captcha.js';
import uploadRoutes from './routes/upload.js';
import watermarkRoutes from './routes/watermark.js';
import qrcodeRoutes from './routes/qrcode.js';

const app = express();

// 安全中间件
app.use(helmet());

// 请求压缩
app.use(compression());

// 请求日志（仅在开发环境或启用时）
if (config.enableRequestLogging) {
  app.use(requestLogger);
}

// CORS 配置
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 速率限制配置
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 更严格的验证码限制
const captchaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 5, // 每分钟最多 5 次验证码请求
  skipSuccessfulRequests: true,
});
app.use('/api/captcha', captchaLimiter);

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// API 路由
app.use('/api/products', productRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/watermark', watermarkRoutes);
app.use('/api/qrcode', qrcodeRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
    },
    cpu: {
      loadAverage: process.platform !== 'win32' ? os.loadavg() : 'N/A',
      cores: os.cpus().length,
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    }
  };
  
  res.json(healthCheck);
});

// 详细健康检查
app.get('/api/health/detailed', (req, res) => {
  const startTime = process.hrtime.bigint();
  
  const detailed = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: {
        status: 'healthy',
        responseTime: Number(process.hrtime.bigint() - startTime) / 1000000, // 转换为毫秒
      },
      uploads: {
        status: fs.existsSync(config.upload.destination) ? 'healthy' : 'unhealthy',
        directory: config.upload.destination,
      },
      memory: {
        status: process.memoryUsage().heapUsed < 512 * 1024 * 1024 ? 'healthy' : 'warning',
        usage: process.memoryUsage(),
      },
    },
    dependencies: {
      express: process.env.npm_package_dependencies_express || 'unknown',
      node: process.version,
    }
  };
  
  res.json(detailed);
});

// 数据库连接检查（如果使用数据库）
app.get('/api/health/db', (req, res) => {
  // 这里可以添加数据库连接检查逻辑
  res.json({
    status: 'ok',
    database: 'not configured',
    timestamp: new Date().toISOString(),
  });
});

// API 文档根路径
app.get('/api', (req, res) => {
  res.json({
    name: 'OneCar Product Management API',
    version: '1.0.0',
    description: '商品后台管理系统 API 服务',
    endpoints: {
      products: '/api/products',
      captcha: '/api/captcha',
      upload: '/api/upload',
      watermark: '/api/watermark',
      qrcode: '/api/qrcode',
      health: '/api/health',
    },
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = config.port || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.env}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

export default app;