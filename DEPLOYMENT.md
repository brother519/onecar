# OneCar 商品管理系统 - 部署与运维指南

## 📖 概述

本文档提供 OneCar 商品管理系统的完整部署指南，包括开发环境搭建、生产部署、故障排除和性能优化。

## 🔧 系统要求

### 硬件要求
| 环境 | CPU | 内存 | 存储 | 网络 |
|------|-----|------|------|------|
| 开发 | 2核+ | 4GB+ | 10GB+ | 1Mbps+ |
| 测试 | 2核+ | 8GB+ | 20GB+ | 10Mbps+ |
| 生产 | 4核+ | 16GB+ | 100GB+ | 100Mbps+ |

### 软件要求
- **Node.js**: >= 16.0.0（推荐 18.x LTS）
- **npm**: >= 8.0.0（推荐 9.x）
- **Docker**: >= 20.10.0（可选）
- **Docker Compose**: >= 2.0.0（可选）

## 🚀 快速开始

### 1. 环境准备

```bash
# 1. 克隆项目
git clone <repository-url>
cd onecar

# 2. 检查系统要求
node --version  # 应显示 v16.0.0 或更高版本
npm --version   # 应显示 8.0.0 或更高版本

# 3. 设置执行权限
chmod +x start.sh
```

### 2. 使用启动脚本（推荐）

```bash
# 启动所有服务（前端 + 后端）
./start.sh

# 或者分别启动
./start.sh backend   # 仅启动后端
./start.sh frontend  # 仅启动前端

# 查看服务状态
./start.sh status

# 停止所有服务
./start.sh stop
```

### 3. 手动启动

如果启动脚本无法工作，可以手动启动：

```bash
# 启动后端
cd backend
npm install
npm run dev

# 新开终端，启动前端
cd frontend
npm install
npm run dev
```

### 4. 访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001/api
- **API文档**: http://localhost:3001/api
- **健康检查**: http://localhost:3001/api/health

## 🐳 容器化部署

### Docker Compose 部署（推荐）

```bash
# 1. 构建并启动所有服务
docker-compose up -d

# 2. 查看服务状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

### 分别构建 Docker 镜像

```bash
# 构建前端镜像
cd frontend
docker build -t onecar-frontend .

# 构建后端镜像
cd backend
docker build -t onecar-backend .

# 运行容器
docker run -d -p 3000:80 --name onecar-frontend onecar-frontend
docker run -d -p 3001:3001 --name onecar-backend onecar-backend
```

## ⚙️ 环境配置

### 前端环境变量

在 `frontend/.env` 中配置：

```bash
# API 地址
VITE_API_BASE_URL=http://localhost:3001/api

# 应用配置
VITE_APP_TITLE=OneCar 商品管理系统
VITE_APP_VERSION=1.0.0

# 功能开关
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK=false

# 性能配置
VITE_VIRTUAL_SCROLL_ITEM_SIZE=80
VITE_INFINITE_SCROLL_THRESHOLD=200
```

### 后端环境变量

在 `backend/.env` 中配置：

```bash
# 基础配置
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# 安全配置
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGINS=http://localhost:3000

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_DESTINATION=./uploads

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🌍 生产部署

### 1. 生产环境配置

```bash
# 复制生产环境配置
cp frontend/.env.production frontend/.env
cp backend/.env.production backend/.env

# 编辑配置文件，设置正确的域名和密钥
nano frontend/.env
nano backend/.env
```

### 2. 构建生产版本

```bash
# 构建前端
cd frontend
npm run build

# 验证构建产物
ls -la dist/

# 预览构建结果
npm run preview
```

### 3. 使用 Nginx 代理

```bash
# 安装 Nginx
sudo apt update
sudo apt install nginx

# 复制配置文件
sudo cp nginx.conf /etc/nginx/nginx.conf

# 验证配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 4. SSL/HTTPS 配置

```bash
# 使用 Let's Encrypt 获取 SSL 证书
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔍 故障排除

### 常见问题诊断

#### 1. 服务启动失败

```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :3001

# 检查 Node.js 版本
node --version

# 检查依赖安装
cd frontend && npm list
cd backend && npm list
```

#### 2. API 请求失败

```bash
# 测试后端健康检查
curl http://localhost:3001/api/health

# 测试 API 端点
curl http://localhost:3001/api

# 检查 CORS 配置
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:3001/api/health
```

#### 3. 前端加载失败

