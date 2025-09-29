# 安装和运行指南

## 前置条件

在开始之前，请确保您的系统已安装以下软件：

### 1. 安装 Node.js
```bash
# Ubuntu/Debian 系统
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或者使用 snap
sudo snap install node --classic

# CentOS/RHEL 系统
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# macOS 系统 (使用 Homebrew)
brew install node

# Windows 系统
# 下载并安装 Node.js 安装包: https://nodejs.org/
```

### 2. 验证安装
```bash
node --version   # 应该显示 v16.0.0 或更高版本
npm --version    # 应该显示 8.0.0 或更高版本
```

## 项目安装步骤

### 1. 进入项目目录
```bash
cd /data/workspace/onecar
```

### 2. 安装项目依赖
```bash
npm install
```

安装过程中将下载以下主要依赖：

**核心依赖：**
- `react@^18.2.0` - React 框架
- `react-dom@^18.2.0` - React DOM 渲染
- `antd@^5.12.8` - Ant Design UI 组件库
- `dayjs@^1.11.10` - 日期处理库
- `@ant-design/icons@^5.2.6` - Ant Design 图标库
- `react-router-dom@^6.20.1` - React 路由

**开发依赖：**
- `typescript@^5.2.2` - TypeScript 编译器
- `@vitejs/plugin-react@^4.1.1` - Vite React 插件
- `vite@^5.0.0` - 构建工具
- `eslint@^8.53.0` - 代码检查工具

### 3. 启动开发服务器
```bash
npm run dev
```

成功启动后，您将看到类似以下输出：
```
  VITE v5.0.0  ready in 324 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 4. 访问应用
在浏览器中打开 `http://localhost:3000` 即可查看任务管理系统。

## 常用命令

```bash
# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```

## 故障排除

### 依赖安装失败
如果 `npm install` 失败，尝试以下解决方案：

1. **清理缓存**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. **使用 yarn 替代**
```bash
npm install -g yarn
yarn install
yarn dev
```

3. **使用国内镜像**
```bash
npm install --registry=https://registry.npmmirror.com
```

### 端口占用问题
如果 3000 端口被占用，Vite 会自动选择下一个可用端口（如 3001）。

也可以手动指定端口：
```bash
npm run dev -- --port 3001
```

### TypeScript 编译错误
如果遇到 TypeScript 编译错误，请检查：
1. Node.js 版本是否 >= 16.0.0
2. 依赖是否完全安装
3. 运行 `npm run build` 检查具体错误

## 项目特性验证

启动成功后，您可以验证以下功能：

1. **任务管理**：创建、编辑、删除任务
2. **状态管理**：切换任务状态（待开始、进行中、已完成、已取消）
3. **筛选功能**：按状态、优先级、负责人筛选任务
4. **搜索功能**：在任务标题和描述中搜索关键词
5. **批量操作**：选择多个任务进行批量删除或状态更新
6. **响应式设计**：在不同屏幕尺寸下测试界面适配

## 技术支持

如果遇到问题，请检查：
1. Node.js 和 npm 版本是否符合要求
2. 网络连接是否正常（依赖下载需要网络）
3. 系统权限是否足够（可能需要管理员权限）

更多帮助信息请参考项目 README.md 文件。