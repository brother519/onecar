// 错误处理中间件
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

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
  }

  // 开发环境下显示堆栈信息
  const response = {
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(status).json(response);
};