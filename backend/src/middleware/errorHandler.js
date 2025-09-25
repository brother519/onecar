import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

// 自定义错误类
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

// 认证错误
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

// 禁止访问错误
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

// 资源未找到错误
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

// 处理不同类型的错误
const handleError = (err) => {
  let status = 500;
  let message = 'Internal Server Error';
  let details = null;
  let errorCode = 'INTERNAL_ERROR';

  // 自定义应用错误
  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    errorCode = err.name.replace('Error', '').toUpperCase();
    if (err instanceof ValidationError) {
      details = err.details;
    }
  }
  // Mongoose 验证错误
  else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    errorCode = 'VALIDATION_ERROR';
    details = Object.values(err.errors).map(e => e.message);
  }
  // Mongoose 重复键错误
  else if (err.code === 11000) {
    status = 400;
    message = 'Duplicate field value';
    errorCode = 'DUPLICATE_ERROR';
    const field = Object.keys(err.keyValue)[0];
    details = `${field} already exists`;
  }
  // JWT 错误
  else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  }
  else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  }
  // 文件上传错误
  else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File too large';
    errorCode = 'FILE_TOO_LARGE';
    details = `Maximum file size is ${Math.round(err.limit / 1024 / 1024)}MB`;
  }
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    status = 400;
    message = 'Unexpected file field';
    errorCode = 'UNEXPECTED_FILE';
    details = `Unexpected field: ${err.field}`;
  }
  // 数据库连接错误
  else if (err.name === 'MongoError' || err.name === 'MongooseError') {
    status = 503;
    message = 'Database connection error';
    errorCode = 'DATABASE_ERROR';
  }
  // 语法错误
  else if (err instanceof SyntaxError) {
    status = 400;
    message = 'Invalid JSON syntax';
    errorCode = 'SYNTAX_ERROR';
  }
  // 类型错误
  else if (err instanceof TypeError) {
    status = 400;
    message = 'Type error';
    errorCode = 'TYPE_ERROR';
  }

  return { status, message, details, errorCode };
};

// 记录错误日志
const logError = async (err, req, context = {}) => {
  const errorInfo = {
    name: err.name,
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    isOperational: err.isOperational,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    requestId: req.id,
    ...context,
  };

  // 根据错误级别记录日志
  if (err.statusCode >= 500 || !err.isOperational) {
    await logger.error(`${err.name}: ${err.message}`, errorInfo);
  } else {
    await logger.warn(`${err.name}: ${err.message}`, errorInfo);
  }
};

// 发送错误响应
const sendErrorResponse = (res, status, message, details, errorCode, err) => {
  const response = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    },
  };

  // 开发环境下添加调试信息
  if (config.isDevelopment()) {
    response.error.stack = err.stack;
    response.error.name = err.name;
  }

  res.status(status).json(response);
};

// 主要错误处理中间件
export const errorHandler = async (err, req, res, next) => {
  // 记录错误日志
  await logError(err, req);

  // 处理错误
  const { status, message, details, errorCode } = handleError(err);

  // 发送响应
  sendErrorResponse(res, status, message, details, errorCode, err);
};

// 404 处理中间件
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

// 异步错误捕获包装器
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 全局未捕获异常处理
export const setupGlobalErrorHandlers = () => {
  // 未捕获的异常
  process.on('uncaughtException', async (err) => {
    await logger.error('Uncaught Exception:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    process.exit(1);
  });

  // 未处理的 Promise 拒绝
  process.on('unhandledRejection', async (reason, promise) => {
    await logger.error('Unhandled Rejection:', {
      reason: reason.toString(),
      promise: promise.toString(),
    });
    
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    process.exit(1);
  });

  // 进程终止信号
  process.on('SIGTERM', async () => {
    await logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
};