import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// 请求日志中间件
export const requestLogger = (options = {}) => {
  const {
    logLevel = 'info',
    skipPaths = ['/health', '/favicon.ico'],
    skipSuccessfulRequests = false,
    logRequestBody = false,
    logResponseBody = false,
    maxBodyLength = 1000,
  } = options;

  return (req, res, next) => {
    // 为每个请求生成唯一 ID
    req.id = uuidv4();
    
    // 跳过某些路径
    if (skipPaths.some(path => req.path.includes(path))) {
      return next();
    }

    const startTime = Date.now();
    
    // 记录请求开始
    const requestData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      userId: req.user?.id,
      sessionId: req.session?.id,
    };

    // 记录请求体（如果启用）
    if (logRequestBody && req.body) {
      const bodyStr = JSON.stringify(req.body);
      requestData.requestBody = bodyStr.length > maxBodyLength 
        ? bodyStr.substring(0, maxBodyLength) + '...[truncated]'
        : bodyStr;
    }

    // 记录请求开始日志
    logger.debug('Request started', requestData);

    // 劫持响应方法以记录响应
    const originalSend = res.send;
    const originalJson = res.json;

    let responseBody = null;

    res.send = function(body) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.json = function(obj) {
      responseBody = obj;
      return originalJson.call(this, obj);
    };

    // 监听响应完成
    res.on('finish', async () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // 确定日志级别
      let level = logLevel;
      if (res.statusCode >= 500) {
        level = 'error';
      } else if (res.statusCode >= 400) {
        level = 'warn';
      } else if (res.statusCode >= 300) {
        level = 'info';
      }

      // 跳过成功请求（如果配置）
      if (skipSuccessfulRequests && res.statusCode < 400) {
        return;
      }

      const responseData = {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        responseSize: res.get('Content-Length'),
      };

      // 记录响应体（如果启用）
      if (logResponseBody && responseBody) {
        const bodyStr = typeof responseBody === 'string' 
          ? responseBody 
          : JSON.stringify(responseBody);
        responseData.responseBody = bodyStr.length > maxBodyLength
          ? bodyStr.substring(0, maxBodyLength) + '...[truncated]'
          : bodyStr;
      }

      // 记录性能警告
      if (responseTime > 1000) {
        responseData.performanceWarning = 'Slow request';
      }

      const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`;
      
      await logger.log(level, message, responseData);
      
      // 记录性能日志
      if (responseTime > 500) {
        await logger.logPerformance(
          `${req.method} ${req.originalUrl}`,
          responseTime,
          { statusCode: res.statusCode }
        );
      }
    });

    // 监听请求错误
    res.on('error', async (error) => {
      await logger.error('Response error', {
        requestId: req.id,
        error: error.message,
        stack: error.stack,
      });
    });

    next();
  };
};

// 安全事件日志中间件
export const securityLogger = (req, res, next) => {
  // 检测可疑活动
  const suspiciousPatterns = [
    /\.\.\//,  // 路径遍历
    /<script/i, // XSS
    /union.*select/i, // SQL注入
    /javascript:/i, // JavaScript URL
  ];

  const url = req.originalUrl;
  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(url) || pattern.test(body) || pattern.test(query)) {
      logger.logSecurityEvent('Suspicious request pattern detected', {
        pattern: pattern.toString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
      });
    }
  });

  // 检测暴力破解
  if (req.path.includes('/login') || req.path.includes('/auth')) {
    const attempts = req.session?.loginAttempts || 0;
    if (attempts > 5) {
      logger.logSecurityEvent('Potential brute force attack', {
        ip: req.ip,
        attempts,
        userAgent: req.get('User-Agent'),
      });
    }
  }

  next();
};

// 调试中间件
export const debugLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('\n--- Request Debug Info ---');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Query:', req.query);
    console.log('Params:', req.params);
    console.log('IP:', req.ip);
    console.log('User:', req.user);
    console.log('Session:', req.session?.id);
    console.log('--- End Debug Info ---\n');
  }
  next();
};

export default requestLogger;