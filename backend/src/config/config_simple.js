import dotenv from 'dotenv';
import path from 'path';

// 根据环境加载对应的配置文件
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

// 加载环境配置
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config(); // 加载默认的 .env 文件作为后备

class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadConfig() {
    return {
      // 服务配置
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3001'),
      host: process.env.HOST || 'localhost',

      // JWT 配置
      jwtSecret: process.env.JWT_SECRET || 'your-default-jwt-secret',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-default-refresh-secret',

      // CORS 配置
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
      corsCredentials: process.env.CORS_CREDENTIALS === 'true',

      // 文件上传配置
      uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'),
      uploadDestination: process.env.UPLOAD_DESTINATION || './uploads',
      uploadTempDir: process.env.UPLOAD_TEMP_DIR || './uploads/temp',
      uploadAllowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png').split(','),

      // 验证码配置
      captchaSecret: process.env.CAPTCHA_SECRET || 'your-default-captcha-secret',
      captchaExpiresIn: parseInt(process.env.CAPTCHA_EXPIRES_IN || '300000'),

      // 速率限制配置
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      rateLimitSkipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',

      // 日志配置
      logLevel: process.env.LOG_LEVEL || 'info',
      logFile: process.env.LOG_FILE || 'logs/app.log',
      logMaxSize: parseInt(process.env.LOG_MAX_SIZE || '10485760'),
      logMaxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),

      // 健康检查配置
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
      healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),

      // 数据库配置
      databaseUrl: process.env.DATABASE_URL,
      dbHost: process.env.DB_HOST,
      dbPort: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
      dbName: process.env.DB_NAME,
      dbUsername: process.env.DB_USERNAME,
      dbPassword: process.env.DB_PASSWORD,
      dbPoolMin: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : undefined,
      dbPoolMax: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : undefined,
      dbSsl: process.env.DB_SSL === 'true',

      // Redis 配置
      redisHost: process.env.REDIS_HOST,
      redisPort: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
      redisPassword: process.env.REDIS_PASSWORD,
      redisDb: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : undefined,
      redisPrefix: process.env.REDIS_PREFIX,

      // 会话配置
      sessionSecret: process.env.SESSION_SECRET || 'your-default-session-secret',
      sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'),
      sessionSecure: process.env.SESSION_SECURE === 'true',

      // 安全配置
      bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'),
      csrfSecret: process.env.CSRF_SECRET || 'your-default-csrf-secret',
      helmetEnabled: process.env.HELMET_ENABLED !== 'false',
      trustProxy: process.env.TRUST_PROXY === 'true',

      // 开发配置
      enableApiDocs: process.env.ENABLE_API_DOCS === 'true',
      enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES === 'true',
      enableQueryLogging: process.env.ENABLE_QUERY_LOGGING === 'true',
    };
  }

  validateConfig() {
    const errors = [];

    // 检查必需的配置项
    if (this.config.nodeEnv === 'production') {
      if (this.config.jwtSecret === 'your-default-jwt-secret') {
        errors.push('生产环境必须设置 JWT_SECRET');
      }
      if (this.config.sessionSecret === 'your-default-session-secret') {
        errors.push('生产环境必须设置 SESSION_SECRET');
      }
    }

    if (errors.length > 0) {
      throw new Error(`配置验证失败:\n${errors.join('\n')}`);
    }
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }

  isDevelopment() {
    return this.config.nodeEnv === 'development';
  }

  isProduction() {
    return this.config.nodeEnv === 'production';
  }

  isTest() {
    return this.config.nodeEnv === 'test';
  }

  // 获取数据库连接配置
  getDatabaseConfig() {
    if (this.config.databaseUrl) {
      return { connectionString: this.config.databaseUrl };
    }

    return {
      host: this.config.dbHost,
      port: this.config.dbPort,
      database: this.config.dbName,
      username: this.config.dbUsername,
      password: this.config.dbPassword,
      pool: {
        min: this.config.dbPoolMin,
        max: this.config.dbPoolMax,
      },
      ssl: this.config.dbSsl,
    };
  }

  // 获取 Redis 连接配置
  getRedisConfig() {
    return {
      host: this.config.redisHost,
      port: this.config.redisPort,
      password: this.config.redisPassword,
      db: this.config.redisDb,
      keyPrefix: this.config.redisPrefix,
    };
  }

  // 日志配置信息（不包含敏感信息）
  logConfig() {
    if (this.isDevelopment()) {
      console.log('🔧 服务器配置信息:');
      console.log('- 环境:', this.config.nodeEnv);
      console.log('- 端口:', this.config.port);
      console.log('- 主机:', this.config.host);
      console.log('- CORS 来源:', this.config.corsOrigins);
      console.log('- 上传限制:', `${Math.round(this.config.uploadMaxSize / 1024 / 1024)}MB`);
      console.log('- 日志级别:', this.config.logLevel);
    }
  }
}

// 创建全局配置实例
export const config = new ConfigManager();
export default config;