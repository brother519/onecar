import express from 'express';
import CloneService from '../services/cloneService.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();
const cloneService = new CloneService();

/**
 * 生成仿写页面
 * POST /api/clone/generate
 */
router.post('/generate', [
  body('taskId')
    .isUUID()
    .withMessage('请提供有效的任务ID'),
  body('config')
    .optional()
    .isObject()
    .withMessage('配置必须是一个对象')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { taskId, config = {} } = req.body;

    const result = await cloneService.generateClonePage(taskId, config);

    res.json({
      success: true,
      message: '仿写页面生成成功',
      data: result
    });

  } catch (error) {
    console.error('生成仿写页面失败:', error);
    res.status(500).json({
      success: false,
      message: '生成仿写页面失败',
      error: error.message
    });
  }
});

/**
 * 预览仿写页面
 * POST /api/clone/preview
 */
router.post('/preview', [
  body('pageData')
    .notEmpty()
    .withMessage('请提供页面数据')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { pageData } = req.body;

    const previewUrl = await cloneService.generatePreview(pageData);

    res.json({
      success: true,
      message: '预览生成成功',
      data: { previewUrl }
    });

  } catch (error) {
    console.error('生成预览失败:', error);
    res.status(500).json({
      success: false,
      message: '生成预览失败',
      error: error.message
    });
  }
});

/**
 * 获取组件代码
 * GET /api/clone/component/:taskId
 */
router.get('/component/:taskId', [
  param('taskId')
    .isUUID()
    .withMessage('请提供有效的任务ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { taskId } = req.params;

    const componentCode = await cloneService.getComponentCode(taskId);

    if (!componentCode) {
      return res.status(404).json({
        success: false,
        message: '组件代码不存在'
      });
    }

    res.json({
      success: true,
      data: componentCode
    });

  } catch (error) {
    console.error('获取组件代码失败:', error);
    res.status(500).json({
      success: false,
      message: '获取组件代码失败',
      error: error.message
    });
  }
});

/**
 * 导出完整页面
 * POST /api/clone/export
 */
router.post('/export', [
  body('taskId')
    .isUUID()
    .withMessage('请提供有效的任务ID'),
  body('format')
    .isIn(['react', 'vue', 'html'])
    .withMessage('导出格式必须是 react, vue 或 html')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { taskId, format } = req.body;

    const exportResult = await cloneService.exportPage(taskId, format);

    res.json({
      success: true,
      message: '页面导出成功',
      data: exportResult
    });

  } catch (error) {
    console.error('导出页面失败:', error);
    res.status(500).json({
      success: false,
      message: '导出页面失败',
      error: error.message
    });
  }
});

export default router;