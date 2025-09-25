// 请求日志中间件
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip, headers } = req;

  // 记录请求开始
  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${ip}`);

  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    console.log(
      `[${new Date().toISOString()}] ${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`
    );
  });

  next();
};

// 性能监控中间件
export const performanceMonitor = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // 转换为毫秒

    if (duration > 1000) { // 超过1秒的请求记录警告
      console.warn(
        `[SLOW REQUEST] ${req.method} ${req.url} - ${duration.toFixed(2)}ms`
      );
    }
  });

  next();
};

// API版本中间件
export const apiVersion = (version) => {
  return (req, res, next) => {
    req.apiVersion = version;
    res.setHeader('API-Version', version);
    next();
  };
};

// 请求ID中间件
export const requestId = (req, res, next) => {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};