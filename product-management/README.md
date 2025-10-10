# 商品后台管理系统

一个功能丰富的商品后台管理系统，集成了现代化的前端技术栈和高级交互功能。

## ✨ 功能特性

### 🎯 核心功能
- **商品管理**: 完整的商品CRUD操作
- **拖拽排序**: 支持商品列表拖拽重新排序
- **虚拟滚动**: 优化大数据量的渲染性能
- **无限滚动**: 自动加载更多商品数据
- **批量操作**: 支持批量删除、上架、下架等操作

### 🔒 安全功能
- **验证码**: 图形验证码和安全验证
- **水印保护**: 页面防篡改水印组件
- **权限控制**: 基于角色的访问控制

### 🛠 高级功能
- **代码编辑器**: 集成Monaco Editor，支持多语言代码编辑
- **二维码生成**: 商品信息二维码生成和解析
- **响应式设计**: 适配移动端、平板和桌面设备
- **主题定制**: 支持明暗主题切换

## 🚀 技术栈

### 前端技术
- **React 18**: 主要UI框架
- **Redux Toolkit**: 状态管理
- **React Router**: 路由管理
- **Ant Design**: UI组件库

### 高级功能库
- **React DnD**: 拖拽功能实现
- **React Window**: 虚拟滚动优化
- **Monaco Editor**: 代码编辑器
- **QRCode.js**: 二维码生成

### 开发工具
- **Vite**: 构建工具
- **ESLint**: 代码检查
- **自定义测试框架**: 集成测试

## 📦 项目结构

```
product-management/
├── public/
│   └── index.html
├── src/
│   ├── api/              # API接口层
│   │   ├── index.js      # Axios配置
│   │   └── productAPI.js # 商品API
│   ├── components/       # 组件目录
│   │   ├── Captcha/      # 验证码组件
│   │   ├── CodeEditor/   # 代码编辑器
│   │   ├── Layout/       # 布局组件
│   │   ├── Optimization/ # 性能优化组件
│   │   ├── ProductList/  # 商品列表
│   │   ├── QRCode/       # 二维码组件
│   │   └── Watermark/    # 水印组件
│   ├── hooks/            # 自定义Hooks
│   ├── pages/            # 页面组件
│   │   ├── ProductListPage.jsx
│   │   ├── ProductEditPage.jsx
│   │   ├── ProductCodePage.jsx
│   │   └── BatchOperationPage.jsx
│   ├── store/            # Redux状态管理
│   │   ├── index.js      # Store配置
│   │   └── slices/       # Redux切片
│   ├── tests/            # 测试文件
│   ├── utils/            # 工具函数
│   ├── App.jsx           # 主应用组件
│   ├── main.jsx          # 入口文件
│   └── index.css         # 全局样式
├── package.json          # 依赖配置
├── vite.config.js        # Vite配置
└── README.md             # 项目文档
```

## 🔧 安装和运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 运行开发服务器
```bash
# 使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

项目将在 `http://localhost:3000` 启动

### 构建生产版本
```bash
# 使用 npm
npm run build

# 或使用 yarn
yarn build
```

### 运行测试
```bash
# 在浏览器控制台运行
runTests()
```

## 💻 主要功能说明

### 拖拽排序
- 支持商品列表项的拖拽重新排序
- 实时视觉反馈和拖拽指示器
- 乐观更新本地状态，同步服务器

### 虚拟滚动
- 只渲染可视区域的项目，优化性能
- 支持大数据量（1000+项目）流畅滚动
- 智能预加载缓冲区

### 无限滚动
- 滚动到底部自动加载更多数据
- 防重复加载机制
- 加载状态指示器

### 验证码组件
- 图形验证码生成
- 干扰线和干扰点
- 错误重试限制和锁定机制

### 代码编辑器
- 支持多种编程语言（JavaScript、JSON、CSS等）
- 语法高亮和自动补全
- 代码格式化和搜索替换
- 全屏编辑模式

### 水印保护
- 动态生成Canvas水印
- 防删除和防修改保护
- DOM变化监听和自动恢复

### 二维码功能
- 支持多种数据类型编码
- 可配置尺寸、颜色和纠错级别
- 批量生成和导出功能

## 🎨 样式和主题

### 响应式设计
- 移动端适配（< 768px）
- 平板适配（768px - 1200px）
- 桌面端适配（> 1200px）

### 主题配置
```javascript
// 主题配置示例
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
}
```

## 🔍 性能优化

### 代码分割
- 路由级代码分割
- 组件懒加载
- 第三方库分包

### 渲染优化
- React.memo 组件缓存
- useMemo 和 useCallback 优化
- 虚拟滚动减少DOM节点

### 网络优化
- API请求防抖
- 图片懒加载
- 资源预加载

## 🧪 测试策略

### 单元测试
- 工具函数测试
- 组件逻辑测试
- Redux状态测试

### 集成测试
- 用户交互流程测试
- API集成测试
- 性能基准测试

## 📱 浏览器支持

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## 🤝 贡献指南

### 开发流程
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循 React Hooks 最佳实践
- 组件使用 JSDoc 注释
- 提交信息使用约定式提交格式

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

- [React 官方文档](https://reactjs.org/)
- [Ant Design 组件库](https://ant.design/)
- [Redux Toolkit 文档](https://redux-toolkit.js.org/)
- [Vite 构建工具](https://vitejs.dev/)

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索 [Issues](../../issues)
3. 创建新的 [Issue](../../issues/new)

---

⭐️ 如果这个项目对您有帮助，请给我们一个星标！