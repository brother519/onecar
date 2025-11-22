# 系统架构文档

## 系统架构概览

任务管理系统采用分层架构设计，各层职责清晰，易于维护和扩展。

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                     App.tsx                          │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │           TaskManager 主页面               │   │   │
│  │  │                                             │   │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │   │
│  │  │  │SearchFilter│TaskList  │TaskForm  │  │   │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘  │   │   │
│  │  │  ┌──────────┐                            │   │   │
│  │  │  │FloatingBtn│                            │   │   │
│  │  │  └──────────┘                            │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       服务层 (Services)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  taskService.ts                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │ • getTaskList()                              │  │   │
│  │  │ • createTask()                               │  │   │
│  │  │ • updateTask()                               │  │   │
│  │  │ • deleteTask()                               │  │   │
│  │  │ • batchDeleteTasks()                         │  │   │
│  │  │ • batchUpdateTaskStatus()                    │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     类型定义层 (Types)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    task.ts                           │   │
│  │  • Task                • TaskStatus                  │   │
│  │  • TaskPriority        • TaskFilters                 │   │
│  │  • Pagination          • ApiResponse                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      样式层 (Styles)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  index.css                           │   │
│  │  • 全局样式      • 响应式布局                        │   │
│  │  • 主题定制      • 动画效果                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 数据流设计

### 任务加载流程

```
用户访问页面
    ↓
TaskManager.useEffect()
    ↓
loadTasks()
    ↓
taskService.getTaskList()
    ↓
模拟API延迟 (500ms)
    ↓
返回任务数据
    ↓
更新状态 (tasks, total, pagination)
    ↓
TaskList 组件渲染
```

### 任务创建流程

```
用户点击 FloatingButton
    ↓
显示 TaskForm (新建模式)
    ↓
用户填写表单
    ↓
表单验证
    ↓
handleTaskFormSubmit()
    ↓
taskService.createTask()
    ↓
API 创建成功
    ↓
关闭表单 + 刷新列表
    ↓
显示成功消息
```

### 筛选搜索流程

```
用户输入筛选条件
    ↓
SearchFilter.onFiltersChange()
    ↓
更新 filters 状态
    ↓
用户点击搜索
    ↓
handleSearch()
    ↓
重置分页到第一页
    ↓
loadTasks(1, pageSize)
    ↓
带筛选参数请求数据
    ↓
返回筛选结果
    ↓
更新任务列表
```

## 组件依赖关系

```
App.tsx
  └── TaskManager.tsx (主页面)
        ├── SearchFilter.tsx (搜索筛选)
        │     └── Props: filters, onFiltersChange, onSearch
        │
        ├── TaskList.tsx (任务列表)
        │     ├── Props: tasks, loading, selectedTaskIds
        │     └── Events: onTaskEdit, onTaskDelete, onTaskSelect
        │
        ├── TaskForm.tsx (任务表单)
        │     ├── Props: visible, editingTask, availableAssignees
        │     └── Events: onCancel, onSubmit
        │
        └── FloatingButton.tsx (悬浮按钮)
              ├── Props: selectedTaskIds
              └── Events: onNewTask, onBatchDelete, onBatchStatusUpdate
```

## 状态管理架构

### TaskManager 状态树

```typescript
TaskManager State {
  // 数据状态
  tasks: Task[]              // 任务列表
  total: number              // 总数
  loading: boolean           // 加载状态
  
  // 分页状态
  pagination: {
    current: number          // 当前页
    pageSize: number         // 每页条数
    total: number            // 总数
  }
  
  // 筛选状态
  filters: {
    keyword: string          // 关键词
    status: TaskStatus[]     // 状态
    priority: TaskPriority[] // 优先级
    assignee: string         // 负责人
    dateRange: [string, string] | null  // 日期范围
  }
  
  // UI状态
  taskFormVisible: boolean   // 表单显示状态
  editingTask: Task | null   // 编辑中的任务
  selectedTaskIds: string[]  // 选中的任务ID
}
```

