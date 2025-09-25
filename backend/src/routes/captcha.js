import express from 'express';
import crypto from 'crypto';
// import { createCanvas } from 'canvas'; // 暂时禁用canvas

const router = express.Router();

// 验证码会话存储（实际项目中应使用 Redis）
const captchaSessions = new Map();

// 清理过期验证码
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of captchaSessions.entries()) {
    if (now > session.expiresAt) {
      captchaSessions.delete(token);
    }
  }
}, 60000); // 每分钟清理一次

/**
 * GET /api/captcha
 * 生成验证码
 */
router.get('/', (req, res) => {
  try {
    const length = 4;
    
    // 生成随机字符串
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // 生成令牌
    const token = crypto.randomBytes(32).toString('hex');
    
    // 保存验证码会话
    captchaSessions.set(token, {
      text: text.toUpperCase(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟过期
      attempts: 0,
    });
    
    // 返回结果（暂时使用文本验证码）
    res.json({
      success: true,
      data: {
        token,
        text: text, // 开发阶段显示文本
        image: `data:image/svg+xml;base64,${Buffer.from(`<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="40" fill="#f0f0f0"/><text x="60" y="25" text-anchor="middle" font-family="Arial" font-size="20" fill="#333">${text}</text></svg>`).toString('base64')}`,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate captcha',
      error: error.message,
    });
  }
});

/**
 * POST /api/captcha/verify
 * 验证验证码
 */
router.post('/verify', (req, res) => {
  try {
    const { token, value } = req.body;
    
    if (!token || !value) {
      return res.status(400).json({
        success: false,
        message: 'Token and value are required',
      });
    }
    
    const session = captchaSessions.get(token);
    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired captcha token',
      });
    }
    
    // 检查是否过期
    if (Date.now() > session.expiresAt) {
      captchaSessions.delete(token);
      return res.status(400).json({
        success: false,
        message: 'Captcha has expired',
      });
    }
    
    // 增加尝试次数
    session.attempts++;
    
    // 检查尝试次数
    if (session.attempts > 3) {
      captchaSessions.delete(token);
      return res.status(400).json({
        success: false,
        message: 'Too many attempts',
      });
    }
    
    // 验证值
    const isValid = value.toUpperCase() === session.text;
    
    if (isValid) {
      // 验证成功，删除会话
      captchaSessions.delete(token);
      res.json({
        success: true,
        message: 'Captcha verified successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid captcha value',
        attemptsLeft: 3 - session.attempts,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify captcha',
      error: error.message,
    });
  }
});

/**
 * POST /api/captcha/refresh
 * 刷新验证码（删除旧的，客户端重新请求）
 */
router.post('/refresh', (req, res) => {
  try {
    const { token } = req.body;
    
    if (token && captchaSessions.has(token)) {
      captchaSessions.delete(token);
    }
    
    res.json({
      success: true,
      message: 'Captcha session cleared',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh captcha',
      error: error.message,
    });
  }
});

export default router;