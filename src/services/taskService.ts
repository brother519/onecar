/**
 * Task Service Module
 * 
 * This module provides a mock task management service for development and testing purposes.
 * It simulates API calls with delays and manages task data in memory.
 * 
 * @module taskService
 */

import { Task, TaskStatus, TaskPriority, TaskFilters, TaskFormData, ApiResponse, TaskListResponse } from '../types/task';
import dayjs from 'dayjs';

/**
 * Mock assignee names for task assignment
 * 
 * In production, this would be replaced with actual user data from the backend.
 * These names are used to randomly assign tasks to simulated users.
 * 
 * @constant {string[]} MOCK_ASSIGNEES - Array of mock user names
 */
export const MOCK_ASSIGNEES = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六'
];

/**
 * Generates mock task data for development and testing
 * 
 * Creates 50 sample tasks with randomized properties including:
 * - Random status and priority
 * - Random assignees (1-3 people per task)
 * - Random creation dates (within last 30 days)
 * - Random due dates (within next 30 days, or none)
 * 
 * @returns {Task[]} Array of 50 generated mock tasks
 * @private
 */
const generateMockTasks = (): Task[] => {
  const tasks: Task[] = [];
  
  // Sample task titles that cycle through the 50 tasks
  const titles = [
    '优化用户登录流程',
    '实现任务管理系统',
    '修复数据导出功能',
    '添加用户权限管理',
    '升级前端框架版本',
    '完成API文档编写',
    '优化数据库查询性能',
    '实现消息通知功能',
    '修复移动端适配问题',
    '添加数据统计报表',
    '完善单元测试覆盖',
    '实现文件上传功能',
    '优化页面加载速度',
    '添加多语言支持',
    '实现用户反馈系统',
    '修复安全漏洞',
    '完成产品需求分析',
    '实现在线客服功能',
    '优化搜索算法',
    '添加数据备份机制'
  ];

  // Detailed descriptions corresponding to task titles
  const descriptions = [
    '分析当前登录流程的痛点，设计更加友好的用户体验',
    '设计并实现一个完整的任务管理系统，包含增删改查功能',
    '解决数据导出时的格式问题和性能优化',
    '根据业务需求设计用户角色和权限控制机制',
    '升级React和相关依赖到最新稳定版本',
    '编写详细的API接口文档，包含请求参数和响应格式',
    '分析慢查询并进行数据库索引优化',
    '实现站内消息、邮件通知等多种通知方式',
    '解决在不同移动设备上的显示适配问题',
    '设计和实现业务数据的统计分析报表',
    '提高代码测试覆盖率，确保代码质量',
    '实现支持多种文件格式的上传功能',
    '通过代码分割和资源优化提升页面性能',
    '支持中英文等多语言界面切换',
    '建立用户反馈收集和处理机制',
    '修复已发现的安全漏洞，加强系统安全性'
  ];

  // Generate 50 tasks with varied properties
  for (let i = 1; i <= 50; i++) {
    // Cycle through titles and descriptions arrays
    const titleIndex = (i - 1) % titles.length;
    const descIndex = Math.min(titleIndex, descriptions.length - 1);
    
    // Random creation date within the last 30 days
    const createdAt = dayjs().subtract(Math.floor(Math.random() * 30), 'day');
    const task: Task = {
      id: `task_${i.toString().padStart(3, '0')}`, // Format: task_001, task_002, etc.
      title: titles[titleIndex],
      description: descriptions[descIndex],
      status: Object.values(TaskStatus)[Math.floor(Math.random() * Object.values(TaskStatus).length)], // Random status
      priority: Object.values(TaskPriority)[Math.floor(Math.random() * Object.values(TaskPriority).length)], // Random priority
      // Randomly assign 1-3 assignees by shuffling and slicing the array
      assignees: MOCK_ASSIGNEES
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1),
      // 70% chance to have a due date within next 30 days
      dueDate: Math.random() > 0.3 ? dayjs().add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD') : undefined,
      createdAt: createdAt.format('YYYY-MM-DD HH:mm:ss'),
      // Update date is 0-4 days after creation
      updatedAt: createdAt.add(Math.floor(Math.random() * 5), 'day').format('YYYY-MM-DD HH:mm:ss'),
      createdBy: MOCK_ASSIGNEES[Math.floor(Math.random() * MOCK_ASSIGNEES.length)] // Random creator
    };
    tasks.push(task);
  }
  
  return tasks;
};

/**
 * In-memory storage for mock tasks
 * 
 * This variable holds all task data for the mock service.
 * In production, this would be replaced with actual API calls to a backend database.
 * 
 * @type {Task[]}
 */
let mockTasks = generateMockTasks();

