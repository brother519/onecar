import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * 页面抓取服务核心类
 * 负责抓取目标网页内容并解析结构
 */
class FetchService {
  constructor() {
    this.storage = {
      tasks: new Map(),
      cache: new Map()
    };
    this.baseStoragePath = path.resolve('./storage');
    this.initStorage();
  }

  /**
   * 初始化存储目录
   */
  async initStorage() {
    try {
      await fs.mkdir(this.baseStoragePath, { recursive: true });
      await fs.mkdir(path.join(this.baseStoragePath, 'tasks'), { recursive: true });
      await fs.mkdir(path.join(this.baseStoragePath, 'cache'), { recursive: true });
      await fs.mkdir(path.join(this.baseStoragePath, 'generated'), { recursive: true });
    } catch (error) {
      console.error('初始化存储目录失败:', error);
    }
  }

  /**
   * 生成任务ID
   */
  generateTaskId() {
    return crypto.randomUUID();
  }

  /**
   * 生成URL哈希用于缓存
   */
  generateUrlHash(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  /**
   * 开始页面抓取任务
   * @param {string} url - 目标URL
   * @param {Object} options - 抓取选项
   */
  async startFetchTask(url, options = {}) {
    const taskId = this.generateTaskId();
    const urlHash = this.generateUrlHash(url);
    
    // 创建任务记录
    const task = {
      id: taskId,
      url,
      urlHash,
      status: 'PENDING',
      progress: 0,
      options,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.storage.tasks.set(taskId, task);

    // 异步执行抓取
    this.performFetch(taskId).catch(error => {
      console.error(`任务 ${taskId} 执行失败:`, error);
      this.updateTaskStatus(taskId, 'ERROR', 0, error.message);
    });

    return { taskId, status: 'PENDING' };
  }

  /**
   * 执行页面抓取
   * @param {string} taskId - 任务ID
   */
  async performFetch(taskId) {
    const task = this.storage.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    try {
      this.updateTaskStatus(taskId, 'IN_PROGRESS', 10);

      // 检查缓存
      const cachedResult = await this.getCachedResult(task.urlHash);
      if (cachedResult && !task.options.forceRefresh) {
        this.updateTaskStatus(taskId, 'COMPLETE', 100);
        task.result = cachedResult;
        return cachedResult;
      }

      // 抓取页面内容
      this.updateTaskStatus(taskId, 'IN_PROGRESS', 30);
      const pageContent = await this.fetchPageContent(task.url);

      // 解析页面结构
      this.updateTaskStatus(taskId, 'IN_PROGRESS', 50);
      const pageStructure = await this.parsePageStructure(pageContent);

      // 下载静态资源
      this.updateTaskStatus(taskId, 'IN_PROGRESS', 70);
      const assets = await this.downloadAssets(pageStructure, task.url, taskId);

      // 生成最终结果
      this.updateTaskStatus(taskId, 'IN_PROGRESS', 90);
      const result = {
        taskId,
        url: task.url,
        pageStructure,
        assets,
        fetchedAt: new Date()
      };

      // 保存结果
      await this.saveTaskResult(taskId, result);
      await this.cacheResult(task.urlHash, result);

      this.updateTaskStatus(taskId, 'COMPLETE', 100);
      task.result = result;

      return result;
    } catch (error) {
      this.updateTaskStatus(taskId, 'ERROR', 0, error.message);
      throw error;
    }
  }

  /**
   * 抓取页面内容
   * @param {string} url - 目标URL
   */
  async fetchPageContent(url) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      throw new Error('目标URL不是HTML页面');
    }

    return await response.text();
  }

  /**
   * 解析页面结构
   * @param {string} html - HTML内容
   */
  async parsePageStructure(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // 提取基本信息
    const title = document.title || '';
    const description = document.querySelector('meta[name="description"]')?.content || '';
    const keywords = document.querySelector('meta[name="keywords"]')?.content || '';

    // 解析DOM结构
    const structure = this.extractDOMStructure(document.body);

    // 提取样式信息
    const styles = this.extractStyles(document);

    // 识别关键元素
    const keyElements = this.identifyKeyElements(document);

    return {
      title,
      description,
      keywords,
      structure,
      styles,
      keyElements,
      originalHtml: html
    };
  }

