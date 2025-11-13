/**
 * Task Management System - Type Definitions and Display Configuration
 *
 * Contents:
 * - Enums: Task status, priority
 * - Models: Task entity, filter conditions, pagination, API response
 * - Batch operation types and request structure
 * - Mapping configuration: Display labels, colors and weights for status and priority
 *
 * @module types/task
 */
// Task status enum
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Priority enum
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Task entity model
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

// Task filter conditions
export interface TaskFilters {
  keyword: string;
  status: TaskStatus[];
  priority: TaskPriority[];
  assignee: string;
  dateRange: [string, string] | null;
}

// Pagination information
export interface Pagination {
  current: number;
  pageSize: number;
  total: number;
}

// API response format
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Task list response
export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  size: number;
}

// Task form data
export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  assignees: string[];
  dueDate?: string;
}

// Batch operation type
export enum BatchOperation {
  UPDATE_STATUS = 'updateStatus',
  DELETE = 'delete'
}

// Batch operation request
export interface BatchOperationRequest {
  taskIds: string[];
  operation: BatchOperation;
  status?: TaskStatus;
}

// Status display configuration
export interface StatusConfig {
  label: string;
  color: string;
  description: string;
}

// Priority display configuration
export interface PriorityConfig {
  label: string;
  color: string;
  weight: number;
}

// Status and priority configuration mapping
export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  [TaskStatus.PENDING]: {
    label: 'Pending',
    color: 'default',
    description: 'Task created but not started'
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'processing',
    description: 'Task is in progress'
  },
  [TaskStatus.COMPLETED]: {
    label: 'Completed',
    color: 'success',
    description: 'Task completed successfully'
  },
  [TaskStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'error',
    description: 'Task cancelled and will not be executed'
  }
};

export const PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  [TaskPriority.LOW]: {
    label: 'Low Priority',
    color: 'green',
    weight: 1
  },
  [TaskPriority.MEDIUM]: {
    label: 'Medium Priority',
    color: 'gold',
    weight: 2
  },
  [TaskPriority.HIGH]: {
    label: 'High Priority',
    color: 'orange',
    weight: 3
  },
  [TaskPriority.URGENT]: {
    label: 'Urgent',
    color: 'red',
    weight: 4
  }
};