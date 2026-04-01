/**
 * 任务状态枚举
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * 任务优先级枚举
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * 负责人数据结构
 */
export interface Assignee {
  id: string | number;
  name: string;
  avatar?: string;
}

/**
 * 任务数据结构
 */
export interface Task {
  id: string | number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: Assignee[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

/**
 * 筛选条件
 */
export interface FilterConditions {
  keyword?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeIds?: (string | number)[];
}

/**
 * 任务表单数据
 */
export interface TaskFormData {
  title: string;
  description?: string;
  assignees: (string | number)[];
  priority: TaskPriority;
  dueDate?: string;
}

/**
 * 状态选项
 */
export const STATUS_OPTIONS = [
  { label: '待处理', value: TaskStatus.PENDING },
  { label: '进行中', value: TaskStatus.IN_PROGRESS },
  { label: '已完成', value: TaskStatus.COMPLETED },
  { label: '已取消', value: TaskStatus.CANCELLED }
];

/**
 * 优先级选项
 */
export const PRIORITY_OPTIONS = [
  { label: '低', value: TaskPriority.LOW },
  { label: '中', value: TaskPriority.MEDIUM },
  { label: '高', value: TaskPriority.HIGH },
  { label: '紧急', value: TaskPriority.URGENT }
];

/**
 * 获取状态显示名称
 */
export const getStatusLabel = (status: TaskStatus): string => {
  const option = STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label || status;
};

/**
 * 获取优先级显示名称
 */
export const getPriorityLabel = (priority: TaskPriority): string => {
  const option = PRIORITY_OPTIONS.find(opt => opt.value === priority);
  return option?.label || priority;
};

/**
 * 获取优先级颜色
 */
export const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.LOW:
      return 'default';
    case TaskPriority.MEDIUM:
      return 'blue';
    case TaskPriority.HIGH:
      return 'orange';
    case TaskPriority.URGENT:
      return 'red';
    default:
      return 'default';
  }
};

/**
 * 获取状态颜色
 */
export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.PENDING:
      return 'default';
    case TaskStatus.IN_PROGRESS:
      return 'processing';
    case TaskStatus.COMPLETED:
      return 'success';
    case TaskStatus.CANCELLED:
      return 'error';
    default:
      return 'default';
  }
};
