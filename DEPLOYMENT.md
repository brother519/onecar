# 任务管理系统 - 部署指南

## 本地开发部署

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 步骤

1. **安装依赖**
```bash
npm install
# 或
yarn install
```

2. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

3. **访问应用**
打开浏览器访问: http://localhost:3000

## 生产环境部署

### 构建应用

```bash
npm run build
# 或
yarn build
```

构建产物将生成在 `dist` 目录中。

### 部署选项

#### 选项1: 静态文件服务器
将 `dist` 目录部署到任何静态文件服务器:
- Nginx
- Apache
- Caddy
- 其他静态托管服务

#### 选项2: Vercel 部署
```bash
npm install -g vercel
vercel --prod
```

#### 选项3: Netlify 部署
1. 将项目推送到 Git 仓库
2. 在 Netlify 中连接仓库
3. 构建命令: `npm run build`
4. 发布目录: `dist`

#### 选项4: Docker 部署

创建 `Dockerfile`:
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建和运行:
```bash
docker build -t onecar-task-manager .
docker run -p 80:80 onecar-task-manager
```

## 配置说明

### 修改端口
编辑 `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000, // 修改为你需要的端口
  }
})
```

### 修改基础路径
如果部署到子路径,修改 `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/your-sub-path/', // 例如 '/tasks/'
})
```

## 注意事项

1. **数据存储**: 当前版本使用 LocalStorage,数据仅存储在客户端浏览器中
2. **浏览器兼容**: 确保目标用户使用现代浏览器
3. **HTTPS**: 生产环境建议使用 HTTPS
4. **备份**: 定期提醒用户导出数据(未来功能)

## 性能优化建议

1. **启用 Gzip 压缩** (Nginx配置示例):
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

2. **设置缓存策略**:
```nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

3. **启用 HTTP/2**

## 故障排查

### 构建失败
- 检查 Node.js 版本
- 删除 `node_modules` 和 `package-lock.json`,重新安装依赖
- 检查磁盘空间

### 应用无法启动
- 检查端口是否被占用
- 查看浏览器控制台错误信息
- 检查 LocalStorage 配额

### 数据丢失
- LocalStorage 数据可能被浏览器清理
- 建议实现数据导出/导入功能(未来版本)