## 技术栈映射

| 层级 | 技术 | 文件/模块 |
|------|------|-----------|
| UI层 | React 18 + Ant Design 5 | components/, pages/ |
| 类型层 | TypeScript 5.2 | types/ |
| 服务层 | Axios (模拟) | services/ |
| 样式层 | CSS3 | styles/ |
| 构建层 | Vite 5.0 | vite.config.ts |
| 路由层 | React Router 6 | App.tsx |

## 模块职责划分

### 1. 组件层 (Components)

**SearchFilter.tsx** - 搜索筛选组件
- 职责：提供多维度的任务筛选功能
- 输入：filters, availableAssignees
- 输出：onFiltersChange, onSearch
- 特性：高级筛选折叠、活动筛选展示

**TaskList.tsx** - 任务列表组件
- 职责：以表格形式展示任务数据
- 输入：tasks, loading, selectedTaskIds
- 输出：onTaskEdit, onTaskDelete, onTaskSelect
- 特性：分页、排序、筛选、批量选择

**TaskForm.tsx** - 任务表单组件
- 职责：处理任务的创建和编辑
- 输入：visible, editingTask, availableAssignees
- 输出：onCancel, onSubmit
- 特性：表单验证、新建/编辑模式切换

**FloatingButton.tsx** - 悬浮操作按钮
- 职责：提供快捷操作入口
- 输入：selectedTaskIds
- 输出：onNewTask, onBatchDelete, onBatchStatusUpdate
- 特性：动态菜单、批量操作确认

### 2. 页面层 (Pages)

**TaskManager.tsx** - 主页面
- 职责：整合所有组件，管理全局状态
- 功能：
  - 数据加载和刷新
  - 状态管理
  - 组件间通信
  - 事件处理

### 3. 服务层 (Services)

**taskService.ts** - 任务数据服务
- 职责：封装所有任务相关的API调用
- 功能：
  - CRUD操作
  - 批量操作
  - 筛选查询
  - 模拟数据管理

### 4. 类型层 (Types)

**task.ts** - 类型定义
- 职责：提供完整的类型系统
- 内容：
  - 实体类型（Task）
  - 枚举类型（Status, Priority）
  - 请求/响应类型
  - 配置类型

## 性能优化策略

### 1. 组件层面
- 使用 React.memo 优化组件渲染
- useCallback 缓存事件处理函数
- useMemo 缓存计算结果

### 2. 数据层面
- 分页加载减少数据量
- 防抖搜索减少请求
- 批量操作提高效率

### 3. 样式层面
- CSS 模块化避免样式冲突
- 响应式设计适配多端
- 动画性能优化

## 可扩展性设计

### 水平扩展
- 组件可独立开发和测试
- 服务层可轻松替换为真实API
- 类型系统支持新增字段

### 垂直扩展
- 可添加新的筛选维度
- 可扩展批量操作类型
- 可增加新的任务状态

## 安全性考虑

### 前端安全
- XSS 防护（Ant Design 内置）
- CSRF 防护（需后端配合）
- 输入验证和清理

### 数据安全
- 敏感数据不在前端存储
- API 调用需要认证（待实现）
- 权限控制（待实现）

## 部署架构

```
开发环境 (Development)
    ↓
构建 (npm run build)
    ↓
静态文件 (dist/)
    ↓
部署目标:
  ├── Nginx 静态服务器
  ├── Docker 容器
  ├── Vercel/Netlify CDN
  └── GitHub Pages
```

---

**架构设计原则**:
- 单一职责
- 开放封闭
- 依赖倒置
- 接口隔离

**设计模式应用**:
- 组件模式（React Component）
- 容器/展示模式（Container/Presentational）
- 服务模式（Service Pattern）
- 观察者模式（useState/useEffect）
