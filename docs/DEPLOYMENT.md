# OneCar 项目部署与调试指南

## 项目概述

OneCar 是一个基于前后端分离架构的汽车商品后台管理系统，具备完整的开发、测试、部署和监控功能。

### 技术栈

- **前端**: React 18 + TypeScript + Vite + Ant Design
- **后端**: Node.js + Express.js + JavaScript ES6+
- **容器化**: Docker + Docker Compose
- **代理**: Nginx
- **测试**: Vitest (前端) + Jest (后端)
- **监控**: 自定义健康检查和性能监控

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Docker & Docker Compose (可选)
- 操作系统: macOS/Linux/Windows

### 1. 环境检查

首次运行前，请执行环境检查：

```bash
# 运行环境检查脚本
./scripts/env-check.sh
```

该脚本会检查：
- Node.js 和 npm 版本
- 端口占用情况
- 系统资源
- 项目结构
- 必要工具

### 2. 依赖安装

```bash
# 安装所有依赖
./scripts/deps.sh install all

# 或分别安装
./scripts/deps.sh install frontend
./scripts/deps.sh install backend
```

### 3. 启动开发环境

```bash
# 启动所有服务
./start.sh all

# 仅启动前端
./start.sh frontend

# 仅启动后端
./start.sh backend
```

启动后访问：
- 前端: http://localhost:3000
- 后端 API: http://localhost:3001
- 健康检查: http://localhost:3001/api/health

## 开发工具命令

### 启动脚本 (start.sh)

```bash
./start.sh [command]
```

支持的命令：
- `all` - 启动前后端服务 (默认)
- `frontend` - 仅启动前端服务
- `backend` - 仅启动后端服务
- `stop` - 停止所有服务
- `restart` - 重启所有服务
- `status` - 显示服务状态
- `logs [service] [lines]` - 显示服务日志
- `monitor` - 实时监控服务状态
- `health` - 执行健康检查
- `test` - 运行测试
- `build` - 构建项目
- `clean` - 清理项目

### 环境检查脚本 (scripts/env-check.sh)

```bash
./scripts/env-check.sh
```

功能：
- 检查系统环境
- 验证 Node.js 版本
- 检查端口占用
- 验证项目结构
- 生成环境报告

### 依赖管理脚本 (scripts/deps.sh)

```bash
./scripts/deps.sh [command] [component]
```

命令：
- `install [frontend|backend|all]` - 安装依赖
- `update [frontend|backend|all]` - 更新依赖
- `clean [frontend|backend|all]` - 清理依赖
- `audit` - 检查安全漏洞
- `status` - 显示依赖状态
- `report` - 生成依赖报告

### 测试脚本 (scripts/test.sh)

```bash
./scripts/test.sh [command] [mode]
```

命令：
- `frontend [run|watch|coverage|ci]` - 运行前端测试
- `backend [run|watch|coverage|ci]` - 运行后端测试
- `all [run|watch|coverage|ci]` - 运行所有测试
- `report` - 生成测试报告
- `cleanup` - 清理测试文件

### Docker 管理脚本 (scripts/docker.sh)

```bash
./scripts/docker.sh [command] [environment]
```

命令：
- `build [development|production]` - 构建镜像
- `start [development|production]` - 启动服务
- `stop [development|production]` - 停止服务
- `restart [development|production]` - 重启服务
- `status [development|production]` - 显示服务状态
- `logs [env] [service] [lines]` - 查看日志
- `exec [env] [service] [command]` - 执行命令
- `cleanup [development|production|all]` - 清理资源
- `backup` - 备份数据
- `health [development|production]` - 健康检查

## 环境配置

### 前端环境变量

在 `frontend/.env.development` 或 `frontend/.env.production` 中配置：

```env
# 开发服务器
VITE_PORT=3000
VITE_HOST=localhost
VITE_OPEN=true

# API 配置
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TIMEOUT=10000

# 应用配置
VITE_APP_TITLE=OneCar 商品管理系统
VITE_ENABLE_DEBUG=true
```

### 后端环境变量

在 `backend/.env.development` 或 `backend/.env.production` 中配置：

```env
# 基础配置
NODE_ENV=development
PORT=3001
HOST=localhost

# 安全配置
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:3000

# 日志配置
LOG_LEVEL=debug
LOG_FILE=logs/app.log
```

## 容器化部署