```bash
# 检查前端构建
cd frontend && npm run build

# 检查环境变量
echo $VITE_API_BASE_URL

# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 日志查看

```bash
# Docker 容器日志
docker-compose logs -f frontend
docker-compose logs -f backend

# 系统服务日志
sudo journalctl -u nginx -f
sudo journalctl -u docker -f

# 应用日志（如果配置了文件日志）
tail -f backend/logs/app.log
tail -f /var/log/nginx/access.log
```

### 性能监控

```bash
# 系统资源监控
htop
iotop
nethogs

# Docker 资源监控
docker stats

# Nginx 状态
curl http://localhost/nginx_status
```

## 📊 性能优化

### 前端优化

1. **代码分割和懒加载**
   ```typescript
   // 路由懒加载
   const ProductList = lazy(() => import('./pages/ProductList'));
   
   // 组件懒加载
   const Chart = lazy(() => import('./components/Chart'));
   ```

2. **静态资源优化**
   ```javascript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           chunkFileNames: 'assets/js/[name]-[hash].js',
           entryFileNames: 'assets/js/[name]-[hash].js',
           assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
         }
       }
     }
   });
   ```

### 后端优化

1. **启用压缩**
   ```javascript
   import compression from 'compression';
   app.use(compression());
   ```

2. **缓存配置**
   ```javascript
   // 静态文件缓存
   app.use(express.static('uploads', {
     maxAge: '1y',
     etag: true,
   }));
   ```

3. **数据库连接池**（如果使用数据库）
   ```javascript
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

### Nginx 优化

```nginx
# gzip 压缩
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

# 缓存配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 连接优化
keepalive_timeout 65;
keepalive_requests 100;
```

## 🔒 安全配置

### 1. 环境变量安全

```bash
# 生产环境必须更改的密钥
JWT_SECRET=<生成强随机密钥>
CAPTCHA_SECRET=<生成强随机密钥>

# 密钥生成示例
openssl rand -base64 32
```

### 2. 防火墙配置

```bash
# UFW 防火墙配置
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # 禁止直接访问前端
sudo ufw deny 3001/tcp   # 禁止直接访问后端
```

### 3. Nginx 安全头

```nginx
# 安全头配置
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

## 📈 监控和维护

### 1. 健康检查

系统提供多个健康检查端点：

```bash
# 整体健康状态
curl http://localhost:3001/api/health

# Nginx 状态
curl http://localhost/health

# 服务可用性检查
curl -f http://localhost:3000/ || echo "Frontend down"
curl -f http://localhost:3001/api/health || echo "Backend down"
```

### 2. 日志轮转

```bash
# 配置 logrotate
sudo nano /etc/logrotate.d/onecar

# 内容：
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        systemctl reload nginx
    endscript
}
```

### 3. 自动化监控脚本

```bash
#!/bin/bash
# 创建 /usr/local/bin/onecar-monitor.sh

# 检查服务状态
check_service() {
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        echo "$(date): Backend OK"
    else
        echo "$(date): Backend DOWN" >&2
        # 这里可以添加告警逻辑
    fi
}

# 每分钟检查一次
while true; do
    check_service
    sleep 60
done
```

## 🔄 备份和恢复

### 1. 数据备份

```bash
# 备份上传文件
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz backend/uploads/

# 备份配置文件
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
    frontend/.env \
    backend/.env \
    nginx.conf \
    docker-compose.yml
```

### 2. 恢复流程

```bash
# 停止服务
./start.sh stop
# 或 docker-compose down

# 恢复文件
tar -xzf uploads-backup-YYYYMMDD.tar.gz
tar -xzf config-backup-YYYYMMDD.tar.gz

# 重新启动服务
./start.sh
# 或 docker-compose up -d
```

## 📞 技术支持

### 获取帮助

1. **查看文档**: README.md 和相关文档
2. **查看日志**: 使用上述日志查看命令
3. **社区支持**: 提交 Issue 到项目仓库
4. **专业支持**: 联系开发团队

### 常用命令快速参考

```bash
# 服务管理
./start.sh           # 启动所有服务
./start.sh stop      # 停止所有服务
./start.sh status    # 查看服务状态

# Docker 管理
docker-compose up -d    # 启动容器
docker-compose ps       # 查看容器状态
docker-compose logs -f  # 查看日志

# 诊断工具
curl http://localhost:3001/api/health  # 后端健康检查
npm run test                           # 运行测试
npm audit                             # 安全审计
```

---

**文档版本**: v1.0.0  
**最后更新**: 2025-09-25  
**维护团队**: OneCar 开发团队