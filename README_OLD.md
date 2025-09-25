# OneCar 商品后台管理系统

这是一个功能丰富的商品后台管理系统，基于设计文档实现，包含拖拽排序、虚拟滚动、无限滚动、验证码输入、代码编辑器、水印、二维码等核心功能模块。

## 🚀 技术栈

### 前端
- **框架**: React 18 + TypeScript + Vite
- **状态管理**: Zustand
- **UI组件**: Ant Design
- **拖拽**: @dnd-kit
- **虚拟滚动**: react-window
- **代码编辑器**: Monaco Editor
- **图形处理**: Fabric.js + QRCode.js
- **HTTP客户端**: Axios

### 后端
- **框架**: Express.js + Node.js
- **安全**: Helmet + CORS + Rate Limiting
- **文件处理**: Multer + Sharp
- **验证码**: Canvas + Crypto
- **身份认证**: JWT

## 📁 项目结构

```
onecar/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/       # 核心组件
│   │   │   ├── DragDropManager/      # 拖拽排序
│   │   │   ├── VirtualScrollContainer/ # 虚拟滚动
│   │   │   ├── InfiniteScrollLoader/  # 无限滚动
│   │   │   ├── CaptchaInput/          # 验证码
│   │   │   ├── CodeEditor/            # 代码编辑器
│   │   │   ├── WatermarkManager/      # 水印管理
│   │   │   ├── QRCodeGenerator/       # 二维码生成
│   │   │   └── Layout/                # 布局组件
│   │   ├── pages/            # 页面组件
│   │   ├── store/            # 状态管理
│   │   ├── services/         # API服务
│   │   ├── types/            # TypeScript类型
│   │   └── styles/           # 样式文件
│   ├── package.json
│   └── vite.config.ts
└── backend/                  # 后端项目
    ├── src/
    │   ├── routes/           # 路由
    │   ├── middleware/       # 中间件
    │   └── config/           # 配置
    ├── package.json
    └── app.js
```

## 🎯 核心功能

### 1. 拖拽排序组件 (DragDropManager)
- ✅ 支持商品项目的拖拽移动
- ✅ 实时更新排序位置
- ✅ 提供视觉反馈和拖拽预览
- ✅ 支持触摸设备操作

### 2. 虚拟滚动组件 (VirtualScrollContainer)
- ✅ 仅渲染可视区域内的商品项
- ✅ 动态计算滚动位置和项目高度
- ✅ 支持不同高度的商品项渲染
- ✅ 维护滚动位置状态

### 3. 无限滚动组件 (InfiniteScrollLoader)
- ✅ 监听滚动事件触发数据加载
- ✅ 管理加载状态和错误处理
- ✅ 防抖和节流优化
- ✅ 自动重试机制

### 4. 验证码输入组件 (CaptchaInput)
- ✅ 生成和验证图形验证码
- ✅ 支持音频验证码（可访问性）
- ✅ 验证码刷新和重新生成
- ✅ 安全验证机制

### 5. 代码编辑器组件 (CodeEditor)
- ✅ 语法高亮和自动补全
- ✅ 支持多种代码格式（JSON、HTML、Markdown）
- ✅ 实时预览和格式验证
- ✅ 代码美化和格式化

### 6. 水印管理组件 (WatermarkManager)
- ✅ 文字和图片水印支持
- ✅ 水印位置和透明度调节
- ✅ 批量水印处理
- ✅ 水印模板管理

### 7. 二维码生成组件 (QRCodeGenerator)
- ✅ 商品链接二维码生成
- ✅ 自定义二维码样式和尺寸
- ✅ 批量二维码生成
- ✅ 二维码导出和下载

## 🛠 安装和运行

### 前提条件
- Node.js >= 16.0.0
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd onecar
```

### 2. 安装依赖

**前端依赖安装**
```bash
cd frontend
npm install
```

**后端依赖安装**
```bash
cd backend
npm install
```

### 3. 环境配置

**前端环境变量** (frontend/.env)
```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_TITLE=OneCar 商品管理系统
VITE_ENABLE_DEBUG=true
```

**后端环境变量** (backend/.env)
```bash
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. 启动项目

**启动后端服务**
```bash
cd backend
npm run dev
```
后端将在 http://localhost:3001 启动

**启动前端服务**
```bash
cd frontend
npm run dev
```
前端将在 http://localhost:3000 启动

### 5. 访问应用
打开浏览器访问：http://localhost:3000

## 📊 API 接口

### 商品管理
- `GET /api/products` - 获取商品列表
- `POST /api/products` - 创建商品
- `PUT /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 删除商品
- `PUT /api/products/sort` - 更新排序
- `POST /api/products/batch` - 批量操作

### 验证码
- `GET /api/captcha` - 获取验证码
- `POST /api/captcha/verify` - 验证验证码

### 文件上传
- `POST /api/upload` - 上传文件
- `POST /api/upload/batch` - 批量上传

### 水印和二维码
- `POST /api/watermark` - 添加水印
- `POST /api/qrcode` - 生成二维码

## 🎨 设计系统

项目采用统一的设计系统，包含：

### 颜色主题
- 主品牌色：#1890ff
- 成功状态：#52c41a  
- 警告状态：#faad14
- 错误状态：#ff4d4f
- 中性色：#8c8c8c

### 字体规范
- 大标题：24px/32px
- 中标题：18px/24px
- 正文：14px/20px
- 辅助文本：12px/18px

### 间距系统
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px

## 🧪 开发工具

### 脚本命令

**前端**
```bash
npm run dev      # 开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
npm run lint     # 代码检查
npm run test     # 运行测试
```

**后端**
```bash
npm run dev      # 开发服务器
npm start        # 生产环境启动
npm test         # 运行测试
```

### 开发建议

1. **组件开发**: 每个组件都有完整的 TypeScript 类型定义
2. **状态管理**: 使用 Zustand 进行状态管理，支持持久化
3. **API调用**: 统一的 API 层，包含错误处理和拦截器
4. **样式规范**: 遵循设计系统的颜色和间距规范
5. **性能优化**: 组件懒加载、虚拟滚动等性能优化措施

## 🔧 故障排除

### 常见问题

1. **端口冲突**: 修改 `.env` 文件中的端口配置
2. **依赖安装失败**: 删除 `node_modules` 和 `package-lock.json` 重新安装
3. **API请求失败**: 检查后端服务是否启动，确认 API 地址配置

### 联系支持
如遇到问题，请提交 Issue 或联系开发团队。

## 📝 许可证
MIT License

---

**项目状态**: 🚧 开发中

**版本**: v1.0.0

**最后更新**: 2025-09-23