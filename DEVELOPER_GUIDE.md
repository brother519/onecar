# 开发者指南

## 项目架构概览

任务管理系统采用现代化的前端架构，具有良好的可扩展性和可维护性。

### 技术栈
- **前端框架**: React 18 + TypeScript
- **UI 库**: Ant Design 5.x
- **构建工具**: Vite
- **状态管理**: React Hooks
- **样式方案**: CSS + Ant Design 主题

### 目录结构
```
src/
├── components/          # 可复用组件
│   ├── TaskList.tsx    # 任务列表组件
│   ├── TaskForm.tsx    # 任务表单组件
│   ├── SearchFilter.tsx # 搜索筛选组件
│   └── FloatingButton.tsx # 悬浮按钮组件
├── pages/              # 页面组件
│   └── TaskManager.tsx # 任务管理主页面
├── services/           # API 服务层
│   └── taskService.ts  # 任务相关 API
├── types/              # TypeScript 类型定义
│   └── task.ts         # 任务相关类型
├── styles/             # 样式文件
│   └── index.css       # 全局样式
└── utils/              # 工具函数
```

## 核心概念

### 1. 数据模型

#### 任务实体 (Task)
```typescript
interface Task {
  id: string;              // 唯一标识
  title: string;           // 任务标题
  description?: string;    // 任务描述
  status: TaskStatus;      // 状态
  priority: TaskPriority;  // 优先级
  assignees: string[];     // 负责人列表
  dueDate?: string;        // 截止日期
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
  createdBy: string;       // 创建人
}
```

#### 状态枚举
```typescript
enum TaskStatus {
  PENDING = 'pending',      // 待开始
  IN_PROGRESS = 'in_progress', // 进行中
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled'    // 已取消
}
```

### 2. 组件设计原则

#### 单一职责原则
每个组件只负责一个特定功能：
- `TaskList`: 负责任务列表展示和基础交互
- `TaskForm`: 负责任务创建和编辑表单
- `SearchFilter`: 负责搜索和筛选功能
- `FloatingButton`: 负责快捷操作

#### 组件通信
使用 props 和回调函数进行组件间通信：

```typescript
interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  // ... 其他 props
}
```

## 功能扩展指南

### 1. 添加新的任务字段

#### 步骤1: 更新类型定义
```typescript
// src/types/task.ts
interface Task {
  // ... 现有字段
  category?: string;        // 新增：任务分类
  estimatedHours?: number;  // 新增：预估工时
  tags?: string[];          // 新增：标签
}
```

#### 步骤2: 更新表单组件
```typescript
// src/components/TaskForm.tsx
<Form.Item
  name="category"
  label="任务分类"
>
  <Select placeholder="请选择分类">
    <Option value="development">开发</Option>
    <Option value="design">设计</Option>
    <Option value="testing">测试</Option>
  </Select>
</Form.Item>
```

#### 步骤3: 更新列表组件
```typescript
// src/components/TaskList.tsx
{
  title: '分类',
  dataIndex: 'category',
  key: 'category',
  render: (category: string) => category || '-'
}
```

### 2. 添加新的筛选条件

#### 更新筛选组件
```typescript
// src/components/SearchFilter.tsx
<Form.Item label="任务分类">
  <Select
    mode="multiple"
    placeholder="选择分类"
    value={filters.category}
    onChange={(value) => updateFilter('category', value)}
  >
    {/* 分类选项 */}
  </Select>
</Form.Item>
```

#### 更新筛选类型
```typescript
// src/types/task.ts
interface TaskFilters {
  // ... 现有字段
  category: string[];
  tags: string[];
}
```

### 3. 添加新的操作功能

#### 示例：任务复制功能

```typescript
// src/services/taskService.ts
async duplicateTask(taskId: string): Promise<ApiResponse<Task>> {
  const originalTask = mockTasks.find(task => task.id === taskId);
  if (!originalTask) {
    return {
      success: false,
      data: {} as Task,
      message: '原任务不存在'
    };
  }

  const duplicatedTask: Task = {
    ...originalTask,
    id: generateId(),
    title: `${originalTask.title} (副本)`,
    status: TaskStatus.PENDING,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
  };

  mockTasks.unshift(duplicatedTask);
  return {
    success: true,
    data: duplicatedTask,
    message: '任务复制成功'
  };
}
```

### 4. 自定义主题

#### 创建主题配置
```typescript
// src/theme/index.ts
import { theme } from 'antd';

export const customTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Button: {
      borderRadius: 6,
    },
    Input: {
      borderRadius: 6,
    },
    Card: {
      borderRadius: 8,
    },
  },
};
```

#### 应用主题
```typescript
// src/App.tsx
import { ConfigProvider } from 'antd';
import { customTheme } from './theme';

const App: React.FC = () => {
  return (
    <ConfigProvider theme={customTheme} locale={zhCN}>
      <TaskManager />
    </ConfigProvider>
  );
};
```

## API 集成指南

### 1. 替换模拟 API

#### 创建真实 API 服务
```typescript
// src/services/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 处理认证失败
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 更新任务服务
```typescript
// src/services/taskService.ts
import apiClient from './apiClient';

