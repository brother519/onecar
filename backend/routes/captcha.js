import express from 'express';
import crypto from 'crypto';
import { createCanvas } from 'canvas';

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
    const width = 120;
    const height = 40;
    const length = 4;
    
    // 生成随机字符串
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // 生成令牌
    const token = crypto.randomBytes(32).toString('hex');
    
    // 创建画布
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制噪点
    for (let i = 0; i < width * height * 0.3; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.fillRect(
        Math.random() * width,
        Math.random() * height,
        1,
        1
      );
    }
    
    // 绘制干扰线
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }
    
    // 绘制文字
    ctx.font = '24px Arial';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = (width / text.length) * i + (width / text.length) / 2;
      const y = height / 2;
      
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.fillText(char, -12, 0);
      ctx.restore();
    }
    
    // 保存验证码会话
    captchaSessions.set(token, {
      text: text.toUpperCase(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟过期
      attempts: 0,
    });
    
    // 返回结果
    const imageBuffer = canvas.toBuffer('image/png');
    const imageBase64 = imageBuffer.toString('base64');
    
    res.json({
      success: true,
      data: {
        token,
        image: `data:image/png;base64,${imageBase64}`,
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