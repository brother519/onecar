# 依赖安装指南

本项目需要安装以下依赖包。由于当前环境没有Node.js和npm，以下是完整的安装命令：

## 生产依赖

```bash
npm install react@^18.2.0 react-dom@^18.2.0
npm install react-router-dom@^6.8.1
npm install antd@^5.1.4
npm install react-dnd@^16.0.1 react-dnd-html5-backend@^16.0.1
npm install react-virtualized@^9.22.3 react-window@^1.8.8 react-window-infinite-loader@^1.0.8
npm install @monaco-editor/react@^4.4.6
npm install qrcode@^1.5.3 qrcode.react@^3.1.0
npm install @reduxjs/toolkit@^1.9.1 react-redux@^8.0.5
npm install axios@^1.2.2
npm install lodash@^4.17.21
npm install dayjs@^1.11.7
```

## 开发依赖

```bash
npm install --save-dev @types/react@^18.0.26 @types/react-dom@^18.0.9
npm install --save-dev @vitejs/plugin-react@^3.1.0
npm install --save-dev vite@^4.1.0
npm install --save-dev eslint@^8.33.0
npm install --save-dev eslint-plugin-react@^7.32.1
npm install --save-dev eslint-plugin-react-hooks@^4.6.0
npm install --save-dev eslint-plugin-react-refresh@^0.3.4
```

## 一键安装

```bash
# 安装所有依赖
npm install

# 或使用yarn
yarn install
```

## 依赖说明

### 核心框架
- **react**: React 18 主框架
- **react-dom**: React DOM渲染库
- **react-router-dom**: 路由管理

### UI组件库
- **antd**: Ant Design 企业级UI组件库

### 拖拽功能
- **react-dnd**: React拖拽库
- **react-dnd-html5-backend**: HTML5拖拽后端

### 虚拟滚动
- **react-virtualized**: 虚拟滚动组件(备用)
- **react-window**: 轻量级虚拟滚动
- **react-window-infinite-loader**: 无限滚动扩展

### 代码编辑器
- **@monaco-editor/react**: Monaco编辑器React封装

### 二维码
- **qrcode**: 二维码生成库
- **qrcode.react**: React二维码组件

### 状态管理
- **@reduxjs/toolkit**: Redux工具包
- **react-redux**: React Redux绑定

### 工具库
- **axios**: HTTP客户端
- **lodash**: 工具函数库
- **dayjs**: 日期处理库

### 开发工具
- **vite**: 构建工具
- **eslint**: 代码检查
- **@vitejs/plugin-react**: Vite React插件