import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { systemMonitor } from './middleware/monitor.js';
import { requestLogger, securityLogger } from './middleware/requestLogger.js';
import { logger } from './utils/logger.js';

// 路由导入
import productRoutes from './routes/products.js';
import captchaRoutes from './routes/captcha.js';
import uploadRoutes from './routes/upload.js';
import watermarkRoutes from './routes/watermark.js';
import qrcodeRoutes from './routes/qrcode.js';
import healthRoutes from '../routes/health.js';

const app = express();

// 安全中间件
app.use(helmet());

// 请求日志中间件
app.use(requestLogger({
  skipPaths: ['/api/health', '/api/metrics'],
  logRequestBody: config.isDevelopment(),
  maxBodyLength: 500,
}));

// 安全日志中间件
app.use(securityLogger);

// 系统监控中间件
app.use(systemMonitor.requestMonitor());

// CORS 配置
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 最多 100 个请求
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
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
app.use('/api', healthRoutes);

// 健康检查 - 保留兼容性
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.get('nodeEnv'),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// 系统统计信息
app.get('/api/stats', (req, res) => {
  res.json(systemMonitor.getStats());
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
app.use(notFoundHandler);

// 错误处理中间件
app.use(errorHandler);

// 设置全局错误处理
setupGlobalErrorHandlers();

// 启动服务器
const PORT = config.get('port') || 3001;
const HOST = config.get('host') || 'localhost';

const server = app.listen(PORT, HOST, async () => {
  await logger.info(`Server started on http://${HOST}:${PORT}`, {
    environment: config.get('nodeEnv'),
    port: PORT,
    host: HOST,
    pid: process.pid,
  });
  
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📝 Environment: ${config.get('nodeEnv')}`);
  console.log(`🔗 API Base URL: http://${HOST}:${PORT}/api`);
  console.log(`❤️ Health Check: http://${HOST}:${PORT}/api/health`);
  
  // 输出配置信息
  config.logConfig();
});

// 优雅关闭
const gracefulShutdown = async (signal) => {
  await logger.info(`${signal} received, shutting down gracefully...`);
  
  server.close(async () => {
    await logger.info('Server closed successfully');
    process.exit(0);
  });
  
  // 强制关闭超时
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;