  /**
   * 提取DOM结构
   * @param {Element} element - DOM元素
   */
  extractDOMStructure(element, depth = 0) {
    if (depth > 10) return null; // 防止过深递归

    const structure = {
      tagName: element.tagName?.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      attributes: {},
      children: [],
      textContent: element.nodeType === 3 ? element.textContent.trim() : null
    };

    // 提取重要属性
    if (element.attributes) {
      for (let attr of element.attributes) {
        if (['id', 'class', 'href', 'src', 'alt', 'title', 'data-*'].some(key => 
            key === attr.name || (key.endsWith('*') && attr.name.startsWith(key.slice(0, -1))))) {
          structure.attributes[attr.name] = attr.value;
        }
      }
    }

    // 递归处理子元素
    for (let child of element.children || []) {
      const childStructure = this.extractDOMStructure(child, depth + 1);
      if (childStructure) {
        structure.children.push(childStructure);
      }
    }

    return structure;
  }

  /**
   * 提取样式信息
   * @param {Document} document - DOM文档
   */
  extractStyles(document) {
    const styles = {
      inline: [],
      external: [],
      computed: {}
    };

    // 提取外部样式表
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    for (let link of links) {
      styles.external.push({
        href: link.href,
        media: link.media || 'all'
      });
    }

    // 提取内联样式
    const styleElements = document.querySelectorAll('style');
    for (let style of styleElements) {
      styles.inline.push(style.textContent);
    }

    return styles;
  }

