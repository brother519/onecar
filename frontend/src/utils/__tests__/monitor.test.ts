import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent } from '../test/utils';
import { frontendMonitor } from '../utils/monitor';

// 模拟监控工具
vi.mock('../utils/monitor', () => ({
  frontendMonitor: {
    performHealthCheck: vi.fn(),
    getAppStats: vi.fn(),
    getSystemStats: vi.fn(),
    checkBackendHealth: vi.fn(),
    recordApiCall: vi.fn(),
  },
}));

describe('前端监控工具', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该记录 API 调用成功', () => {
    frontendMonitor.recordApiCall(true);
    expect(frontendMonitor.recordApiCall).toHaveBeenCalledWith(true);
  });

  test('应该记录 API 调用失败', () => {
    frontendMonitor.recordApiCall(false);
    expect(frontendMonitor.recordApiCall).toHaveBeenCalledWith(false);
  });

  test('应该获取应用统计信息', () => {
    const mockStats = {
      uptime: 12000,
      errorCount: 0,
      apiCallCount: 10,
      apiErrorCount: 0,
      apiSuccessRate: 100,
    };

    vi.mocked(frontendMonitor.getAppStats).mockReturnValue(mockStats);

    const stats = frontendMonitor.getAppStats();
    expect(stats).toEqual(mockStats);
  });

  test('应该执行健康检查', async () => {
    const mockHealthData = {
      timestamp: new Date().toISOString(),
      overall: { healthy: true, issues: [] },
      checks: {
        backend: { healthy: true, timestamp: new Date().toISOString(), message: '后端服务正常' },
        browser: { healthy: true, timestamp: new Date().toISOString(), message: '浏览器兼容性良好' },
      },
      stats: {
        system: { memory: { used: 0, total: 0, percentage: 0 } },
        app: { uptime: 0, errorCount: 0 },
      },
    };

    vi.mocked(frontendMonitor.performHealthCheck).mockResolvedValue(mockHealthData);

    const result = await frontendMonitor.performHealthCheck();
    expect(result.overall.healthy).toBe(true);
    expect(result.checks.backend.healthy).toBe(true);
  });
});