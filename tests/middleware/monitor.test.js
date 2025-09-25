import { systemMonitor } from '../../src/middleware/monitor.js';

describe('系统监控中间件', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/test',
    };
    res = {
      statusCode: 200,
      set: jest.fn(),
      on: jest.fn(),
    };
    next = jest.fn();

    // 重置监控统计
    systemMonitor.reset();
  });

  describe('请求监控', () => {
    test('应该记录请求统计', () => {
      const middleware = systemMonitor.requestMonitor();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      
      const stats = systemMonitor.getStats();
      expect(stats.requestCount).toBe(1);
    });

    test('应该监听响应完成事件', () => {
      const middleware = systemMonitor.requestMonitor();
      middleware(req, res, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });
  });

  describe('统计信息', () => {
    test('应该返回正确的统计格式', () => {
      const stats = systemMonitor.getStats();

      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('errorCount');
      expect(stats).toHaveProperty('errorRate');
      expect(stats).toHaveProperty('avgResponseTime');
      expect(stats).toHaveProperty('requestsPerSecond');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('cpuUsage');
    });

    test('应该正确计算错误率', () => {
      // 模拟一些请求
      systemMonitor.requestCount = 10;
      systemMonitor.errorCount = 2;

      const stats = systemMonitor.getStats();
      expect(stats.errorRate).toBe(20);
    });

    test('应该正确计算平均响应时间', () => {
      systemMonitor.requestCount = 2;
      systemMonitor.responseTimeSum = 200;

      const stats = systemMonitor.getStats();
      expect(stats.avgResponseTime).toBe(100);
    });
  });

  describe('响应时间历史', () => {
    test('应该返回响应时间历史', () => {
      const history = systemMonitor.getResponseTimeHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    test('应该限制历史记录数量', () => {
      const history = systemMonitor.getResponseTimeHistory(50);
      expect(history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('重置功能', () => {
    test('应该重置所有统计信息', () => {
      // 设置一些数据
      systemMonitor.requestCount = 10;
      systemMonitor.errorCount = 2;

      systemMonitor.reset();

      const stats = systemMonitor.getStats();
      expect(stats.requestCount).toBe(0);
      expect(stats.errorCount).toBe(0);
    });
  });
});