  /**
   * 识别关键元素
   * @param {Document} document - DOM文档
   */
  identifyKeyElements(document) {
    const keyElements = {
      logo: [],
      navigation: [],
      searchBox: [],
      buttons: [],
      forms: []
    };

    // 识别Logo
    const logoSelectors = [
      'img[alt*="logo" i]',
      'img[src*="logo" i]',
      '.logo',
      '#logo',
      '[class*="logo" i]'
    ];
    
    logoSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        keyElements.logo.push(this.getElementInfo(el));
      });
    });

    // 识别导航
    const navElements = document.querySelectorAll('nav, .nav, .navigation, [role="navigation"]');
    navElements.forEach(el => {
      keyElements.navigation.push(this.getElementInfo(el));
    });

    // 识别搜索框
    const searchInputs = document.querySelectorAll('input[type="search"], input[name*="search" i], input[placeholder*="搜索" i]');
    searchInputs.forEach(el => {
      keyElements.searchBox.push(this.getElementInfo(el));
    });

    // 识别按钮
    const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"], .btn');
    buttons.forEach(el => {
      keyElements.buttons.push(this.getElementInfo(el));
    });

    // 识别表单
    const forms = document.querySelectorAll('form');
    forms.forEach(el => {
      keyElements.forms.push(this.getElementInfo(el));
    });

    return keyElements;
  }

  /**
   * 获取元素信息
   * @param {Element} element - DOM元素
   */
  getElementInfo(element) {
    return {
      tagName: element.tagName?.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      textContent: element.textContent?.trim() || null,
      outerHTML: element.outerHTML,
      attributes: Array.from(element.attributes || []).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {})
    };
  }

  /**
   * 下载静态资源
   * @param {Object} pageStructure - 页面结构
   * @param {string} baseUrl - 基础URL
   * @param {string} taskId - 任务ID
   */
  async downloadAssets(pageStructure, baseUrl, taskId) {
    const assets = {
      images: [],
      stylesheets: [],
      scripts: [],
      fonts: []
    };

    try {
      const taskDir = path.join(this.baseStoragePath, 'tasks', taskId);
      await fs.mkdir(taskDir, { recursive: true });
      await fs.mkdir(path.join(taskDir, 'assets'), { recursive: true });

      // 下载外部样式表
      for (let style of pageStructure.styles.external) {
        try {
          const absoluteUrl = new URL(style.href, baseUrl).href;
          const filename = this.generateAssetFilename(absoluteUrl, 'css');
          const filePath = path.join(taskDir, 'assets', filename);
          
          await this.downloadAsset(absoluteUrl, filePath);
          assets.stylesheets.push({
            originalUrl: style.href,
            localPath: filePath,
            filename,
            media: style.media
          });
        } catch (error) {
          console.warn(`下载样式表失败: ${style.href}`, error);
        }
      }

      // 识别并下载图片资源
      await this.downloadImageAssets(pageStructure.structure, baseUrl, taskDir, assets);

    } catch (error) {
      console.error('下载资源失败:', error);
    }

    return assets;
  }

  /**
   * 下载图片资源
   * @param {Object} structure - DOM结构
   * @param {string} baseUrl - 基础URL
   * @param {string} taskDir - 任务目录
   * @param {Object} assets - 资源集合
   */
  async downloadImageAssets(structure, baseUrl, taskDir, assets) {
    if (structure.tagName === 'img' && structure.attributes.src) {
      try {
        const absoluteUrl = new URL(structure.attributes.src, baseUrl).href;
        const filename = this.generateAssetFilename(absoluteUrl, 'img');
        const filePath = path.join(taskDir, 'assets', filename);
        
        await this.downloadAsset(absoluteUrl, filePath);
        assets.images.push({
          originalUrl: structure.attributes.src,
          localPath: filePath,
          filename,
          alt: structure.attributes.alt || ''
        });
      } catch (error) {
        console.warn(`下载图片失败: ${structure.attributes.src}`, error);
      }
    }

    // 递归处理子元素
    for (let child of structure.children || []) {
      await this.downloadImageAssets(child, baseUrl, taskDir, assets);
    }
  }

  /**
   * 下载单个资源
   * @param {string} url - 资源URL
   * @param {string} filePath - 本地文件路径
   */
  async downloadAsset(url, filePath) {
    const response = await fetch(url, {
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const buffer = await response.buffer();
    await fs.writeFile(filePath, buffer);
  }

  /**
   * 生成资源文件名
   * @param {string} url - 资源URL
   * @param {string} type - 资源类型
   */
  generateAssetFilename(url, type) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = path.extname(pathname) || (type === 'css' ? '.css' : type === 'img' ? '.png' : '');
    const basename = path.basename(pathname, extension) || 'asset';
    const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
    
    return `${basename}_${hash}${extension}`;
  }

  /**
   * 更新任务状态
   * @param {string} taskId - 任务ID
   * @param {string} status - 状态
   * @param {number} progress - 进度
   * @param {string} error - 错误信息
   */
  updateTaskStatus(taskId, status, progress, error = null) {
    const task = this.storage.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.progress = progress;
      task.updatedAt = new Date();
      if (error) {
        task.error = error;
      }
    }
  }

  /**
   * 获取任务状态
   * @param {string} taskId - 任务ID
   */
  getTaskStatus(taskId) {
    const task = this.storage.tasks.get(taskId);
    if (!task) {
      return null;
    }

    return {
      taskId: task.id,
      url: task.url,
      status: task.status,
      progress: task.progress,
      error: task.error || null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }

  /**
   * 获取任务结果
   * @param {string} taskId - 任务ID
   */
  getTaskResult(taskId) {
    const task = this.storage.tasks.get(taskId);
    if (!task || task.status !== 'COMPLETE') {
      return null;
    }

    return task.result;
  }

  /**
   * 保存任务结果
   * @param {string} taskId - 任务ID
   * @param {Object} result - 结果数据
   */
  async saveTaskResult(taskId, result) {
    const filePath = path.join(this.baseStoragePath, 'tasks', taskId, 'result.json');
    await fs.writeFile(filePath, JSON.stringify(result, null, 2));
  }

  /**
   * 缓存结果
   * @param {string} urlHash - URL哈希
   * @param {Object} result - 结果数据
   */
  async cacheResult(urlHash, result) {
    this.storage.cache.set(urlHash, {
      ...result,
      cachedAt: new Date()
    });

    // 同时保存到文件缓存
    const cacheDir = path.join(this.baseStoragePath, 'cache', urlHash);
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(path.join(cacheDir, 'result.json'), JSON.stringify(result, null, 2));
  }

  /**
   * 获取缓存结果
   * @param {string} urlHash - URL哈希
   */
  async getCachedResult(urlHash) {
    // 首先检查内存缓存
    if (this.storage.cache.has(urlHash)) {
      const cached = this.storage.cache.get(urlHash);
      // 检查缓存是否过期（24小时）
      if (Date.now() - new Date(cached.cachedAt).getTime() < 24 * 60 * 60 * 1000) {
        return cached;
      }
      this.storage.cache.delete(urlHash);
    }

    // 检查文件缓存
    try {
      const cacheFile = path.join(this.baseStoragePath, 'cache', urlHash, 'result.json');
      const stats = await fs.stat(cacheFile);
      
      // 检查文件是否过期
      if (Date.now() - stats.mtime.getTime() < 24 * 60 * 60 * 1000) {
        const content = await fs.readFile(cacheFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      // 缓存文件不存在或读取失败
    }

    return null;
  }
}

export default FetchService;