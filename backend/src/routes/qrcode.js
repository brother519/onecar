import express from 'express';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/index.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// 确保上传目录存在
const ensureUploadDir = async () => {
  try {
    await fs.access(config.upload.destination);
  } catch {
    await fs.mkdir(config.upload.destination, { recursive: true });
  }
};

// 二维码默认配置
const defaultQRConfig = {
  width: 200,
  margin: 1,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  errorCorrectionLevel: 'M',
  type: 'png',
  quality: 0.92
};

// 生成二维码
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    const {
      text,
      width = defaultQRConfig.width,
      margin = defaultQRConfig.margin,
      darkColor = defaultQRConfig.color.dark,
      lightColor = defaultQRConfig.color.light,
      errorCorrectionLevel = defaultQRConfig.errorCorrectionLevel,
      format = 'png',
    } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text content is required for QR code generation',
      });
    }

    await ensureUploadDir();

    const qrConfig = {
      width: parseInt(width),
      margin: parseInt(margin),
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel,
    };

    let qrCodeData;
    let filename;
    let filePath;

    if (format === 'svg') {
      // 生成 SVG 格式
      qrCodeData = await QRCode.toString(text, {
        ...qrConfig,
        type: 'svg',
      });
      
      filename = `qrcode-${Date.now()}.svg`;
      filePath = path.join(config.upload.destination, filename);
      await fs.writeFile(filePath, qrCodeData);
    } else {
      // 生成 PNG 格式
      filename = `qrcode-${Date.now()}.png`;
      filePath = path.join(config.upload.destination, filename);
      
      await QRCode.toFile(filePath, text, qrConfig);
    }

    const fileStats = await fs.stat(filePath);

    const qrInfo = {
      id: Date.now().toString(),
      text,
      filename,
      path: filePath,
      url: `/uploads/${filename}`,
      format,
      config: qrConfig,
      size: fileStats.size,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || 'anonymous',
    };

    res.json({
      success: true,
      message: 'QR code generated successfully',
      data: qrInfo,
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message,
    });
  }
});

// 生成商品二维码
router.post('/product/:productId', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      baseUrl = 'https://onecar.com/product',
      includeParams = {},
      width = defaultQRConfig.width,
      format = 'png',
    } = req.body;

    // 构建商品链接
    const productUrl = new URL(`${baseUrl}/${productId}`);
    
    // 添加查询参数
    Object.entries(includeParams).forEach(([key, value]) => {
      productUrl.searchParams.set(key, value);
    });

    // 添加追踪参数
    productUrl.searchParams.set('source', 'qrcode');
    productUrl.searchParams.set('generated_at', Date.now().toString());

    const qrText = productUrl.toString();

    await ensureUploadDir();

    const qrConfig = {
      width: parseInt(width),
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    };

    let filename;
    let filePath;

    if (format === 'svg') {
      const qrCodeData = await QRCode.toString(qrText, {
        ...qrConfig,
        type: 'svg',
      });
      
      filename = `product-qr-${productId}-${Date.now()}.svg`;
      filePath = path.join(config.upload.destination, filename);
      await fs.writeFile(filePath, qrCodeData);
    } else {
      filename = `product-qr-${productId}-${Date.now()}.png`;
      filePath = path.join(config.upload.destination, filename);
      
      await QRCode.toFile(filePath, qrText, qrConfig);
    }

    const fileStats = await fs.stat(filePath);

    const qrInfo = {
      id: Date.now().toString(),
      productId,
      url: qrText,
      filename,
      path: filePath,
      qrUrl: `/uploads/${filename}`,
      format,
      config: qrConfig,
      size: fileStats.size,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || 'anonymous',
    };

    res.json({
      success: true,
      message: 'Product QR code generated successfully',
      data: qrInfo,
    });
  } catch (error) {
    console.error('Product QR code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate product QR code',
      error: error.message,
    });
  }
});

