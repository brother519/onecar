import { 
  Task, 
  User, 
  TaskFilters, 
  PaginationParams, 
  TaskListResponse, 
  TaskCreateRequest, 
  TaskUpdateRequest,
  ApiResponse,
  TaskStatus
} from '../types';
import { mockTasks, mockUsers } from './mockData';

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 生成唯一ID
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// 任务数据存储（模拟）
let tasks: Task[] = [...mockTasks];

export class TaskAPI {
  // 获取任务列表
  static async getTasks(
    filters?: TaskFilters, 
    pagination?: PaginationParams
  ): Promise<ApiResponse<TaskListResponse>> {
    await delay(300); // 模拟网络延迟

    let filteredTasks = [...tasks];

    // 应用筛选条件
    if (filters) {
      // 关键词搜索
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(keyword) ||
          task.description?.toLowerCase().includes(keyword)
        );
      }

      // 状态筛选
      if (filters.status && filters.status.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.status!.includes(task.status)
        );
      }

      // 负责人筛选
      if (filters.assigneeId) {
        filteredTasks = filteredTasks.filter(task => 
          task.assignee?.id === filters.assigneeId
        );
      }

      // 优先级筛选
      if (filters.priority && filters.priority.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.priority!.includes(task.priority)
        );
      }

      // 时间范围筛选
      if (filters.startDate || filters.endDate) {
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = task.dueDate || task.createdAt;
          if (!taskDate) return false;
          
          const date = new Date(taskDate);
          
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (date < startDate) return false;
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            if (date > endDate) return false;
          }
          
          return true;
        });
      }
    }

    // 排序（按更新时间倒序）
    filteredTasks.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // 分页
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize);

    return {
      success: true,
      data: {
        tasks: paginatedTasks,
        total: filteredTasks.length,
        page,
        pageSize
      }
    };
  }

  // 获取任务详情
  static async getTask(id: string): Promise<ApiResponse<Task | null>> {
    await delay(200);
    
    const task = tasks.find(t => t.id === id);
    
    return {
      success: true,
      data: task || null,
      message: task ? undefined : '任务不存在'
    };
  }

  // 创建任务
  static async createTask(data: TaskCreateRequest): Promise<ApiResponse<Task>> {
    await delay(500);

    const now = new Date().toISOString();
    const assignee = data.assigneeId ? 
      mockUsers.find(u => u.id === data.assigneeId) : undefined;

    const newTask: Task = {
      id: generateId(),
      title: data.title,
      description: data.description,
      status: TaskStatus.PENDING,
      priority: data.priority,
      assignee,
      dueDate: data.dueDate,
      createdAt: now,
      updatedAt: now,
      tags: data.tags
    };

    tasks.unshift(newTask); // 添加到列表开头

    return {
      success: true,
      data: newTask,
      message: '任务创建成功'
    };
  }

  // 更新任务
  static async updateTask(id: string, data: TaskUpdateRequest): Promise<ApiResponse<Task | null>> {
    await delay(400);

    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return {
        success: false,
        data: null,
        message: '任务不存在'
      };
    }

    const existingTask = tasks[taskIndex];
    const assignee = data.assigneeId ? 
      mockUsers.find(u => u.id === data.assigneeId) : existingTask.assignee;

    const updatedTask: Task = {
      ...existingTask,
      ...data,
      assignee,
      updatedAt: new Date().toISOString(),
      // 如果状态变为已完成，设置完成时间
      completedDate: data.status === TaskStatus.COMPLETED ? 
        new Date().toISOString() : existingTask.completedDate
    };

    tasks[taskIndex] = updatedTask;

    return {
      success: true,
      data: updatedTask,
      message: '任务更新成功'
    };
  }

  // 删除任务
  static async deleteTask(id: string): Promise<ApiResponse<boolean>> {
    await delay(300);

    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return {
        success: false,
        data: false,
        message: '任务不存在'
      };
    }

    tasks.splice(taskIndex, 1);

    return {
      success: true,
      data: true,
      message: '任务删除成功'
    };
  }

  // 批量删除任务
  static async batchDeleteTasks(ids: string[]): Promise<ApiResponse<number>> {
    await delay(500);

    const initialLength = tasks.length;
    tasks = tasks.filter(task => !ids.includes(task.id));
    const deletedCount = initialLength - tasks.length;

    return {
      success: true,
      data: deletedCount,
      message: `成功删除 ${deletedCount} 个任务`
    };
  }

  // 获取用户列表
  static async getUsers(): Promise<ApiResponse<User[]>> {
    await delay(200);

    return {
      success: true,
      data: mockUsers
    };
  }
}