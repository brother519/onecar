import request from 'supertest';
import app from '../src/app.js';

// 创建测试请求实例
export const createTestRequest = () => request(app);

// 创建模拟文件
export const createMockFile = (filename = 'test.jpg', mimetype = 'image/jpeg') => {
  return {
    originalname: filename,
    mimetype,
    size: 1024,
    buffer: Buffer.from('fake image data'),
    fieldname: 'file',
  };
};

// 生成测试 JWT Token
export const generateTestToken = (payload = { userId: 1, role: 'admin' }) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret', {
    expiresIn: '1h',
  });
};

// 创建授权头
export const createAuthHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

// 模拟数据库查询结果
export const mockDbQuery = (result) => {
  return jest.fn().mockResolvedValue(result);
};

// 模拟数据库错误
export const mockDbError = (error) => {
  return jest.fn().mockRejectedValue(error);
};

// 等待异步操作
export const waitForAsync = (ms = 0) => 
  new Promise(resolve => setTimeout(resolve, ms));

// 创建测试产品数据
export const createTestProduct = (overrides = {}) => ({
  id: 1,
  name: '测试商品',
  description: '这是一个测试商品',
  price: 99.99,
  category: '测试分类',
  imageUrl: '/uploads/test.jpg',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// 创建测试用户数据
export const createTestUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// API 测试辅助函数
export const testApiEndpoint = {
  // 测试 GET 请求
  get: async (endpoint, expectedStatus = 200, headers = {}) => {
    const response = await createTestRequest()
      .get(endpoint)
      .set(headers)
      .expect(expectedStatus);
    return response;
  },

  // 测试 POST 请求
  post: async (endpoint, data = {}, expectedStatus = 200, headers = {}) => {
    const response = await createTestRequest()
      .post(endpoint)
      .send(data)
      .set(headers)
      .expect(expectedStatus);
    return response;
  },

  // 测试 PUT 请求
  put: async (endpoint, data = {}, expectedStatus = 200, headers = {}) => {
    const response = await createTestRequest()
      .put(endpoint)
      .send(data)
      .set(headers)
      .expect(expectedStatus);
    return response;
  },

  // 测试 DELETE 请求
  delete: async (endpoint, expectedStatus = 200, headers = {}) => {
    const response = await createTestRequest()
      .delete(endpoint)
      .set(headers)
      .expect(expectedStatus);
    return response;
  },
};

// 验证响应结构
export const expectApiResponse = (response, expectedKeys = []) => {
  expect(response.body).toBeDefined();
  expectedKeys.forEach(key => {
    expect(response.body).toHaveProperty(key);
  });
};

// 验证错误响应
export const expectErrorResponse = (response, message = null) => {
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');
  if (message) {
    expect(response.body.message).toContain(message);
  }
};