// 批量生成二维码
router.post('/batch', optionalAuth, async (req, res) => {
  try {
    const {
      items, // [{ text, filename?, config? }]
      globalConfig = {},
    } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required for batch generation',
      });
    }

    await ensureUploadDir();

    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (!item.text) {
          throw new Error('Text is required for each item');
        }

        const config = { ...defaultQRConfig, ...globalConfig, ...item.config };
        const filename = item.filename || `batch-qr-${i + 1}-${Date.now()}.png`;
        const filePath = path.join(config.upload.destination, filename);

        await QRCode.toFile(filePath, item.text, {
          width: config.width,
          margin: config.margin,
          color: {
            dark: config.darkColor || config.color.dark,
            light: config.lightColor || config.color.light,
          },
          errorCorrectionLevel: config.errorCorrectionLevel,
        });

        const fileStats = await fs.stat(filePath);

        results.push({
          index: i,
          text: item.text,
          filename,
          url: `/uploads/${filename}`,
          size: fileStats.size,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        errors.push({
          index: i,
          text: item.text,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Batch QR generation completed. ${results.length} successful, ${errors.length} failed`,
      data: {
        results,
        errors,
        summary: {
          total: items.length,
          successful: results.length,
          failed: errors.length,
        },
      },
    });
  } catch (error) {
    console.error('Batch QR generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch QR generation failed',
      error: error.message,
    });
  }
});

// 生成 vCard 二维码
router.post('/vcard', optionalAuth, async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      company,
      title,
      url,
      address,
      width = defaultQRConfig.width,
      format = 'png',
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required for vCard generation',
      });
    }

    // 生成 vCard 格式
    let vCardText = 'BEGIN:VCARD\nVERSION:3.0\n';
    vCardText += `FN:${name}\n`;
    
    if (phone) vCardText += `TEL:${phone}\n`;
    if (email) vCardText += `EMAIL:${email}\n`;
    if (company) vCardText += `ORG:${company}\n`;
    if (title) vCardText += `TITLE:${title}\n`;
    if (url) vCardText += `URL:${url}\n`;
    if (address) vCardText += `ADR:;;${address};;;;\n`;
    
    vCardText += 'END:VCARD';

    await ensureUploadDir();

    const qrConfig = {
      width: parseInt(width),
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    };

    let filename;
    let filePath;

    if (format === 'svg') {
      const qrCodeData = await QRCode.toString(vCardText, {
        ...qrConfig,
        type: 'svg',
      });
      
      filename = `vcard-qr-${Date.now()}.svg`;
      filePath = path.join(config.upload.destination, filename);
      await fs.writeFile(filePath, qrCodeData);
    } else {
      filename = `vcard-qr-${Date.now()}.png`;
      filePath = path.join(config.upload.destination, filename);
      
      await QRCode.toFile(filePath, vCardText, qrConfig);
    }

    const fileStats = await fs.stat(filePath);

    const qrInfo = {
      id: Date.now().toString(),
      type: 'vcard',
      vcard: vCardText,
      contactInfo: { name, phone, email, company, title, url, address },
      filename,
      path: filePath,
      url: `/uploads/${filename}`,
      format,
      config: qrConfig,
      size: fileStats.size,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || 'anonymous',
    };

    res.json({
      success: true,
      message: 'vCard QR code generated successfully',
      data: qrInfo,
    });
  } catch (error) {
    console.error('vCard QR generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate vCard QR code',
      error: error.message,
    });
  }
});

// 删除二维码文件
router.delete('/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(config.upload.destination, filename);

    await fs.unlink(filePath);

    res.json({
      success: true,
      message: 'QR code file deleted successfully',
    });
  } catch (error) {
    console.error('Delete QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete QR code file',
      error: error.message,
    });
  }
});

// 获取二维码信息
router.get('/info/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(config.upload.destination, filename);
    
    const stats = await fs.stat(filePath);
    
    res.json({
      success: true,
      data: {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        url: `/uploads/${filename}`,
      },
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'QR code file not found',
    });
  }
});

export default router;