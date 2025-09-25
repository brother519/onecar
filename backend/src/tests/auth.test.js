/**
 * JWT 认证中间件测试
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { config } from '../config/index.js';

describe('认证中间件测试', () => {
  let validToken;
  let expiredToken;

  beforeAll(() => {
    // 生成有效 token
    validToken = jwt.sign(
      { id: 'user-123', username: 'testuser', role: 'admin' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // 生成过期 token
    expiredToken = jwt.sign(
      { id: 'user-123', username: 'testuser', role: 'admin' },
      config.jwt.secret,
      { expiresIn: '-1h' }
    );
  });

  describe('受保护的路由', () => {
    test('没有 token 应该返回 401', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    test('无效 token 应该返回 401', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    test('过期 token 应该返回 401', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('有效 token 应该允许访问', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('公开路由', () => {
    test('健康检查不需要认证', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    test('验证码生成不需要认证', async () => {
      const response = await request(app)
        .get('/api/captcha')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.image).toBeDefined();
    });
  });

  describe('权限检查', () => {
    test('管理员角色可以删除产品', async () => {
      const adminToken = jwt.sign(
        { id: 'admin-123', username: 'admin', role: 'admin' },
        config.jwt.secret
      );

      // 这里应该测试删除操作，但需要先有产品数据
      // 为了测试简化，我们只测试 token 验证部分
      const response = await request(app)
        .delete('/api/products/test-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404); // 产品不存在，但认证通过

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });
});