import express from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/index.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// 文字水印配置
const textWatermarkDefaults = {
  text: 'OneCar',
  fontSize: 24,
  color: 'rgba(255, 255, 255, 0.8)',
  position: 'bottom-right',
  margin: 20,
};

// 图片水印配置
const imageWatermarkDefaults = {
  opacity: 0.8,
  position: 'bottom-right',
  margin: 20,
  scale: 0.2,
};

// 位置映射
const positionMap = {
  'top-left': { gravity: 'northwest' },
  'top-center': { gravity: 'north' },
  'top-right': { gravity: 'northeast' },
  'center-left': { gravity: 'west' },
  'center': { gravity: 'center' },
  'center-right': { gravity: 'east' },
  'bottom-left': { gravity: 'southwest' },
  'bottom-center': { gravity: 'south' },
  'bottom-right': { gravity: 'southeast' },
};

// 添加文字水印
router.post('/text', optionalAuth, async (req, res) => {
  try {
    const {
      imagePath,
      text = textWatermarkDefaults.text,
      fontSize = textWatermarkDefaults.fontSize,
      color = textWatermarkDefaults.color,
      position = textWatermarkDefaults.position,
      margin = textWatermarkDefaults.margin,
    } = req.body;

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: 'Image path is required',
      });
    }

    const inputPath = path.join(config.upload.destination, path.basename(imagePath));
    const outputFilename = `watermarked-${Date.now()}-${path.basename(imagePath)}`;
    const outputPath = path.join(config.upload.destination, outputFilename);

    // 检查输入文件是否存在
    try {
      await fs.access(inputPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Input image not found',
      });
    }

    // 获取图片信息
    const { width, height } = await sharp(inputPath).metadata();

    // 创建文字水印 SVG
    const svg = `
      <svg width="${width}" height="${height}">
        <text
          x="${position.includes('right') ? width - margin : position.includes('center') ? width / 2 : margin}"
          y="${position.includes('bottom') ? height - margin : position.includes('center') ? height / 2 : margin + fontSize}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          fill="${color}"
          text-anchor="${position.includes('right') ? 'end' : position.includes('center') ? 'middle' : 'start'}"
          dominant-baseline="${position.includes('bottom') ? 'text-bottom' : position.includes('center') ? 'middle' : 'text-top'}"
        >${text}</text>
      </svg>
    `;

    // 应用水印
    await sharp(inputPath)
      .composite([{
        input: Buffer.from(svg),
        gravity: positionMap[position]?.gravity || 'southeast',
      }])
      .toFile(outputPath);

    const fileInfo = {
      originalPath: imagePath,
      watermarkedPath: outputPath,
      watermarkedUrl: `/uploads/${outputFilename}`,
      watermarkType: 'text',
      watermarkConfig: {
        text,
        fontSize,
        color,
        position,
        margin,
      },
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || 'anonymous',
    };

    res.json({
      success: true,
      message: 'Text watermark applied successfully',
      data: fileInfo,
    });
  } catch (error) {
    console.error('Text watermark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply text watermark',
      error: error.message,
    });
  }
});

// 添加图片水印
router.post('/image', optionalAuth, async (req, res) => {
  try {
    const {
      imagePath,
      watermarkPath,
      opacity = imageWatermarkDefaults.opacity,
      position = imageWatermarkDefaults.position,
      margin = imageWatermarkDefaults.margin,
      scale = imageWatermarkDefaults.scale,
    } = req.body;

    if (!imagePath || !watermarkPath) {
      return res.status(400).json({
        success: false,
        message: 'Image path and watermark path are required',
      });
    }

    const inputPath = path.join(config.upload.destination, path.basename(imagePath));
    const watermarkInputPath = path.join(config.upload.destination, path.basename(watermarkPath));
    const outputFilename = `watermarked-${Date.now()}-${path.basename(imagePath)}`;
    const outputPath = path.join(config.upload.destination, outputFilename);

    // 检查输入文件是否存在
    try {
      await fs.access(inputPath);
      await fs.access(watermarkInputPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Input image or watermark not found',
      });
    }

    // 获取主图片信息
    const { width, height } = await sharp(inputPath).metadata();

    // 处理水印图片
    const watermarkWidth = Math.round(width * scale);
    const watermarkHeight = Math.round(height * scale);

    const watermarkBuffer = await sharp(watermarkInputPath)
      .resize(watermarkWidth, watermarkHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    // 计算水印位置
    let left, top;
    switch (position) {
      case 'top-left':
        left = margin;
        top = margin;
        break;
      case 'top-center':
        left = Math.round((width - watermarkWidth) / 2);
        top = margin;
        break;
      case 'top-right':
        left = width - watermarkWidth - margin;
        top = margin;
        break;
      case 'center-left':
        left = margin;
        top = Math.round((height - watermarkHeight) / 2);
        break;
      case 'center':
        left = Math.round((width - watermarkWidth) / 2);
        top = Math.round((height - watermarkHeight) / 2);
        break;
      case 'center-right':
        left = width - watermarkWidth - margin;
        top = Math.round((height - watermarkHeight) / 2);
        break;
      case 'bottom-left':
        left = margin;
        top = height - watermarkHeight - margin;
        break;
      case 'bottom-center':
        left = Math.round((width - watermarkWidth) / 2);
        top = height - watermarkHeight - margin;
        break;
      case 'bottom-right':
      default:
        left = width - watermarkWidth - margin;
        top = height - watermarkHeight - margin;
        break;
    }

    // 应用水印
    await sharp(inputPath)
      .composite([{
        input: watermarkBuffer,
        left: Math.max(0, left),
        top: Math.max(0, top),
        blend: 'over',
      }])
      .toFile(outputPath);

    const fileInfo = {
      originalPath: imagePath,
      watermarkedPath: outputPath,
      watermarkedUrl: `/uploads/${outputFilename}`,
      watermarkType: 'image',
      watermarkConfig: {
        watermarkPath,
        opacity,
        position,
        margin,
        scale,
      },
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || 'anonymous',
    };

    res.json({
      success: true,
      message: 'Image watermark applied successfully',
      data: fileInfo,
    });
  } catch (error) {
    console.error('Image watermark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply image watermark',
      error: error.message,
    });
  }
});

