import { testApiEndpoint, expectApiResponse } from '../utils.js';

describe('Health Routes', () => {
  describe('GET /api/health', () => {
    test('应该返回基础健康状态', async () => {
      const response = await testApiEndpoint.get('/api/health');
      
      expectApiResponse(response, ['status', 'timestamp', 'uptime', 'version']);
      expect(response.body.status).toBe('healthy');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('GET /api/health/detailed', () => {
    test('应该返回详细健康状态', async () => {
      const response = await testApiEndpoint.get('/api/health/detailed');
      
      expectApiResponse(response, ['status', 'timestamp', 'checks', 'details']);
      expect(response.body.checks).toHaveProperty('server');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('redis');
      expect(response.body.checks).toHaveProperty('fileSystem');
    });
  });

  describe('GET /api/ready', () => {
    test('应该返回就绪状态', async () => {
      const response = await testApiEndpoint.get('/api/ready');
      
      expectApiResponse(response, ['ready', 'timestamp', 'checks']);
      expect(response.body.ready).toBe(true);
    });
  });

  describe('GET /api/live', () => {
    test('应该返回存活状态', async () => {
      const response = await testApiEndpoint.get('/api/live');
      
      expectApiResponse(response, ['alive', 'timestamp', 'pid']);
      expect(response.body.alive).toBe(true);
      expect(typeof response.body.pid).toBe('number');
    });
  });

  describe('GET /api/info', () => {
    test('应该返回系统信息', async () => {
      const response = await testApiEndpoint.get('/api/info');
      
      expectApiResponse(response, ['app', 'system', 'timestamp']);
      expect(response.body.app).toHaveProperty('name');
      expect(response.body.app).toHaveProperty('version');
      expect(response.body.app).toHaveProperty('environment');
      expect(response.body.system).toHaveProperty('uptime');
      expect(response.body.system).toHaveProperty('memoryUsage');
    });
  });

  describe('GET /api/metrics', () => {
    test('应该返回性能指标', async () => {
      const response = await testApiEndpoint.get('/api/metrics');
      
      expectApiResponse(response, ['timestamp', 'uptime', 'memory', 'cpu', 'system']);
      expect(response.body.memory).toHaveProperty('unit');
      expect(response.body.cpu).toHaveProperty('unit');
      expect(response.body.system).toHaveProperty('loadAverage');
    });
  });
});