import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
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

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, config.upload.destination);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.UPLOAD_ALLOWED_TYPES?.split(',') || config.upload.allowedTypes;
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
  },
});

// 单文件上传
router.post('/single', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // 如果是图片，生成缩略图
    let thumbnail = null;
    if (req.file.mimetype.startsWith('image/')) {
      const thumbnailPath = path.join(
        config.upload.destination,
        `thumb-${req.file.filename}`
      );

      await sharp(req.file.path)
        .resize(150, 150, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      thumbnail = `thumb-${req.file.filename}`;
    }

    const fileInfo = {
      id: Date.now().toString(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`,
      thumbnailUrl: thumbnail ? `/uploads/${thumbnail}` : null,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.id || 'anonymous',
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: fileInfo,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message,
    });
  }
});

// 多文件上传
router.post('/multiple', optionalAuth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const fileInfos = await Promise.all(
      req.files.map(async (file) => {
        // 生成缩略图（如果是图片）
        let thumbnail = null;
        if (file.mimetype.startsWith('image/')) {
          const thumbnailPath = path.join(
            config.upload.destination,
            `thumb-${file.filename}`
          );

          await sharp(file.path)
            .resize(150, 150, {
              fit: 'cover',
              position: 'center',
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

          thumbnail = `thumb-${file.filename}`;
        }

        return {
          id: Date.now().toString() + Math.random(),
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          url: `/uploads/${file.filename}`,
          thumbnailUrl: thumbnail ? `/uploads/${thumbnail}` : null,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: req.user?.id || 'anonymous',
        };
      })
    );

    res.json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      data: fileInfos,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message,
    });
  }
});

// 图片压缩上传
router.post('/compress', optionalAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded',
      });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed',
      });
    }

    const quality = parseInt(req.body.quality) || 80;
    const maxWidth = parseInt(req.body.maxWidth) || 1920;
    const maxHeight = parseInt(req.body.maxHeight) || 1080;

    const compressedFilename = `compressed-${req.file.filename}`;
    const compressedPath = path.join(config.upload.destination, compressedFilename);

    // 压缩图片
    const compressedImage = await sharp(req.file.path)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toFile(compressedPath);

    // 删除原始文件
    await fs.unlink(req.file.path);

    const fileInfo = {
      id: Date.now().toString(),
      originalName: req.file.originalname,
      filename: compressedFilename,
      path: compressedPath,
      url: `/uploads/${compressedFilename}`,
      mimetype: 'image/jpeg',
      originalSize: req.file.size,
      compressedSize: compressedImage.size,
      compressionRatio: ((req.file.size - compressedImage.size) / req.file.size * 100).toFixed(2),
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.id || 'anonymous',
    };

    res.json({
      success: true,
      message: 'Image compressed and uploaded successfully',
      data: fileInfo,
    });
  } catch (error) {
    console.error('Compress error:', error);
    res.status(500).json({
      success: false,
      message: 'Compression failed',
      error: error.message,
    });
  }
});

// 删除文件
router.delete('/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(config.upload.destination, filename);
    const thumbnailPath = path.join(config.upload.destination, `thumb-${filename}`);

    // 删除原文件
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // 删除缩略图（如果存在）
    try {
      await fs.unlink(thumbnailPath);
    } catch (error) {
      // 忽略缩略图不存在的错误
    }

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
      error: error.message,
    });
  }
});

// 获取文件信息
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
      message: 'File not found',
    });
  }
});

export default router;