// 批量添加水印
router.post('/batch', optionalAuth, async (req, res) => {
  try {
    const {
      imagePaths,
      watermarkType = 'text',
      watermarkConfig = {},
    } = req.body;

    if (!imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({
        success: false,
        message: 'Image paths array is required',
      });
    }

    const results = [];
    const errors = [];

    for (const imagePath of imagePaths) {
      try {
        let result;
        if (watermarkType === 'text') {
          // 调用文字水印逻辑
          const textConfig = { ...textWatermarkDefaults, ...watermarkConfig };
          // 这里应该重用上面的文字水印逻辑
          result = await applyTextWatermark(imagePath, textConfig, req.user);
        } else if (watermarkType === 'image') {
          // 调用图片水印逻辑
          const imageConfig = { ...imageWatermarkDefaults, ...watermarkConfig };
          result = await applyImageWatermark(imagePath, imageConfig, req.user);
        }
        results.push(result);
      } catch (error) {
        errors.push({
          imagePath,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Batch watermark completed. ${results.length} successful, ${errors.length} failed`,
      data: {
        results,
        errors,
      },
    });
  } catch (error) {
    console.error('Batch watermark error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch watermark failed',
      error: error.message,
    });
  }
});

// 删除水印文件
router.delete('/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(config.upload.destination, filename);

    await fs.unlink(filePath);

    res.json({
      success: true,
      message: 'Watermarked file deleted successfully',
    });
  } catch (error) {
    console.error('Delete watermark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete watermarked file',
      error: error.message,
    });
  }
});

// 辅助函数：应用文字水印
async function applyTextWatermark(imagePath, config, user) {
  const inputPath = path.join(config.upload.destination, path.basename(imagePath));
  const outputFilename = `watermarked-${Date.now()}-${path.basename(imagePath)}`;
  const outputPath = path.join(config.upload.destination, outputFilename);

  const { width, height } = await sharp(inputPath).metadata();

  const svg = `
    <svg width="${width}" height="${height}">
      <text
        x="${config.position.includes('right') ? width - config.margin : config.position.includes('center') ? width / 2 : config.margin}"
        y="${config.position.includes('bottom') ? height - config.margin : config.position.includes('center') ? height / 2 : config.margin + config.fontSize}"
        font-family="Arial, sans-serif"
        font-size="${config.fontSize}"
        fill="${config.color}"
        text-anchor="${config.position.includes('right') ? 'end' : config.position.includes('center') ? 'middle' : 'start'}"
        dominant-baseline="${config.position.includes('bottom') ? 'text-bottom' : config.position.includes('center') ? 'middle' : 'text-top'}"
      >${config.text}</text>
    </svg>
  `;

  await sharp(inputPath)
    .composite([{
      input: Buffer.from(svg),
      gravity: positionMap[config.position]?.gravity || 'southeast',
    }])
    .toFile(outputPath);

  return {
    originalPath: imagePath,
    watermarkedPath: outputPath,
    watermarkedUrl: `/uploads/${outputFilename}`,
    watermarkType: 'text',
    watermarkConfig: config,
    createdAt: new Date().toISOString(),
    createdBy: user?.id || 'anonymous',
  };
}

// 辅助函数：应用图片水印
async function applyImageWatermark(imagePath, config, user) {
  // 类似实现...
  // 这里简化处理，实际应该重用上面的逻辑
  throw new Error('Image watermark batch processing not yet implemented');
}

export default router;