/**
 * Simulates network latency for API calls
 * 
 * Adds a realistic delay to mock API responses to simulate real-world network conditions.
 * This helps in testing loading states and async behavior.
 * 
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {Promise<void>} Promise that resolves after the specified delay
 * @private
 */
const simulateApiDelay = (delay: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Generates a unique task ID
 * 
 * Creates a unique identifier by combining the current timestamp with a random string.
 * Format: task_{timestamp}_{random9chars}
 * 
 * @returns {string} Unique task identifier
 * @private
 */
const generateId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Task Service API
 * 
 * Provides methods for task management operations including CRUD operations,
 * filtering, pagination, and batch operations.
 * 
 * All methods return promises that resolve to ApiResponse objects.
 */
export const taskService = {
  /**
   * Retrieves a paginated and filtered list of tasks
   * 
   * Supports the following filters:
   * - keyword: Search in task title and description
   * - status: Filter by one or more task statuses
   * - priority: Filter by one or more priority levels
   * - assignee: Filter by assigned user
   * - dateRange: Filter by creation date range
   * 
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number (1-based)
   * @param {number} [params.size=20] - Number of items per page
   * @param {TaskFilters} [params.filters] - Optional filter criteria
   * @returns {Promise<ApiResponse<TaskListResponse>>} Paginated task list response
   * 
   * @example
   * const response = await taskService.getTaskList({
   *   page: 1,
   *   size: 10,
   *   filters: { status: ['PENDING'], priority: ['HIGH'] }
   * });
   */
  async getTaskList(params: {
    page?: number;
    size?: number;
    filters?: TaskFilters;
  }): Promise<ApiResponse<TaskListResponse>> {
    await simulateApiDelay();

    const { page = 1, size = 20, filters } = params;
    let filteredTasks = [...mockTasks];

    // Apply filtering criteria if provided
    if (filters) {
      // Filter by keyword (searches in title and description)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(keyword) ||
          (task.description && task.description.toLowerCase().includes(keyword))
        );
      }

      // Filter by status (supports multiple statuses)
      if (filters.status && filters.status.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.status.includes(task.status)
        );
      }

      // Filter by priority (supports multiple priorities)
      if (filters.priority && filters.priority.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.priority.includes(task.priority)
        );
      }

      // Filter by assignee (tasks assigned to specific user)
      if (filters.assignee) {
        filteredTasks = filteredTasks.filter(task => 
          task.assignees.includes(filters.assignee)
        );
      }

      // Filter by date range (based on creation date)
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange;
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = dayjs(task.createdAt).format('YYYY-MM-DD');
          return taskDate >= startDate && taskDate <= endDate;
        });
      }
    }

    // Apply pagination to filtered results
    const total = filteredTasks.length;
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const tasks = filteredTasks.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        tasks,
        total,
        page,
        size
      },
      message: '获取任务列表成功'
    };
  },

  /**
   * Creates a new task
   * 
   * The new task is created with PENDING status and added to the beginning
   * of the task list. The created timestamp is set to the current time.
   * 
   * @param {TaskFormData} formData - Task creation data
   * @param {string} formData.title - Task title
   * @param {string} formData.description - Task description
   * @param {TaskPriority} formData.priority - Task priority level
   * @param {string[]} formData.assignees - Array of assigned user names
   * @param {string} [formData.dueDate] - Optional due date (YYYY-MM-DD format)
   * @returns {Promise<ApiResponse<Task>>} Created task response
   * 
   * @example
   * const response = await taskService.createTask({
   *   title: '新任务',
   *   description: '任务描述',
   *   priority: 'HIGH',
   *   assignees: ['张三', '李四'],
   *   dueDate: '2025-12-31'
   * });
   */
  async createTask(formData: TaskFormData): Promise<ApiResponse<Task>> {
    await simulateApiDelay(300);

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newTask: Task = {
      id: generateId(),
      title: formData.title,
      description: formData.description,
      status: TaskStatus.PENDING, // New tasks always start as PENDING
      priority: formData.priority,
      assignees: formData.assignees,
      dueDate: formData.dueDate,
      createdAt: now,
      updatedAt: now,
      createdBy: 'current_user' // TODO: In production, get from user authentication context
    };

    // Add new task to the beginning of the list
    mockTasks.unshift(newTask);

    return {
      success: true,
      data: newTask,
      message: '任务创建成功'
    };
  },

  /**
   * Updates an existing task
   * 
   * Updates task properties while preserving the task ID, status, creation info,
   * and other metadata. Only the editable fields from formData are updated.
   * 
   * @param {string} taskId - ID of the task to update
   * @param {TaskFormData} formData - Updated task data
   * @returns {Promise<ApiResponse<Task>>} Updated task response or error if task not found
   * 
   * @example
   * const response = await taskService.updateTask('task_001', {
   *   title: '更新的任务',
   *   description: '新的描述',
   *   priority: 'MEDIUM',
   *   assignees: ['王五'],
   *   dueDate: '2025-11-30'
   * });
   */
  async updateTask(taskId: string, formData: TaskFormData): Promise<ApiResponse<Task>> {
    await simulateApiDelay(300);

    // Find the task by ID
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return {
        success: false,
        data: {} as Task,
        message: '任务不存在'
      };
    }

    // Merge existing task with updated fields
    const updatedTask: Task = {
      ...mockTasks[taskIndex],
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      assignees: formData.assignees,
      dueDate: formData.dueDate,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') // Update the modification timestamp
    };

    mockTasks[taskIndex] = updatedTask;

    return {
      success: true,
      data: updatedTask,
      message: '任务更新成功'
    };
  },

  /**
   * Deletes a task by ID
   * 
   * Permanently removes the task from the task list.
   * This operation cannot be undone.
   * 
   * @param {string} taskId - ID of the task to delete
   * @returns {Promise<ApiResponse<void>>} Success response or error if task not found
   * 
   * @example
   * const response = await taskService.deleteTask('task_001');
   */
  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    await simulateApiDelay(200);

    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return {
        success: false,
        data: undefined,
        message: '任务不存在'
      };
    }

    // Remove the task from the array
    mockTasks.splice(taskIndex, 1);

    return {
      success: true,
      data: undefined,
      message: '任务删除成功'
    };
  },

  /**
   * Updates the status of a specific task
   * 
   * This is a convenience method for updating only the task status
   * without modifying other task properties.
   * 
   * @param {string} taskId - ID of the task to update
   * @param {TaskStatus} status - New status value (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
   * @returns {Promise<ApiResponse<Task>>} Updated task response or error if task not found
   * 
   * @example
   * const response = await taskService.updateTaskStatus('task_001', TaskStatus.COMPLETED);
   */
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<ApiResponse<Task>> {
    await simulateApiDelay(200);

    // Find the task to update
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return {
        success: false,
        data: {} as Task,
        message: '任务不存在'
      };
    }

    // Update only the status and timestamp
    const updatedTask: Task = {
      ...mockTasks[taskIndex],
      status,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };

    mockTasks[taskIndex] = updatedTask;

    return {
      success: true,
      data: updatedTask,
      message: '任务状态更新成功'
    };
  },

  /**
   * Deletes multiple tasks at once
   * 
   * Efficiently removes multiple tasks in a single operation.
   * Tasks that don't exist are silently ignored.
   * 
   * @param {string[]} taskIds - Array of task IDs to delete
   * @returns {Promise<ApiResponse<void>>} Success response with count of deleted tasks
   * 
   * @example
   * const response = await taskService.batchDeleteTasks(['task_001', 'task_002', 'task_003']);
   */
  async batchDeleteTasks(taskIds: string[]): Promise<ApiResponse<void>> {
    await simulateApiDelay(300);

    // Filter out all tasks whose IDs are in the deletion list
    mockTasks = mockTasks.filter(task => !taskIds.includes(task.id));

    return {
      success: true,
      data: undefined,
      message: `成功删除 ${taskIds.length} 个任务`
    };
  },

  /**
   * Updates the status of multiple tasks at once
   * 
   * Efficiently updates the status of multiple tasks in a single operation.
   * Only tasks that exist will be updated; non-existent IDs are ignored.
   * 
   * @param {string[]} taskIds - Array of task IDs to update
   * @param {TaskStatus} status - New status to apply to all specified tasks
   * @returns {Promise<ApiResponse<Task[]>>} Response containing all updated tasks
   * 
   * @example
   * const response = await taskService.batchUpdateTaskStatus(
   *   ['task_001', 'task_002'],
   *   TaskStatus.IN_PROGRESS
   * );
   */
  async batchUpdateTaskStatus(taskIds: string[], status: TaskStatus): Promise<ApiResponse<Task[]>> {
    await simulateApiDelay(300);

    const updatedTasks: Task[] = [];
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // Update status for all matching tasks and collect updated tasks
    mockTasks = mockTasks.map(task => {
      if (taskIds.includes(task.id)) {
        const updatedTask = {
          ...task,
          status,
          updatedAt: now
        };
        updatedTasks.push(updatedTask);
        return updatedTask;
      }
      return task;
    });

    return {
      success: true,
      data: updatedTasks,
      message: `成功更新 ${taskIds.length} 个任务状态`
    };
  }
};