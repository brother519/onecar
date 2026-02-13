import { describe, test, expect } from 'vitest';
import { config } from '../index';

describe('配置管理器', () => {
  test('应该正确获取配置值', () => {
    expect(config.get('appTitle')).toBe('OneCar 商品管理系统');
    expect(config.get('apiBaseUrl')).toBe('http://localhost:3001/api');
    expect(config.get('enableDebug')).toBe(true);
  });

  test('应该正确判断环境', () => {
    expect(config.isDevelopment()).toBe(true);
    expect(config.isProduction()).toBe(false);
  });

  test('应该返回完整配置', () => {
    const allConfig = config.getAll();
    expect(allConfig).toHaveProperty('appTitle');
    expect(allConfig).toHaveProperty('apiBaseUrl');
    expect(allConfig).toHaveProperty('enableDebug');
  });

  test('上传配置应该正确', () => {
    expect(config.get('uploadMaxSize')).toBeGreaterThan(0);
    expect(Array.isArray(config.get('uploadAllowedTypes'))).toBe(true);
  });

  test('分页配置应该正确', () => {
    expect(config.get('defaultPageSize')).toBeGreaterThan(0);
    expect(config.get('maxPageSize')).toBeGreaterThan(config.get('defaultPageSize'));
  });
});