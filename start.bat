@echo off
chcp 65001 >nul
cls

echo ======================================
echo   OneCar 任务管理系统 - 快速启动
echo ======================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo 请先安装 Node.js (版本 ^>= 16.0.0^)
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 显示 Node.js 版本
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js 版本: %NODE_VERSION%

REM 检查 npm 是否安装
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未检测到 npm
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✓ npm 版本: %NPM_VERSION%
echo.

REM 检查是否已安装依赖
if not exist "node_modules\" (
    echo 📦 正在安装项目依赖...
    call npm install
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✓ 依赖安装完成
    echo.
) else (
    echo ✓ 依赖已安装
    echo.
)

REM 启动开发服务器
echo 🚀 正在启动开发服务器...
echo 应用将在 http://localhost:3000 启动
echo.
echo 按 Ctrl+C 停止服务器
echo ======================================
echo.

call npm run dev
