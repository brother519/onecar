import fs from 'fs/promises';
import path from 'path';
import config from '../config/config_simple.js';

// 日志级别
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// 日志颜色（用于控制台输出）
const LOG_COLORS = {
  error: '\\x1b[31m', // 红色
  warn: '\\x1b[33m',  // 黄色
  info: '\\x1b[36m',  // 青色
  debug: '\\x1b[90m', // 灰色
  reset: '\\x1b[0m',  // 重置
};

class Logger {
  constructor() {
    this.logLevel = config.get('logLevel') || 'info';
    this.logFile = config.get('logFile') || 'logs/app.log';
    this.maxSize = config.get('logMaxSize') || 10485760; // 10MB
    this.maxFiles = config.get('logMaxFiles') || 5;
    
    this.ensureLogDirectory();
  }

  // 确保日志目录存在
  async ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
  }

  // 检查日志级别
  shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.logLevel];
  }

  // 格式化日志消息
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
    };

    // 控制台格式
    const consoleMessage = `${LOG_COLORS[level]}[${timestamp}] ${level.toUpperCase()}: ${message}${LOG_COLORS.reset}`;
    
    // 文件格式（JSON）
    const fileMessage = JSON.stringify(logData);

    return { consoleMessage, fileMessage, logData };
  }

  // 写入日志文件
  async writeToFile(message) {
    try {
      await this.ensureLogDirectory();
      await this.rotateLogsIfNeeded();
      await fs.appendFile(this.logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  // 日志轮转
  async rotateLogsIfNeeded() {
    try {
      const stats = await fs.stat(this.logFile);
      if (stats.size >= this.maxSize) {
        await this.rotateLogs();
      }
    } catch {
      // 文件不存在，无需轮转
    }
  }

  // 执行日志轮转
  async rotateLogs() {
    const logDir = path.dirname(this.logFile);
    const logName = path.basename(this.logFile, path.extname(this.logFile));
    const logExt = path.extname(this.logFile);

    // 删除最旧的日志文件
    const oldestLog = path.join(logDir, `${logName}.${this.maxFiles - 1}${logExt}`);
    try {
      await fs.unlink(oldestLog);
    } catch {
      // 文件不存在，忽略错误
    }

    // 移动现有日志文件
    for (let i = this.maxFiles - 2; i >= 0; i--) {
      const currentLog = i === 0 
        ? this.logFile 
        : path.join(logDir, `${logName}.${i}${logExt}`);
      const nextLog = path.join(logDir, `${logName}.${i + 1}${logExt}`);

      try {
        await fs.rename(currentLog, nextLog);
      } catch {
        // 文件不存在，继续
      }
    }
  }

  // 基础日志方法
  async log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const { consoleMessage, fileMessage, logData } = this.formatMessage(level, message, meta);

    // 输出到控制台
    if (config.isDevelopment()) {
      console.log(consoleMessage);
    }

    // 写入文件
    await this.writeToFile(fileMessage);

    return logData;
  }

  // 便捷方法
  async error(message, meta = {}) {
    return this.log('error', message, meta);
  }

  async warn(message, meta = {}) {
    return this.log('warn', message, meta);
  }

  async info(message, meta = {}) {
    return this.log('info', message, meta);
  }

  async debug(message, meta = {}) {
    return this.log('debug', message, meta);
  }

  // HTTP 请求日志
  async logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    const message = `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`;

    return this.log(level, message, logData);
  }

  // 错误日志
  async logError(error, context = {}) {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
    };

    return this.error(`Error: ${error.message}`, errorData);
  }

  // 安全事件日志
  async logSecurityEvent(event, details = {}) {
    const securityData = {
      event,
      severity: 'high',
      ...details,
    };

    return this.warn(`Security Event: ${event}`, securityData);
  }

  // 性能日志
  async logPerformance(operation, duration, details = {}) {
    const perfData = {
      operation,
      duration,
      unit: 'ms',
      ...details,
    };

    const level = duration > 1000 ? 'warn' : 'info';
    const message = `Performance: ${operation} took ${duration}ms`;

    return this.log(level, message, perfData);
  }

  // 获取日志统计
  async getLogStats() {
    try {
      const stats = await fs.stat(this.logFile);
      return {
        size: stats.size,
        modified: stats.mtime,
        maxSize: this.maxSize,
        maxFiles: this.maxFiles,
        currentLevel: this.logLevel,
      };
    } catch {
      return {
        size: 0,
        modified: null,
        maxSize: this.maxSize,
        maxFiles: this.maxFiles,
        currentLevel: this.logLevel,
      };
    }
  }

  // 获取最近的日志
  async getRecentLogs(lines = 100) {
    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const logLines = content.trim().split('\n');
      const recentLines = logLines.slice(-lines);
      
      return recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line, level: 'UNKNOWN', timestamp: null };
        }
      });
    } catch {
      return [];
    }
  }

  // 清理旧日志
  async cleanupLogs(daysOld = 30) {
    const logDir = path.dirname(this.logFile);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const files = await fs.readdir(logDir);
      const logFiles = files.filter(file => file.includes('.log'));

      for (const file of logFiles) {
        const filePath = path.join(logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old log file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
    }
  }
}

// 创建全局日志实例
export const logger = new Logger();
export default logger;