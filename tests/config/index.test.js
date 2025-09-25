import { config } from '../../src/config/index.js';

describe('配置管理器', () => {
  test('应该正确加载配置', () => {
    expect(config.get('nodeEnv')).toBe('test');
    expect(config.get('port')).toBe(3001);
    expect(config.get('jwtSecret')).toBe('test-jwt-secret');
  });

  test('应该正确判断环境', () => {
    expect(config.isTest()).toBe(true);
    expect(config.isDevelopment()).toBe(false);
    expect(config.isProduction()).toBe(false);
  });

  test('应该返回完整配置', () => {
    const allConfig = config.getAll();
    expect(allConfig).toHaveProperty('nodeEnv');
    expect(allConfig).toHaveProperty('port');
    expect(allConfig).toHaveProperty('jwtSecret');
  });

  test('应该正确获取数据库配置', () => {
    const dbConfig = config.getDatabaseConfig();
    expect(dbConfig).toBeDefined();
  });

  test('应该正确获取 Redis 配置', () => {
    const redisConfig = config.getRedisConfig();
    expect(redisConfig).toBeDefined();
  });

  test('CORS 配置应该是数组', () => {
    const corsOrigins = config.get('corsOrigins');
    expect(Array.isArray(corsOrigins)).toBe(true);
  });

  test('上传配置应该有效', () => {
    expect(config.get('uploadMaxSize')).toBeGreaterThan(0);
    expect(config.get('uploadDestination')).toBeTruthy();
    expect(Array.isArray(config.get('uploadAllowedTypes'))).toBe(true);
  });
});