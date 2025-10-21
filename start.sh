#!/bin/bash

# 任务管理系统 - 快速启动脚本

echo "======================================"
echo "  OneCar 任务管理系统 - 快速启动"
echo "======================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null
then
    echo "❌ 错误: 未检测到 Node.js"
    echo "请先安装 Node.js (版本 >= 16.0.0)"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 显示 Node.js 版本
NODE_VERSION=$(node -v)
echo "✓ Node.js 版本: $NODE_VERSION"

# 检查 npm 是否安装
if ! command -v npm &> /dev/null
then
    echo "❌ 错误: 未检测到 npm"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✓ npm 版本: $NPM_VERSION"
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装项目依赖..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✓ 依赖安装完成"
    echo ""
else
    echo "✓ 依赖已安装"
    echo ""
fi

# 启动开发服务器
echo "🚀 正在启动开发服务器..."
echo "应用将在 http://localhost:3000 启动"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "======================================"
echo ""

npm run dev
