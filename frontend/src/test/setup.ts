import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 expect 匹配器
expect.extend(matchers);

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// 模拟 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 模拟 ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟 IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟 Canvas API
const mockCanvasContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn().mockReturnValue({
    data: new Array(4),
  }),
  putImageData: vi.fn(),
  createImageData: vi.fn().mockReturnValue({}),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCanvasContext);

// 模拟环境变量
vi.mock('@/config', () => ({
  config: {
    get: vi.fn().mockImplementation((key: string) => {
      const mockConfig: { [key: string]: any } = {
        apiBaseUrl: 'http://localhost:3001/api',
        apiTimeout: 10000,
        appTitle: 'OneCar 商品管理系统',
        enableDebug: true,
        uploadMaxSize: 10485760,
      };
      return mockConfig[key];
    }),
    isDevelopment: vi.fn().mockReturnValue(true),
    isProduction: vi.fn().mockReturnValue(false),
  },
}));

// 全局测试超时
vi.setConfig({
  testTimeout: 10000,
});