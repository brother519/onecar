// 错误处理中间件
export const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // 默认错误响应
  let status = 500;
  let message = 'Internal Server Error';
  let details = null;

  // 根据错误类型设置响应
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = 'Not Found';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File too large';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    status = 400;
    message = 'Unexpected file field';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON format';
  } else if (err.code === 'ENOENT') {
    status = 404;
    message = 'File not found';
  } else if (err.code === 'EACCES') {
    status = 403;
    message = 'Permission denied';
  }

  // 构建错误响应
  const response = {
    success: false,
    message,
    error: err.name || 'UnknownError',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err.message 
    }),
  };

  // 在生产环境中不暴露敏感信息
  if (process.env.NODE_ENV === 'production' && status === 500) {
    response.message = 'Something went wrong';
    delete response.stack;
    delete response.originalError;
  }

  res.status(status).json(response);
};

// 异步错误包装器
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 自定义错误类
export class AppError extends Error {
  constructor(message, statusCode, name = 'AppError') {
    super(message);
    this.statusCode = statusCode;
    this.name = name;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 特定错误类
export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'ValidationError');
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UnauthorizedError');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'ForbiddenError');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404, 'NotFoundError');
  }
}