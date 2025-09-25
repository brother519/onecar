import express from 'express';
import FetchService from '../services/fetchService.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();
const fetchService = new FetchService();

/**
 * 启动页面抓取任务
 * POST /api/fetch/start
 */
router.post('/start', [
  body('url')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('请提供有效的URL'),
  body('options')
    .optional()
    .isObject()
    .withMessage('选项必须是一个对象')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { url, options = {} } = req.body;

    // 安全检查：只允许抓取指定域名
    const allowedDomains = ['baidu.com', 'www.baidu.com'];
    const urlObj = new URL(url);
    
    if (!allowedDomains.includes(urlObj.hostname)) {
      return res.status(400).json({
        success: false,
        message: '出于安全考虑，只允许抓取百度首页'
      });
    }

    // 启动抓取任务
    const result = await fetchService.startFetchTask(url, options);

    res.json({
      success: true,
      message: '抓取任务已启动',
      data: result
    });

  } catch (error) {
    console.error('启动抓取任务失败:', error);
    res.status(500).json({
      success: false,
      message: '启动抓取任务失败',
      error: error.message
    });
  }
});

/**
 * 查询抓取任务状态
 * GET /api/fetch/status/:taskId
 */
router.get('/status/:taskId', [
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
    const status = fetchService.getTaskStatus(taskId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('查询任务状态失败:', error);
    res.status(500).json({
      success: false,
      message: '查询任务状态失败',
      error: error.message
    });
  }
});

/**
 * 获取抓取结果
 * GET /api/fetch/result/:taskId
 */
router.get('/result/:taskId', [
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
    const result = fetchService.getTaskResult(taskId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '任务结果不存在或任务尚未完成'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('获取任务结果失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务结果失败',
      error: error.message
    });
  }
});

/**
 * 获取任务列表
 * GET /api/fetch/tasks
 */
router.get('/tasks', async (req, res) => {
  try {
    const tasks = Array.from(fetchService.storage.tasks.values()).map(task => ({
      id: task.id,
      url: task.url,
      status: task.status,
      progress: task.progress,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      error: task.error || null
    }));

    res.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务列表失败',
      error: error.message
    });
  }
});

/**
 * 删除任务
 * DELETE /api/fetch/task/:taskId
 */
router.delete('/task/:taskId', [
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
    
    if (!fetchService.storage.tasks.has(taskId)) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    fetchService.storage.tasks.delete(taskId);

    res.json({
      success: true,
      message: '任务已删除'
    });

  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败',
      error: error.message
    });
  }
});

export default router;