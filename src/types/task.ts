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

// 任务实体模型
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// 任务筛选条件
export interface TaskFilters {
  keyword: string;
  status: TaskStatus[];
  priority: TaskPriority[];
  assignee: string;
  dateRange: [string, string] | null;
}

// 分页信息
export interface Pagination {
  current: number;
  pageSize: number;
  total: number;
}

// API响应格式
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// 任务列表响应
export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  size: number;
}

// 任务表单数据
export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  assignees: string[];
  dueDate?: string;
}

// 批量操作类型
export enum BatchOperation {
  UPDATE_STATUS = 'updateStatus',
  DELETE = 'delete'
}

// 批量操作请求
export interface BatchOperationRequest {
  taskIds: string[];
  operation: BatchOperation;
  status?: TaskStatus;
}

// 状态显示配置
export interface StatusConfig {
  label: string;
  color: string;
  description: string;
}

// 优先级显示配置
export interface PriorityConfig {
  label: string;
  color: string;
  weight: number;
}

// 状态和优先级配置映射
export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  [TaskStatus.PENDING]: {
    label: '待开始',
    color: 'default',
    description: '任务已创建但未开始执行'
  },
  [TaskStatus.IN_PROGRESS]: {
    label: '进行中',
    color: 'processing',
    description: '任务正在执行中'
  },
  [TaskStatus.COMPLETED]: {
    label: '已完成',
    color: 'success',
    description: '任务已成功完成'
  },
  [TaskStatus.CANCELLED]: {
    label: '已取消',
    color: 'error',
    description: '任务被取消不再执行'
  }
};

export const PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  [TaskPriority.LOW]: {
    label: '低优先级',
    color: 'green',
    weight: 1
  },
  [TaskPriority.MEDIUM]: {
    label: '中优先级',
    color: 'gold',
    weight: 2
  },
  [TaskPriority.HIGH]: {
    label: '高优先级',
    color: 'orange',
    weight: 3
  },
  [TaskPriority.URGENT]: {
    label: '紧急',
    color: 'red',
    weight: 4
  }
};