### 开发环境

```bash
# 构建和启动开发环境
./scripts/docker.sh build development
./scripts/docker.sh start development
```

### 生产环境

```bash
# 构建生产镜像
./scripts/docker.sh build production

# 启动生产服务
./scripts/docker.sh start production
```

### Docker Compose 文件

- `docker-compose.yml` - 生产环境配置
- `docker-compose.dev.yml` - 开发环境配置

## 监控与健康检查

### 健康检查端点

- `/api/health` - 基础健康状态
- `/api/health/detailed` - 详细健康检查
- `/api/ready` - 就绪检查
- `/api/live` - 存活检查
- `/api/info` - 系统信息
- `/api/metrics` - 性能指标

### 实时监控

```bash
# 启动实时监控
./start.sh monitor
```

监控信息包括：
- 服务状态
- 系统资源使用
- API 响应时间
- 错误率统计

### 日志管理

日志文件位置：
- 应用日志: `logs/app.log`
- 前端日志: `logs/frontend.log`
- 后端日志: `logs/backend.log`
- Nginx 日志: `logs/nginx/`

日志查看：
```bash
# 查看实时日志
./start.sh logs all 100

# 查看特定服务日志
./start.sh logs backend 50
```

## 测试

### 前端测试

```bash
# 运行测试
cd frontend && npm test

# 生成覆盖率报告
cd frontend && npm run test:coverage

# 监视模式
cd frontend && npm run test:watch
```

### 后端测试

```bash
# 运行测试
cd backend && npm test

# 生成覆盖率报告
cd backend && npm run test:coverage

# 监视模式
cd backend && npm run test:watch
```

### 集成测试

```bash
# 运行所有测试
./scripts/test.sh all coverage
```

## 调试与开发

### 前端调试

开启调试模式后，可在浏览器控制台访问：

```javascript
// 查看调试日志
window.__ONECAR_DEBUG__.getLogs()

// 导出调试日志
window.__ONECAR_DEBUG__.exportLogs()

// 查看系统信息
window.__ONECAR_DEBUG__.getSystemInfo()
```

### 后端调试

- 查看日志: `logs/app.log`
- 调试端点: `/api/stats`
- 开发模式下会输出详细错误信息

### 性能监控

- API 响应时间自动记录
- 慢查询警告（>1000ms）
- 内存使用监控
- 错误率统计

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :3001
   
   # 修改配置文件中的端口
   ```

2. **依赖安装失败**
   ```bash
   # 清理缓存
   npm cache clean --force
   
   # 重新安装
   ./scripts/deps.sh clean all
   ./scripts/deps.sh install all
   ```

3. **服务启动失败**
   ```bash
   # 检查日志
   ./start.sh logs all
   
   # 检查健康状态
   ./start.sh health
   
   # 重启服务
   ./start.sh restart
   ```

4. **Docker 问题**
   ```bash
   # 清理 Docker 资源
   ./scripts/docker.sh cleanup all
   
   # 重新构建
   ./scripts/docker.sh build production
   ```

### 日志分析

检查各种日志文件：
- 应用错误: `logs/app.log`
- 系统监控: `/api/stats`
- 服务状态: `./start.sh status`

### 性能问题

1. 检查性能指标: `/api/metrics`
2. 查看慢查询日志
3. 监控内存使用情况
4. 检查网络延迟

## 维护

### 定期维护任务

1. **日志清理**
   ```bash
   # 清理旧日志文件
   find logs -name "*.log.*" -mtime +30 -delete
   ```

2. **依赖更新**
   ```bash
   # 检查依赖更新
   ./scripts/deps.sh audit
   
   # 更新依赖
   ./scripts/deps.sh update all
   ```

3. **安全检查**
   ```bash
   # 检查安全漏洞
   npm audit
   ```

4. **备份数据**
   ```bash
   # 备份重要数据
   ./scripts/docker.sh backup
   ```

### 版本升级

1. 备份当前版本
2. 运行测试确保功能正常
3. 更新依赖版本
4. 重新测试
5. 部署新版本

## 联系与支持

如遇到问题，请检查：
1. 环境检查报告: `environment-report.txt`
2. 依赖报告: `dependency-report.txt`
3. 测试报告: `test-reports/`
4. 应用日志: `logs/`

---

更多详细信息请参考各个脚本的 `--help` 选项或查看源代码中的注释。