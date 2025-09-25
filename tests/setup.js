// 测试环境设置
import { config } from '../src/config/index.js';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.LOG_LEVEL = 'error'; // 减少测试时的日志输出

// 模拟控制台方法以减少测试输出
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 设置全局测试超时
jest.setTimeout(10000);

// 在每个测试之前清理模拟
beforeEach(() => {
  jest.clearAllMocks();
});

// 测试完成后的清理
afterAll(async () => {
  // 这里可以添加测试完成后的清理逻辑
  // 例如关闭数据库连接等
});