/**
 * Tom cat
 * 
 * 任务管理系统 - 应用入口文件
 * 
 * 功能说明：
 * - 初始化React应用实例
 * - 配置严格模式以检测潜在问题
 * - 将根组件挂载到DOM节点
 * - 引入全局样式文件
 * 
 * 技术栈：
 * - React 18
 * - TypeScript
 * - Vite构建工具
 * 
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

/**
 * 创建React根实例并渲染应用
 * 
 * 执行流程：
 * 1. 获取id为'root'的DOM元素
 * 2. 使用createRoot创建React 18的根实例
 * 3. 在StrictMode下渲染App组件
 * 
 * StrictMode作用：
 * - 识别不安全的生命周期
 * - 检测过时的API使用
 * - 检测意外的副作用
 * - 确保可重用的state
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);