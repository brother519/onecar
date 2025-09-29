# 部署指南

## 生产环境部署

### 1. 构建项目

```bash
# 安装依赖（如果还未安装）
npm install

# 构建生产版本
npm run build
```

构建完成后，会在项目根目录生成 `dist` 文件夹，包含所有静态资源。

### 2. 静态文件服务器部署

#### 方案一：使用 Nginx

1. **安装 Nginx**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

2. **配置 Nginx**
创建配置文件 `/etc/nginx/sites-available/task-manager`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    root /path/to/your/project/dist;  # 替换为实际路径
    index index.html;

    # 处理前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

3. **启用配置**
```bash
sudo ln -s /etc/nginx/sites-available/task-manager /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl reload nginx
```

#### 方案二：使用 Apache

1. **创建虚拟主机配置**
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/your/project/dist
    
    # 处理前端路由
    <Directory "/path/to/your/project/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # 重写规则处理 SPA 路由
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # 静态资源缓存
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </LocationMatch>
</VirtualHost>
```

### 3. Docker 部署

创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

构建和运行 Docker 容器：

```bash
# 构建镜像
docker build -t task-manager .

# 运行容器
docker run -d -p 80:80 --name task-manager-app task-manager
```

### 4. CDN 部署

#### 部署到 Vercel

1. **安装 Vercel CLI**
```bash
npm install -g vercel
```

2. **部署**
```bash
vercel --prod
```

#### 部署到 Netlify

1. **构建项目**
```bash
npm run build
```

2. **拖拽部署**
   - 访问 [Netlify](https://netlify.com)
   - 将 `dist` 文件夹拖拽到部署区域

#### 部署到 GitHub Pages

1. **安装 gh-pages**
```bash
npm install --save-dev gh-pages
```

2. **添加部署脚本到 package.json**
```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

3. **部署**
```bash
npm run build
npm run deploy
```

## 环境变量配置

创建 `.env.production` 文件：

```env
# API 基础 URL
VITE_API_BASE_URL=https://api.your-domain.com

# 应用标题
VITE_APP_TITLE=任务管理系统

# 是否启用调试模式
VITE_DEBUG=false
```

## 性能优化

### 1. 代码分割

项目已配置 Vite 自动代码分割，可以进一步优化：

```typescript
// 懒加载组件
const TaskManager = lazy(() => import('./pages/TaskManager'));

// 在 App.tsx 中使用
<Suspense fallback={<div>Loading...</div>}>
  <TaskManager />
</Suspense>
```

### 2. 资源压缩

确保服务器启用 Gzip 压缩：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json;
```

### 3. 缓存策略

设置合适的缓存头：

```nginx
# 对于带版本号的静态资源
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 对于 HTML 文件
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

## 监控和维护

### 1. 日志监控

配置 Nginx 访问日志：

```nginx
access_log /var/log/nginx/task-manager.access.log;
error_log /var/log/nginx/task-manager.error.log;
```

### 2. 健康检查

创建健康检查端点：

```nginx
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

### 3. 自动更新

使用 PM2 进行进程管理（如果需要后端服务）：

```bash
npm install -g pm2
pm2 start npm --name "task-manager" -- start
pm2 startup
pm2 save
```

## 安全配置

### 1. HTTPS 配置

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 2. 安全头设置

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 故障排除

### 常见问题

1. **404 错误**：确保服务器配置了 SPA 路由回退到 index.html
2. **静态资源加载失败**：检查资源路径和权限
3. **构建失败**：检查 Node.js 版本和依赖

### 回滚策略

保持多个版本的构建产物：

```bash
# 备份当前版本
cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)

# 部署新版本
npm run build
```

这样可以在出现问题时快速回滚到之前的版本。