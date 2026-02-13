# 后端生产环境 Dockerfile
FROM node:18-alpine AS build

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    curl

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 生产环境镜像
FROM node:18-alpine

# 安装运行时依赖
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    curl \
    dumb-init

# 创建非特权用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# 创建上传目录
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs uploads logs

# 切换到非特权用户
USER nodejs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]