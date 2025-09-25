import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import FetchService from './fetchService.js';

/**
 * 页面克隆服务
 * 负责将抓取的页面数据转换为可复用的组件代码
 */
class CloneService {
  constructor() {
    this.fetchService = new FetchService();
    this.baseStoragePath = path.resolve('./storage');
    this.componentTemplates = this.initComponentTemplates();
  }

  /**
   * 初始化组件模板
   */
  initComponentTemplates() {
    return {
      react: {
        component: `import React from 'react';
import './{{componentName}}.css';

interface {{componentName}}Props {
  className?: string;
}

const {{componentName}}: React.FC<{{componentName}}Props> = ({ className }) => {
  return (
    <div className={\`{{kebabName}} \${className || ''}\`}>
      {{componentBody}}
    </div>
  );
};

export default {{componentName}};`,
        
        style: `/* {{componentName}} 样式 */
.{{kebabName}} {
  {{styles}}
}`,

        index: `export { default } from './{{componentName}}';`
      },

      vue: {
        component: `<template>
  <div :class="[\`{{kebabName}}\`, className]">
    {{componentBody}}
  </div>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

defineProps<Props>();
</script>

<style scoped>
{{styles}}
</style>`,
      },

      html: {
        page: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    {{styles}}
  </style>
</head>
<body>
  {{body}}
</body>
</html>`
      }
    };
  }

  /**
   * 生成克隆页面
   * @param {string} taskId - 任务ID
   * @param {Object} config - 生成配置
   */
  async generateClonePage(taskId, config = {}) {
    // 直接从当前fetchService实例获取结果
    const taskResult = this.fetchService.getTaskResult(taskId);
    if (!taskResult) {
      // 如果没有结果，尝试从存储中读取
      try {
        const resultPath = path.join(this.baseStoragePath, 'tasks', taskId, 'result.json');
        const content = await fs.readFile(resultPath, 'utf-8');
        const storedResult = JSON.parse(content);
        if (storedResult && storedResult.pageStructure) {
          // 使用存储的结果
          return await this.processClonePage(storedResult, config);
        }
      } catch (error) {
        console.error('读取存储结果失败:', error);
      }
      throw new Error('任务结果不存在或任务尚未完成');
    }

    return await this.processClonePage(taskResult, config);
  }

  /**
   * 处理克隆页面生成
   * @param {Object} taskResult - 任务结果
   * @param {Object} config - 生成配置
   */
  async processClonePage(taskResult, config) {

    const {
      fidelity = 'high', // 保真度: high, medium, low
      componentization = 'partial', // 组件化程度: full, partial, none
      styleHandling = 'inherit', // 样式处理: inherit, simplified, custom
      interactivity = 'basic', // 交互功能: full, basic, static
      responsive = 'full' // 响应式: full, desktop, mobile
    } = config;

    // 分析页面结构
    const analyzedStructure = await this.analyzePageStructure(taskResult.pageStructure, config);

    // 生成组件树
    const componentTree = await this.buildComponentTree(analyzedStructure, config);

    // 生成代码
    const generatedCode = await this.generateCode(componentTree, config);

    // 保存生成结果
    const result = {
      taskId: taskResult.taskId,
      config,
      analyzedStructure,
      componentTree,
      generatedCode,
      generatedAt: new Date()
    };

    await this.saveGeneratedResult(taskResult.taskId, result);

    return result;
  }

  /**
   * 分析页面结构
   * @param {Object} pageStructure - 页面结构数据
   * @param {Object} config - 配置选项
   */
  async analyzePageStructure(pageStructure, config) {
    const analysis = {
      layout: this.analyzeLayout(pageStructure.structure),
      components: this.identifyComponents(pageStructure.keyElements),
      styles: this.analyzeStyles(pageStructure.styles),
      content: this.extractContent(pageStructure.structure),
      interactions: this.identifyInteractions(pageStructure.structure)
    };

    return analysis;
  }

  /**
   * 分析页面布局
   * @param {Object} structure - DOM结构
   */
  analyzeLayout(structure) {
    const layout = {
      type: 'unknown',
      regions: [],
      gridInfo: null,
      flexInfo: null
    };

    // 识别布局类型
    if (this.isHeaderBodyFooterLayout(structure)) {
      layout.type = 'header-body-footer';
      layout.regions = ['header', 'main', 'footer'];
    } else if (this.isCenteredLayout(structure)) {
      layout.type = 'centered';
      layout.regions = ['center'];
    } else if (this.isSidebarLayout(structure)) {
      layout.type = 'sidebar';
      layout.regions = ['sidebar', 'main'];
    }

    return layout;
  }

  /**
   * 识别组件
   * @param {Object} keyElements - 关键元素
   */
  identifyComponents(keyElements) {
    const components = [];

    // Logo组件
    if (keyElements.logo.length > 0) {
      components.push({
        type: 'Logo',
        elements: keyElements.logo,
        priority: 'high'
      });
    }

    // 导航组件
    if (keyElements.navigation.length > 0) {
      components.push({
        type: 'Navigation',
        elements: keyElements.navigation,
        priority: 'high'
      });
    }

    // 搜索框组件
    if (keyElements.searchBox.length > 0) {
      components.push({
        type: 'SearchBox',
        elements: keyElements.searchBox,
        priority: 'high'
      });
    }

    // 按钮组件
    if (keyElements.buttons.length > 0) {
      components.push({
        type: 'Button',
        elements: keyElements.buttons,
        priority: 'medium'
      });
    }

    return components;
  }

  /**
   * 分析样式
   * @param {Object} styles - 样式数据
   */
  analyzeStyles(styles) {
    const analysis = {
      colorScheme: this.extractColorScheme(styles),
      typography: this.extractTypography(styles),
      spacing: this.extractSpacing(styles),
      layout: this.extractLayoutStyles(styles)
    };

    return analysis;
  }

  /**
   * 提取颜色方案
   * @param {Object} styles - 样式数据
   */
  extractColorScheme(styles) {
    const colors = {
      primary: '#1890ff',
      secondary: '#52c41a',
      background: '#ffffff',
      text: '#333333',
      border: '#d9d9d9'
    };

    // 从CSS中提取颜色
    const cssText = styles.inline.join('\n');
    const colorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const foundColors = cssText.match(colorRegex) || [];

    // 分析和分类颜色
    if (foundColors.length > 0) {
      colors.extracted = [...new Set(foundColors)];
    }

    return colors;
  }

  /**
   * 提取字体信息
   * @param {Object} styles - 样式数据
   */
  extractTypography(styles) {
    return {
      fontFamily: 'Arial, sans-serif',
      fontSize: {
        base: '14px',
        large: '18px',
        small: '12px'
      },
      fontWeight: {
        normal: '400',
        bold: '600'
      },
      lineHeight: '1.5'
    };
  }

  /**
   * 提取间距信息
   * @param {Object} styles - 样式数据
   */
  extractSpacing(styles) {
    return {
      padding: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px'
      },
      margin: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px'
      }
    };
  }

  /**
   * 提取布局样式
   * @param {Object} styles - 样式数据
   */
  extractLayoutStyles(styles) {
    return {
      containerWidth: '1200px',
      breakpoints: {
        mobile: '768px',
        tablet: '1024px',
        desktop: '1200px'
      }
    };
  }

  /**
   * 构建组件树
   * @param {Object} analyzedStructure - 分析后的结构
   * @param {Object} config - 配置选项
   */
  async buildComponentTree(analyzedStructure, config) {
    const tree = {
      root: {
        type: 'Page',
        name: 'BaiduHomePage',
        children: []
      }
    };

    // 根据布局类型构建树结构
    if (analyzedStructure.layout.type === 'centered') {
      tree.root.children = [
        {
          type: 'Container',
          name: 'CenteredContainer',
          children: this.buildCenteredComponents(analyzedStructure.components)
        }
      ];
    }

    return tree;
  }

  /**
   * 构建居中布局组件
   * @param {Array} components - 组件列表
   */
  buildCenteredComponents(components) {
    const centeredComponents = [];

    // 添加Logo
    const logoComponent = components.find(c => c.type === 'Logo');
    if (logoComponent) {
      centeredComponents.push({
        type: 'Logo',
        name: 'CenteredLogo',
        props: this.extractLogoProps(logoComponent.elements[0])
      });
    }

    // 添加搜索框
    const searchComponent = components.find(c => c.type === 'SearchBox');
    if (searchComponent) {
      centeredComponents.push({
        type: 'SearchBox',
        name: 'CenteredSearchBox',
        props: this.extractSearchBoxProps(searchComponent.elements[0])
      });
    }

    return centeredComponents;
  }

  /**
   * 生成代码
   * @param {Object} componentTree - 组件树
   * @param {Object} config - 配置选项
   */
  async generateCode(componentTree, config) {
    const format = config.format || 'react';
    const code = {
      format,
      components: [],
      styles: '',
      index: ''
    };

    // 递归生成组件代码
    await this.generateComponentCode(componentTree.root, code, format);

    return code;
  }

  /**
   * 生成组件代码
   * @param {Object} component - 组件对象
   * @param {Object} code - 代码对象
   * @param {string} format - 代码格式
   */
  async generateComponentCode(component, code, format) {
    const componentCode = {
      name: component.name,
      type: component.type,
      code: '',
      styles: '',
      children: []
    };

    // 生成组件主体代码
    if (format === 'react') {
      componentCode.code = this.generateReactComponent(component);
      componentCode.styles = this.generateComponentStyles(component);
    } else if (format === 'vue') {
      componentCode.code = this.generateVueComponent(component);
    } else if (format === 'html') {
      componentCode.code = this.generateHtmlComponent(component);
    }

    // 递归处理子组件
    if (component.children) {
      for (let child of component.children) {
        await this.generateComponentCode(child, componentCode, format);
      }
    }

    code.components.push(componentCode);
  }

  /**
   * 生成React组件
   * @param {Object} component - 组件对象
   */
  generateReactComponent(component) {
    const template = this.componentTemplates.react.component;
    
    let componentBody = '';
    if (component.type === 'Logo') {
      componentBody = `<img src="${component.props?.src || '/logo.png'}" alt="${component.props?.alt || 'Logo'}" />`;
    } else if (component.type === 'SearchBox') {
      componentBody = `
        <div className="search-container">
          <input 
            type="text" 
            placeholder="${component.props?.placeholder || '请输入搜索内容'}"
            className="search-input"
          />
          <button className="search-button">搜索</button>
        </div>`;
    } else {
      // 处理子组件
      if (component.children) {
        componentBody = component.children.map(child => `<${child.name} />`).join('\n      ');
      }
    }

    return template
      .replace(/\{\{componentName\}\}/g, component.name)
      .replace(/\{\{kebabName\}\}/g, this.toKebabCase(component.name))
      .replace(/\{\{componentBody\}\}/g, componentBody);
  }

  /**
   * 生成组件样式
   * @param {Object} component - 组件对象
   */
  generateComponentStyles(component) {
    let styles = '';

    if (component.type === 'Logo') {
      styles = `
  width: auto;
  height: 40px;
  display: block;`;
    } else if (component.type === 'SearchBox') {
      styles = `
  .search-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .search-input {
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    min-width: 300px;
  }

  .search-button {
    padding: 8px 16px;
    background-color: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .search-button:hover {
    background-color: #40a9ff;
  }`;
    }

    return styles;
  }

  /**
   * 生成预览
   * @param {Object} pageData - 页面数据
   */
  async generatePreview(pageData) {
    const previewId = crypto.randomUUID();
    const previewDir = path.join(this.baseStoragePath, 'generated', 'previews', previewId);
    
    await fs.mkdir(previewDir, { recursive: true });

    // 生成预览HTML文件
    const htmlContent = this.generatePreviewHTML(pageData);
    const htmlPath = path.join(previewDir, 'index.html');
    await fs.writeFile(htmlPath, htmlContent);

    return `/api/preview/${previewId}`;
  }

  /**
   * 生成预览HTML
   * @param {Object} pageData - 页面数据
   */
  generatePreviewHTML(pageData) {
    const template = this.componentTemplates.html.page;
    
    return template
      .replace(/\{\{title\}\}/g, pageData.title || '百度首页仿写')
      .replace(/\{\{styles\}\}/g, this.generatePreviewStyles())
      .replace(/\{\{body\}\}/g, this.generatePreviewBody(pageData));
  }

  /**
   * 生成预览样式
   */
  generatePreviewStyles() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
      }

      .page-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .logo {
        margin-bottom: 30px;
      }

      .logo img {
        width: auto;
        height: 80px;
      }

      .search-container {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 30px;
      }

      .search-input {
        padding: 12px 16px;
        border: 2px solid #4285f4;
        border-radius: 24px;
        font-size: 16px;
        width: 500px;
        outline: none;
      }

      .search-input:focus {
        box-shadow: 0 2px 5px 1px rgba(64,60,67,.16);
      }

      .search-button {
        padding: 12px 24px;
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .search-button:hover {
        background-color: #3367d6;
      }
    `;
  }

  /**
   * 生成预览主体
   * @param {Object} pageData - 页面数据
   */
  generatePreviewBody(pageData) {
    return `
      <div class="page-container">
        <div class="logo">
          <img src="https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png" alt="百度">
        </div>
        <div class="search-container">
          <input type="text" class="search-input" placeholder="百度一下，你就知道">
          <button class="search-button">百度一下</button>
        </div>
      </div>
    `;
  }

  /**
   * 获取组件代码
   * @param {string} taskId - 任务ID
   */
  async getComponentCode(taskId) {
    try {
      const resultPath = path.join(this.baseStoragePath, 'generated', taskId, 'result.json');
      const content = await fs.readFile(resultPath, 'utf-8');
      const result = JSON.parse(content);
      return result.generatedCode;
    } catch (error) {
      return null;
    }
  }

  /**
   * 导出页面
   * @param {string} taskId - 任务ID
   * @param {string} format - 导出格式
   */
  async exportPage(taskId, format) {
    const generatedCode = await this.getComponentCode(taskId);
    if (!generatedCode) {
      throw new Error('生成的代码不存在');
    }

    const exportId = crypto.randomUUID();
    const exportDir = path.join(this.baseStoragePath, 'generated', 'exports', exportId);
    await fs.mkdir(exportDir, { recursive: true });

    return {
      exportId,
      format,
      downloadUrl: `/api/download/${exportId}`,
      files: []
    };
  }

  /**
   * 保存生成结果
   * @param {string} taskId - 任务ID
   * @param {Object} result - 生成结果
   */
  async saveGeneratedResult(taskId, result) {
    const resultDir = path.join(this.baseStoragePath, 'generated', taskId);
    await fs.mkdir(resultDir, { recursive: true });
    
    const resultPath = path.join(resultDir, 'result.json');
    await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
  }

  // 工具方法

  /**
   * 转换为kebab-case
   * @param {string} str - 字符串
   */
  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 检查是否为头部-主体-底部布局
   * @param {Object} structure - DOM结构
   */
  isHeaderBodyFooterLayout(structure) {
    return structure.children && structure.children.length >= 2;
  }

  /**
   * 检查是否为居中布局
   * @param {Object} structure - DOM结构
   */
  isCenteredLayout(structure) {
    return true; // 默认认为是居中布局
  }

  /**
   * 检查是否为侧边栏布局
   * @param {Object} structure - DOM结构
   */
  isSidebarLayout(structure) {
    return false;
  }

  /**
   * 提取内容
   * @param {Object} structure - DOM结构
   */
  extractContent(structure) {
    return {
      text: structure.textContent || '',
      images: [],
      links: []
    };
  }

  /**
   * 识别交互元素
   * @param {Object} structure - DOM结构
   */
  identifyInteractions(structure) {
    return {
      buttons: [],
      forms: [],
      links: []
    };
  }

  /**
   * 提取Logo属性
   * @param {Object} element - Logo元素
   */
  extractLogoProps(element) {
    return {
      src: element?.attributes?.src || '/logo.png',
      alt: element?.attributes?.alt || 'Logo'
    };
  }

  /**
   * 提取搜索框属性
   * @param {Object} element - 搜索框元素
   */
  extractSearchBoxProps(element) {
    return {
      placeholder: element?.attributes?.placeholder || '请输入搜索内容'
    };
  }
}

export default CloneService;