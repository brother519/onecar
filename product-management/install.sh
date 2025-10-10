#!/bin/bash

# 商品后台管理系统 - 安装脚本

echo "🚀 开始安装商品后台管理系统..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装Node.js 16.0.0或更高版本"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
echo "✅ 检测到Node.js版本: $NODE_VERSION"

# 检查npm版本
if ! command -v npm &> /dev/null; then
    echo "❌ 未找到npm，请确保npm已正确安装"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ 检测到npm版本: $NPM_VERSION"

echo ""
echo "📦 开始安装依赖包..."

# 安装核心依赖
echo "安装React核心库..."
npm install react@^18.2.0 react-dom@^18.2.0

echo "安装路由管理..."
npm install react-router-dom@^6.8.1

echo "安装UI组件库..."
npm install antd@^5.1.4

echo "安装拖拽功能..."
npm install react-dnd@^16.0.1 react-dnd-html5-backend@^16.0.1

echo "安装虚拟滚动..."
npm install react-virtualized@^9.22.3 react-window@^1.8.8 react-window-infinite-loader@^1.0.8

echo "安装代码编辑器..."
npm install @monaco-editor/react@^4.4.6

echo "安装二维码库..."
npm install qrcode@^1.5.3 qrcode.react@^3.1.0

echo "安装状态管理..."
npm install @reduxjs/toolkit@^1.9.1 react-redux@^8.0.5

echo "安装工具库..."
npm install axios@^1.2.2 lodash@^4.17.21 dayjs@^1.11.7

# 安装开发依赖
echo ""
echo "🛠️ 安装开发工具..."
npm install --save-dev @types/react@^18.0.26 @types/react-dom@^18.0.9
npm install --save-dev @vitejs/plugin-react@^3.1.0
npm install --save-dev vite@^4.1.0
npm install --save-dev eslint@^8.33.0
npm install --save-dev eslint-plugin-react@^7.32.1
npm install --save-dev eslint-plugin-react-hooks@^4.6.0
npm install --save-dev eslint-plugin-react-refresh@^0.3.4

echo ""
echo "✅ 所有依赖安装完成！"
echo ""
echo "🚀 可以使用以下命令启动项目:"
echo "   npm run dev      # 启动开发服务器"
echo "   npm run build    # 构建生产版本"
echo "   npm run lint     # 运行代码检查"
echo "   npm run preview  # 预览生产构建"
echo ""
echo "📖 更多信息请查看 README.md 文件"