export const taskService = {
  async getTaskList(params: any): Promise<ApiResponse<TaskListResponse>> {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  async createTask(formData: TaskFormData): Promise<ApiResponse<Task>> {
    const response = await apiClient.post('/tasks', formData);
    return response.data;
  },

  // ... 其他方法
};
```

### 2. 错误处理

#### 全局错误处理
```typescript
// src/utils/errorHandler.ts
import { message } from 'antd';

export const handleApiError = (error: any) => {
  if (error.response) {
    // 服务器响应错误
    const { status, data } = error.response;
    switch (status) {
      case 400:
        message.error(data.message || '请求参数错误');
        break;
      case 401:
        message.error('认证失败，请重新登录');
        break;
      case 403:
        message.error('权限不足');
        break;
      case 500:
        message.error('服务器内部错误');
        break;
      default:
        message.error('网络错误，请稍后重试');
    }
  } else if (error.request) {
    // 网络错误
    message.error('网络连接失败，请检查网络设置');
  } else {
    // 其他错误
    message.error('发生未知错误');
  }
};
```

## 测试指南

### 1. 单元测试

#### 安装测试依赖
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom
```

#### 配置测试环境
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

#### 测试示例
```typescript
// src/components/__tests__/TaskList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import TaskList from '../TaskList';
import { mockTasks } from '../../test/mockData';

describe('TaskList', () => {
  const defaultProps = {
    tasks: mockTasks,
    loading: false,
    selectedTaskIds: [],
    onTaskSelect: jest.fn(),
    onTaskEdit: jest.fn(),
    onTaskDelete: jest.fn(),
    onTaskStatusChange: jest.fn(),
    onBatchOperation: jest.fn(),
  };

  it('renders task list correctly', () => {
    render(<TaskList {...defaultProps} />);
    expect(screen.getByText('任务标题')).toBeInTheDocument();
  });

  it('handles task edit', () => {
    render(<TaskList {...defaultProps} />);
    const editButton = screen.getAllByText('编辑')[0];
    fireEvent.click(editButton);
    expect(defaultProps.onTaskEdit).toHaveBeenCalled();
  });
});
```

### 2. 端到端测试

#### 使用 Playwright
```bash
npm install --save-dev @playwright/test
```

```typescript
// tests/task-management.spec.ts
import { test, expect } from '@playwright/test';

test('create new task', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 点击新建任务按钮
  await page.click('[data-testid="new-task-button"]');
  
  // 填写表单
  await page.fill('[data-testid="task-title"]', '测试任务');
  await page.selectOption('[data-testid="task-priority"]', 'high');
  await page.selectOption('[data-testid="task-assignees"]', '张三');
  
  // 提交表单
  await page.click('[data-testid="submit-button"]');
  
  // 验证任务创建成功
  await expect(page.locator('text=测试任务')).toBeVisible();
});
```

## 性能优化

### 1. 组件优化

#### 使用 React.memo
```typescript
import React, { memo } from 'react';

const TaskItem = memo<TaskItemProps>(({ task, onEdit, onDelete }) => {
  return (
    <div>
      {/* 任务项内容 */}
    </div>
  );
});
```

#### 使用 useMemo 和 useCallback
```typescript
const TaskManager = () => {
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 筛选逻辑
    });
  }, [tasks, filters]);

  const handleTaskEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setTaskFormVisible(true);
  }, []);

  // ...
};
```

### 2. 代码分割

#### 动态导入
```typescript
// src/pages/TaskManager.tsx
import { lazy, Suspense } from 'react';

const TaskForm = lazy(() => import('../components/TaskForm'));
const TaskList = lazy(() => import('../components/TaskList'));

const TaskManager = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <TaskList {...props} />
      </Suspense>
    </div>
  );
};
```

### 3. 虚拟滚动

#### 大量数据优化
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualTaskList = ({ tasks }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TaskItem task={tasks[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={tasks.length}
      itemSize={60}
    >
      {Row}
    </List>
  );
};
```

## 国际化

### 1. 配置 i18n
```bash
npm install react-i18next i18next
```

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    lng: 'zh',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

### 2. 使用翻译
```typescript
import { useTranslation } from 'react-i18next';

const TaskForm = () => {
  const { t } = useTranslation();

  return (
    <Form>
      <Form.Item label={t('task.title')}>
        <Input placeholder={t('task.titlePlaceholder')} />
      </Form.Item>
    </Form>
  );
};
```

## 安全最佳实践

### 1. 输入验证
```typescript
// 客户端验证
const validateTaskTitle = (title: string) => {
  if (!title || title.trim().length === 0) {
    return '任务标题不能为空';
  }
  if (title.length > 100) {
    return '任务标题不能超过100字符';
  }
  if (/<script|javascript:/i.test(title)) {
    return '任务标题包含非法字符';
  }
  return null;
};
```

### 2. XSS 防护
```typescript
// 使用 DOMPurify 清理 HTML
import DOMPurify from 'dompurify';

const sanitizeHTML = (html: string) => {
  return DOMPurify.sanitize(html);
};
```

### 3. CSRF 防护
```typescript
// 添加 CSRF token
apiClient.interceptors.request.use(config => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

## 部署和监控

### 1. 环境配置
```typescript
// src/config/index.ts
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  enableDebug: import.meta.env.VITE_DEBUG === 'true',
  version: import.meta.env.PACKAGE_VERSION,
};

export default config;
```

### 2. 错误监控
```typescript
// src/utils/monitoring.ts
import * as Sentry from '@sentry/react';

// 错误上报
export const reportError = (error: Error, context?: any) => {
  if (config.enableDebug) {
    console.error('Error:', error, context);
  }
  
  Sentry.captureException(error, {
    extra: context
  });
};
```

### 3. 性能监控
```typescript
// 性能指标收集
export const trackPerformance = (name: string, duration: number) => {
  if ('performance' in window) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }
};
```

这个开发者指南提供了扩展和定制任务管理系统的详细说明。开发者可以根据具体需求选择相应的功能进行实现。