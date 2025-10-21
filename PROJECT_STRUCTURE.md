# 项目文件结构总览

## 📁 完整目录结构

```
onecar/
├── 📄 配置文件
│   ├── package.json              # 项目依赖和脚本配置
│   ├── tsconfig.json             # TypeScript 配置
│   ├── tsconfig.node.json        # Node.js TypeScript 配置
│   ├── vite.config.ts            # Vite 构建配置
│   └── .gitignore                # Git 忽略文件配置
│
├── 📄 文档文件
│   ├── README.md                 # 项目主文档
│   ├── QUICKSTART.md             # 快速开始指南
│   ├── DEPLOYMENT.md             # 部署指南
│   └── PROJECT_STRUCTURE.md      # 本文件
│
├── 🚀 启动脚本
│   ├── start.sh                  # Linux/Mac 启动脚本
│   └── start.bat                 # Windows 启动脚本
│
├── 🌐 入口文件
│   └── index.html                # HTML 入口模板
│
└── 📁 src/                       # 源代码目录
    ├── 📄 main.tsx               # 应用入口文件
    ├── 📄 App.tsx                # 主应用组件
    ├── 📄 App.css                # 应用样式
    ├── 📄 index.css              # 全局样式
    ├── 📄 vite-env.d.ts          # Vite 类型定义
    │
    ├── 📁 components/            # React 组件
    │   ├── TaskFilter.tsx            # 任务筛选组件
    │   ├── TaskList.tsx              # 任务列表组件
    │   ├── TaskFormModal.tsx         # 任务创建表单弹窗
    │   ├── TaskDetailModal.tsx       # 任务详情弹窗
    │   └── FloatingActionButton.tsx  # 悬浮操作按钮
    │
    ├── 📁 services/              # 业务服务层
    │   └── taskService.ts            # 任务数据服务
    │
    └── 📁 types/                 # TypeScript 类型定义
        └── task.ts                   # 任务相关类型
```

## 📊 文件说明

### 核心业务文件

#### `/src/types/task.ts` (138 行)
- 定义任务数据结构
- 定义枚举类型 (状态、优先级)
- 定义接口 (Task, Assignee, FilterConditions, TaskFormData)
- 提供工具函数 (获取显示文本、颜色等)

#### `/src/services/taskService.ts` (304 行)
- 任务 CRUD 操作
- 本地存储管理 (LocalStorage)
- 任务筛选逻辑
- 数据初始化和示例数据

### UI 组件文件

#### `/src/components/TaskFilter.tsx` (79 行)
- 关键词搜索框
- 状态下拉选择器
- 优先级下拉选择器
- 负责人多选下拉框

#### `/src/components/TaskList.tsx` (102 行)
- 任务列表渲染
- 任务项展示 (标题、描述、状态、优先级、负责人、时间)
- 悬停效果
- 空状态展示

#### `/src/components/TaskFormModal.tsx` (160 行)
- 创建任务表单
- 表单验证规则
- 字段: 标题、描述、负责人、优先级、完成时间

#### `/src/components/TaskDetailModal.tsx` (213 行)
- 任务详情展示
- 编辑模式切换
- 可修改字段: 负责人、优先级
- 只读字段: 标题、描述、状态、完成时间

#### `/src/components/FloatingActionButton.tsx` (116 行)
- 悬浮操作按钮组
- 创建任务按钮
- 删除任务按钮 (含确认)
- 归档任务按钮 (含确认)
- 取消归档按钮 (含确认)

### 主应用文件

#### `/src/App.tsx` (211 行)
- 状态管理 (任务列表、筛选条件、选中任务)
- 视图切换 (活动任务 / 归档任务)
- 组件整合和事件处理
- 业务逻辑协调

#### `/src/main.tsx` (28 行)
- React 应用初始化
- Ant Design 配置 (中文化、主题)
- Day.js 配置 (中文化)

### 样式文件

#### `/src/index.css` (94 行)
- 全局样式重置
- 滚动条样式
- Ant Design 组件样式微调
- 响应式布局

#### `/src/App.css` (9 行)
- 任务列表项悬停效果
- 过渡动画

## 📦 依赖说明

### 核心依赖
- `react` & `react-dom`: React 框架
- `antd`: Ant Design UI 组件库
- `dayjs`: 日期处理库

### 开发依赖
- `vite`: 构建工具
- `typescript`: TypeScript 编译器
- `@vitejs/plugin-react`: Vite React 插件
- `eslint`: 代码检查工具

## 🎯 代码统计

| 类型 | 文件数 | 总行数 (约) |
|------|--------|------------|
| TypeScript/TSX | 12 | 1,450 |
| CSS | 2 | 103 |
| JSON | 3 | 67 |
| HTML | 1 | 14 |
| Markdown | 4 | 448 |
| Shell/Batch | 2 | 121 |
| **总计** | **24** | **2,203** |

## 🔧 扩展指南

### 添加新组件
1. 在 `src/components/` 创建新组件文件
2. 定义组件接口 (Props)
3. 实现组件逻辑
4. 在 `App.tsx` 中引入并使用

### 添加新类型
1. 在 `src/types/task.ts` 中定义新类型
2. 或创建新的类型文件 `src/types/yourType.ts`

### 添加新服务
1. 在 `src/services/` 创建服务文件
2. 定义服务类和方法
3. 导出服务实例

### 修改样式
- 全局样式: 编辑 `src/index.css`
- 组件样式: 编辑 `src/App.css` 或创建组件专属 CSS
- Ant Design 主题: 修改 `src/main.tsx` 中的 theme 配置

## 📝 代码规范

### 命名约定
- 组件文件: PascalCase (如 `TaskList.tsx`)
- 工具文件: camelCase (如 `taskService.ts`)
- 类型文件: camelCase (如 `task.ts`)
- 组件名: PascalCase
- 变量/函数: camelCase
- 常量: UPPER_SNAKE_CASE
- 接口: PascalCase

### 文件组织
- 一个文件一个主组件
- 相关类型定义放在 `types/` 目录
- 业务逻辑放在 `services/` 目录
- UI 组件放在 `components/` 目录

### 注释规范
- 文件头部注释说明文件用途
- 复杂函数添加 JSDoc 注释
- 关键业务逻辑添加行内注释

## 🚀 性能优化

### 已实现
- ✅ 组件化设计,复用性高
- ✅ React Hooks 优化状态管理
- ✅ 列表项悬停效果使用 CSS 过渡
- ✅ LocalStorage 缓存数据

### 可优化
- ⏳ 虚拟滚动 (处理大量任务)
- ⏳ 防抖搜索输入
- ⏳ 懒加载组件
- ⏳ 图片压缩和 CDN

## 📚 学习资源

- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/
- Ant Design: https://ant.design/
- Vite: https://vitejs.dev/
- Day.js: https://day.js.org/
