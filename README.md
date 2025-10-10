# 任务管理系统

一个基于 React + TypeScript + Ant Design 构建的现代化任务管理系统。

## 功能特性

### 核心功能
- ✅ **任务管理**：创建、编辑、查看、删除任务
- ✅ **多维度筛选**：支持关键词、状态、负责人、优先级、时间范围筛选
- ✅ **批量操作**：批量选择和删除任务
- ✅ **状态管理**：任务状态流转（待办→进行中→已完成→已取消）
- ✅ **优先级管理**：低、中、高、紧急四个优先级
- ✅ **负责人分配**：支持用户选择和分配
- ✅ **截止时间**：任务截止时间设置和过期提醒
- ✅ **标签系统**：灵活的任务标签管理

### 界面特性
- 🎨 **现代化UI**：基于 Ant Design 的美观界面
- 📱 **响应式设计**：支持桌面端和移动端
- 🔄 **实时更新**：状态变化实时反映
- 📊 **数据统计**：任务状态统计展示
- 🎯 **用户体验**：流畅的交互动画和反馈

### 技术特性
- ⚡ **性能优化**：防抖搜索、虚拟滚动
- 🛡️ **类型安全**：完整的 TypeScript 类型定义
- 🗄️ **状态管理**：Zustand 状态管理
- 🎪 **模拟数据**：内置模拟API服务

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **UI组件库**：Ant Design 5.x
- **状态管理**：Zustand
- **日期处理**：Day.js
- **图标**：Ant Design Icons

## 项目结构

```
src/
├── components/           # React 组件
│   ├── TaskCard.tsx             # 任务卡片组件
│   ├── TaskFilterSection.tsx   # 任务筛选区组件  
│   ├── TaskDetailModal.tsx     # 任务详情模态框
│   └── TaskManagementPage.tsx  # 主页面组件
├── services/            # 服务层
│   ├── mockData.ts             # 模拟数据
│   └── taskAPI.ts              # API服务
├── store/               # 状态管理
│   └── index.ts                # Zustand store
├── types/               # 类型定义
│   └── index.ts                # 数据模型和类型
├── utils/               # 工具函数
│   └── index.ts                # 通用工具函数
├── App.tsx              # 根组件
├── main.tsx             # 应用入口
└── index.css            # 全局样式
```

## 快速开始

### 环境要求
- Node.js >= 16
- npm 或 yarn 或 pnpm

### 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 启动开发服务器
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 http://localhost:3000 查看应用。

### 构建生产版本
```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

## 使用说明

### 基本操作

1. **创建任务**
   - 点击"新建任务"按钮或右下角浮动按钮
   - 填写任务信息：标题、描述、优先级、负责人、截止时间、标签
   - 点击"创建"保存任务

2. **查看任务**
   - 任务以卡片形式展示
   - 点击眼睛图标查看详细信息
   - 支持卡片视图和列表视图切换

3. **编辑任务**
   - 点击编辑图标修改任务信息
   - 可以更改状态、优先级、负责人等
   - 支持任务状态流转

4. **删除任务**
   - 单个删除：点击删除图标
   - 批量删除：勾选多个任务后点击批量删除

### 筛选功能

- **关键词搜索**：搜索任务标题和描述
- **状态筛选**：按任务状态筛选（待办、进行中、已完成、已取消）
- **负责人筛选**：按分配的负责人筛选
- **优先级筛选**：按优先级筛选（低、中、高、紧急）
- **时间范围**：按截止时间范围筛选
- **组合筛选**：支持多个筛选条件组合使用

### 批量操作

- 全选：勾选表头复选框选择当前页所有任务
- 单选：勾选任务卡片的复选框
- 批量删除：选择多个任务后批量删除

## 数据模型

### 任务模型
```typescript
interface Task {
  id: string;              // 任务ID
  title: string;           // 任务标题
  description?: string;    // 任务描述
  status: TaskStatus;      // 任务状态
  priority: TaskPriority;  // 优先级
  assignee?: User;         // 负责人
  dueDate?: string;        // 截止时间
  completedDate?: string;  // 完成时间
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
  tags?: string[];         // 标签
}
```

### 状态枚举
- `pending`: 待办
- `in_progress`: 进行中  
- `completed`: 已完成
- `cancelled`: 已取消

### 优先级枚举
- `low`: 低优先级
- `medium`: 中优先级
- `high`: 高优先级  
- `urgent`: 紧急

## 自定义和扩展

### 添加新的筛选条件
1. 在 `types/index.ts` 中扩展 `TaskFilters` 接口
2. 在 `TaskFilterSection.tsx` 中添加新的筛选控件
3. 在 `services/taskAPI.ts` 中添加筛选逻辑

### 自定义任务状态
1. 修改 `types/index.ts` 中的 `TaskStatus` 枚举
2. 更新 `statusConfig` 配置
3. 调整相关组件的状态展示

### 集成真实API
1. 替换 `services/taskAPI.ts` 中的模拟实现
2. 配置真实的API端点
3. 处理身份验证和错误处理

## 性能优化

- **防抖搜索**：搜索输入防抖，减少API调用
- **按需加载**：组件懒加载
- **虚拟滚动**：大量数据时的性能优化
- **状态优化**：精确的状态更新，避免不必要的重渲染

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 开发计划

- [ ] 任务拖拽排序
- [ ] 任务导入导出
- [ ] 任务模板
- [ ] 团队协作功能
- [ ] 移动端APP
- [ ] 数据可视化
- [ ] 消息通知
- [ ] 权限管理

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！