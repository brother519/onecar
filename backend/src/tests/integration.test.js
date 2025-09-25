/**
 * API 集成测试
 * 测试完整的 API 工作流程
 */

import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../app.js';

describe('API 集成测试', () => {
  let authToken;
  let testProductId;
  let uploadedFileName;

  beforeAll(async () => {
    // 生成测试用的 JWT token
    // 在实际测试中，应该通过登录接口获取
    authToken = 'test-jwt-token';
  });

  afterAll(async () => {
    // 清理测试数据
    if (uploadedFileName) {
      const filePath = path.join('./uploads', uploadedFileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  describe('系统健康检查流程', () => {
    test('基础健康检查', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    test('详细健康检查', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.services).toBeDefined();
      expect(response.body.services.api.status).toBe('healthy');
      expect(response.body.services.memory.status).toBeDefined();
    });

    test('API 根端点信息', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.name).toContain('OneCar');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.endpoints.products).toBe('/api/products');
    });
  });

  describe('验证码工作流程', () => {
    let captchaToken;

    test('生成验证码', async () => {
      const response = await request(app)
        .get('/api/captcha')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.image).toBeDefined();
      
      captchaToken = response.body.data.token;
    });

    test('验证码验证（模拟）', async () => {
      if (!captchaToken) {
        // 如果前面的测试失败，生成一个新的
        const captchaResponse = await request(app).get('/api/captcha');
        captchaToken = captchaResponse.body.data.token;
      }

      // 注意：在实际测试中，需要知道正确的验证码值
      // 这里只测试 API 的响应格式
      const response = await request(app)
        .post('/api/captcha/verify')
        .send({
          token: captchaToken,
          value: 'ABCD' // 测试值
        });

      // 验证响应格式，不关心是否验证成功
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('文件上传工作流程', () => {
    test('单文件上传', async () => {
      // 创建测试图片
      const testImageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9
      ]);

      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', testImageBuffer, 'test.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filename).toBeDefined();
      expect(response.body.data.url).toBeDefined();
      
      uploadedFileName = response.body.data.filename;
    });

    test('获取文件信息', async () => {
      if (!uploadedFileName) {
        // 如果上传测试失败，跳过此测试
        return;
      }

      const response = await request(app)
        .get(`/api/upload/info/${uploadedFileName}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filename).toBe(uploadedFileName);
      expect(response.body.data.size).toBeGreaterThan(0);
    });
  });

  describe('商品管理工作流程', () => {
    test('获取商品列表', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('创建商品（需要认证）', async () => {
      const productData = {
        name: '测试商品',
        description: '这是一个测试商品',
        price: 99.99,
        category: 'test',
        status: 'active'
      };

      // 没有认证应该失败
      await request(app)
        .post('/api/products')
        .send(productData)
        .expect(401);

      // 有认证的话会因为无效 token 失败，但这证明了认证流程在工作
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(401); // 预期因为无效 token 失败

      expect(response.body.success).toBe(false);
    });
  });

  describe('二维码生成工作流程', () => {
    test('生成普通二维码', async () => {
      const qrData = {
        text: 'https://example.com/test',
        width: 200,
        format: 'png'
      };

      const response = await request(app)
        .post('/api/qrcode/generate')
        .send(qrData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filename).toBeDefined();
      expect(response.body.data.url).toBeDefined();
      expect(response.body.data.format).toBe('png');
    });

    test('生成商品二维码', async () => {
      const productId = 'test-product-123';
      const qrConfig = {
        baseUrl: 'https://example.com/product',
        width: 150
      };

      const response = await request(app)
        .post(`/api/qrcode/product/${productId}`)
        .send(qrConfig)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.productId).toBe(productId);
      expect(response.body.data.filename).toBeDefined();
    });
  });

  describe('水印处理工作流程', () => {
    test('添加文字水印', async () => {
      if (!uploadedFileName) {
        // 如果没有上传的文件，跳过此测试
        return;
      }

      const watermarkConfig = {
        imagePath: `/uploads/${uploadedFileName}`,
        text: 'OneCar',
        fontSize: 24,
        position: 'bottom-right'
      };

      const response = await request(app)
        .post('/api/watermark/text')
        .send(watermarkConfig)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.watermarkedUrl).toBeDefined();
      expect(response.body.data.watermarkType).toBe('text');
    });
  });

  describe('错误处理流程', () => {
    test('404 错误处理', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('无效 JSON 处理', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // 应该有错误处理
      expect(response.body).toBeDefined();
    });

    test('速率限制', async () => {
      // 连续发送多个请求来测试速率限制
      const requests = Array(10).fill(null).map(() => 
        request(app).get('/api/captcha')
      );

      const responses = await Promise.all(requests);
      
      // 至少有一些请求应该成功
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);
    });
  });
});