// 任务状态枚举
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// 优先级枚举
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 用户数据模型
export interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

// 任务数据模型
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: User;
  dueDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

// 筛选条件接口
export interface TaskFilters {
  keyword?: string;
  status?: TaskStatus[];
  assigneeId?: string;
  priority?: TaskPriority[];
  startDate?: string;
  endDate?: string;
}

// 分页参数接口
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// API响应接口
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// 任务列表响应接口
export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
}

// 任务创建/更新请求接口
export interface TaskCreateRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  tags?: string[];
}

export interface TaskUpdateRequest extends Partial<TaskCreateRequest> {
  status?: TaskStatus;
}

// 状态标签配置
export const statusConfig = {
  [TaskStatus.PENDING]: {
    label: '待办',
    color: '#f59e0b'
  },
  [TaskStatus.IN_PROGRESS]: {
    label: '进行中',
    color: '#3b82f6'
  },
  [TaskStatus.COMPLETED]: {
    label: '已完成',
    color: '#10b981'
  },
  [TaskStatus.CANCELLED]: {
    label: '已取消',
    color: '#6b7280'
  }
};

// 优先级标签配置
export const priorityConfig = {
  [TaskPriority.LOW]: {
    label: '低',
    color: '#10b981'
  },
  [TaskPriority.MEDIUM]: {
    label: '中',
    color: '#f59e0b'
  },
  [TaskPriority.HIGH]: {
    label: '高',
    color: '#f97316'
  },
  [TaskPriority.URGENT]: {
    label: '紧急',
    color: '#ef4444'
  }
};