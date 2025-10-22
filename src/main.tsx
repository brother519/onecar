/**
 * 应用程序入口文件
 * 负责初始化 React 应用并挂载到 DOM 节点
 * 使用 React.StrictMode 开启严格模式，帮助发现潜在问题
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 创建 React 根节点并渲染应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);