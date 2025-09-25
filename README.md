# OneCar 商品后台管理系统

[![Build Status](https://github.com/onecar/onecar/workflows/Test%20Suite/badge.svg)](https://github.com/onecar/onecar/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个功能完整的汽车商品后台管理系统，基于现代 Web 技术栈构建，具备完善的开发、测试、部署和监控功能。

## ✨ 特性

- **商品管理**: 完整的CRUD操作，支持图片上传和预览
- **分类管理**: 层级分类结构，支持拖拽排序
- **批量操作**: 支持批量编辑、删除和导入导出
- **搜索过滤**: 多条件搜索，实时筛选
- **数据可视化**: 图表展示，数据统计分析
- **现代技术栈**: React 18 + TypeScript + Node.js
- **开箱即用**: 一键启动开发和生产环境
- **完整测试**: 单元测试、集成测试、E2E测试
- **容器化部署**: Docker + Docker Compose 支持
- **实时监控**: 健康检查、性能监控、日志系统

## 🏗 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx代理     │────│   前端服务      │────│   后端API      │
│   (端口80)      │    │   (端口3000)    │    │   (端口3001)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   文件存储      │    │   日志系统      │
                       │   uploads/      │    │   logs/         │
                       └─────────────────┘    └─────────────────┘
```

### 技术栈

| 分类 | 技术选择 | 版本要求 |
|------|----------|----------|
| **前端框架** | React | ^18.2.0 |
| **构建工具** | Vite | ^4.4.5 |
| **类型系统** | TypeScript | ^5.0.2 |
| **UI组件库** | Ant Design | ^5.9.0 |
| **后端框架** | Express.js | ^4.18.2 |
| **运行环境** | Node.js | >=16.0.0 |
| **容器化** | Docker | latest |

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 操作系统: macOS / Linux / Windows

### 一键启动

```bash
# 1. 克隆项目
git clone https://github.com/onecar/onecar.git
cd onecar

# 2. 环境检查（推荐）
./scripts/env-check.sh

# 3. 安装依赖
./scripts/deps.sh install all

# 4. 启动开发环境
./start.sh all
```

启动后访问：
- 🌐 **前端应用**: http://localhost:3000
- 🔗 **后端API**: http://localhost:3001
- ❤️ **健康检查**: http://localhost:3001/api/health

### Docker 部署

```bash
# 开发环境
./scripts/docker.sh start development

# 生产环境
./scripts/docker.sh start production
```

## 📋 使用指南

### 核心脚本

| 脚本 | 功能 | 示例 |
|------|------|------|
| `start.sh` | 服务管理 | `./start.sh all` |
| `scripts/deps.sh` | 依赖管理 | `./scripts/deps.sh install` |
| `scripts/test.sh` | 测试执行 | `./scripts/test.sh all coverage` |
| `scripts/docker.sh` | 容器管理 | `./scripts/docker.sh build production` |
| `scripts/env-check.sh` | 环境检查 | `./scripts/env-check.sh` |

### 开发命令

```bash
# 服务管理
./start.sh all          # 启动所有服务
./start.sh stop         # 停止所有服务
./start.sh status       # 查看状态
./start.sh monitor      # 实时监控
./start.sh health       # 健康检查

# 测试执行
./scripts/test.sh all coverage    # 运行所有测试
./scripts/test.sh frontend watch  # 前端监视模式
./scripts/test.sh report          # 生成测试报告

# 依赖管理
./scripts/deps.sh status       # 依赖状态
./scripts/deps.sh update all   # 更新依赖
./scripts/deps.sh audit        # 安全检查
```

## 🧪 测试

### 测试框架
- **前端**: Vitest + Testing Library + jsdom
- **后端**: Jest + Supertest
- **覆盖率**: 支持代码覆盖率报告
- **CI/CD**: GitHub Actions 自动化测试

### 运行测试

```bash
# 运行所有测试
./scripts/test.sh all

# 生成覆盖率报告
./scripts/test.sh all coverage

# 监视模式（开发时推荐）
./scripts/test.sh frontend watch
```

## 📊 监控与调试

### 健康检查

- **基础检查**: `/api/health` - 服务基本状态
- **详细检查**: `/api/health/detailed` - 包含依赖检查
- **就绪检查**: `/api/ready` - Kubernetes Readiness Probe
- **存活检查**: `/api/live` - Kubernetes Liveness Probe
- **系统信息**: `/api/info` - 详细系统信息
- **性能指标**: `/api/metrics` - 性能监控数据

### 日志系统

```
logs/
├── app.log              # 应用主日志
├── frontend.log         # 前端服务日志
├── backend.log          # 后端服务日志
└── nginx/              # Nginx 访问和错误日志
    ├── access.log
    └── error.log
```

### 调试工具

#### 前端调试
```javascript
// 浏览器控制台中使用
window.__ONECAR_DEBUG__.getLogs()      // 获取调试日志
window.__ONECAR_DEBUG__.exportLogs()   // 导出日志文件
window.__ONECAR_DEBUG__.getSystemInfo() // 系统信息
```

## 🐳 Docker 部署

### 快速部署

```bash
# 生产环境快速部署
docker-compose up -d

# 使用管理脚本
./scripts/docker.sh start production
```

### 多环境支持

- **开发环境**: `docker-compose.dev.yml` - 支持热重载
- **生产环境**: `docker-compose.yml` - 优化构建大小和安全配置

## ⚙️ 配置管理

### 环境变量

#### 前端配置
```bash
# frontend/.env.development
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_TITLE=OneCar 商品管理系统
VITE_ENABLE_DEBUG=true
```

#### 后端配置
```bash
# backend/.env.development  
NODE_ENV=development
PORT=3001
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=debug
```

## 🔐 安全

### 安全措施

- **JWT 认证**: Token-based 身份验证
- **CORS 配置**: 跨域请求控制
- **Helmet 中间件**: HTTP 头安全设置
- **速率限制**: API 调用频率控制
- **输入验证**: 请求数据验证和清理
- **文件上传安全**: 文件类型和大小限制

## 📈 性能优化

### 监控指标
- **首屏加载时间** < 2s
- **API 响应时间** < 200ms
- **错误率** < 1%
- **内存使用率** < 80%
- **CPU 使用率** < 70%

## 📚 文档

- **[部署指南](docs/DEPLOYMENT.md)** - 详细的部署和运维指南
- **API 文档** - 后端 API 接口文档
- **组件文档** - 前端组件使用说明

## 🐛 故障排除

### 常见问题

#### 端口冲突
```bash
# 检查端口占用
lsof -i :3000
lsof -i :3001

# 修改配置文件端口或终止占用进程
```

#### 依赖安装失败
```bash
# 清理缓存重新安装
./scripts/deps.sh clean all
./scripts/deps.sh install all
```

#### 服务启动失败
```bash
# 查看详细日志
./start.sh logs all

# 检查服务状态
./start.sh status

# 执行健康检查
./start.sh health
```

### 获取帮助

1. 查看日志文件：`logs/` 目录
2. 运行健康检查：`./start.sh health`
3. 生成诊断报告：`./scripts/env-check.sh`
4. 查看系统状态：`./start.sh status`

## 🤝 贡献

欢迎贡献代码！请查看贡献指南了解如何参与项目开发。

### 贡献流程
1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 创建 Pull Request
5. 代码审查
6. 合并代码

## 📄 许可证

本项目使用 [MIT 许可证](LICENSE)。

## 📞 联系我们

- **项目主页**: https://github.com/onecar/onecar
- **问题反馈**: https://github.com/onecar/onecar/issues
- **讨论区**: https://github.com/onecar/onecar/discussions

---

<div align="center">
  <p>如果这个项目对你有帮助，请给个 ⭐️ Star！</p>
  <p>Built with ❤️ by OneCar Team</p>
</div>