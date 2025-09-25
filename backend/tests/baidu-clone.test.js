const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const http = require('http');

const API_BASE_URL = 'http://localhost:3001';

// 简单的fetch替代函数
function simpleFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

describe('百度首页抓取与仿写功能测试', () => {
  let taskId;

  beforeAll(async () => {
    console.log('开始测试百度首页抓取与仿写功能...');
  });

  afterAll(async () => {
    console.log('测试完成');
  });

  describe('页面抓取功能', () => {
    it('应该能够获取任务列表', async () => {
      const response = await simpleFetch(`${API_BASE_URL}/api/fetch/tasks`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('页面克隆功能', () => {
    it('应该能够生成克隆页面 (使用现有完成的任务)', async () => {
      // 使用一个已知完成的任务ID进行测试
      const testTaskId = 'd75f476a-2ba0-44ad-bf05-501a7fe32105';
      
      const response = await simpleFetch(`${API_BASE_URL}/api/clone/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: testTaskId,
          config: {
            format: 'react',
            fidelity: 'high',
            componentization: 'partial'
          }
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.generatedCode).toBeDefined();
      expect(data.data.generatedCode.format).toBe('react');
      expect(Array.isArray(data.data.generatedCode.components)).toBe(true);
    }, 15000);

    it('应该能够生成预览页面', async () => {
      const response = await simpleFetch(`${API_BASE_URL}/api/clone/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageData: {
            title: '百度首页克隆预览测试',
            description: '这是一个测试预览页面'
          }
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.previewUrl).toBeDefined();
      expect(data.data.previewUrl).toMatch(/^\/api\/preview\//);
    });
  });

  describe('验证码功能', () => {
    it('应该能够生成验证码', async () => {
      const response = await simpleFetch(`${API_BASE_URL}/api/captcha`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.image).toBeDefined();
      expect(data.data.text).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该拒绝非百度域名', async () => {
      const response = await simpleFetch(`${API_BASE_URL}/api/fetch/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://www.google.com',
          options: {}
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toMatch(/只允许抓取百度首页/);
    });
  });
});