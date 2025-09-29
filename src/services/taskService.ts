import { Task, TaskStatus, TaskPriority, TaskFilters, TaskFormData, ApiResponse, TaskListResponse } from '../types/task';
import dayjs from 'dayjs';

// 模拟用户数据
export const MOCK_ASSIGNEES = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六'
];

// 生成模拟任务数据
const generateMockTasks = (): Task[] => {
  const tasks: Task[] = [];
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

  for (let i = 1; i <= 50; i++) {
    const titleIndex = (i - 1) % titles.length;
    const descIndex = Math.min(titleIndex, descriptions.length - 1);
    
    const createdAt = dayjs().subtract(Math.floor(Math.random() * 30), 'day');
    const task: Task = {
      id: `task_${i.toString().padStart(3, '0')}`,
      title: titles[titleIndex],
      description: descriptions[descIndex],
      status: Object.values(TaskStatus)[Math.floor(Math.random() * Object.values(TaskStatus).length)],
      priority: Object.values(TaskPriority)[Math.floor(Math.random() * Object.values(TaskPriority).length)],
      assignees: MOCK_ASSIGNEES
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1),
      dueDate: Math.random() > 0.3 ? dayjs().add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD') : undefined,
      createdAt: createdAt.format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: createdAt.add(Math.floor(Math.random() * 5), 'day').format('YYYY-MM-DD HH:mm:ss'),
      createdBy: MOCK_ASSIGNEES[Math.floor(Math.random() * MOCK_ASSIGNEES.length)]
    };
    tasks.push(task);
  }
  
  return tasks;
};

// 模拟数据存储
let mockTasks = generateMockTasks();

// 模拟API延迟
const simulateApiDelay = (delay: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

// 生成唯一ID
const generateId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 任务API服务
export const taskService = {
  // 获取任务列表
  async getTaskList(params: {
    page?: number;
    size?: number;
    filters?: TaskFilters;
  }): Promise<ApiResponse<TaskListResponse>> {
    await simulateApiDelay();

    const { page = 1, size = 20, filters } = params;
    let filteredTasks = [...mockTasks];

    // 应用筛选条件
    if (filters) {
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(keyword) ||
          (task.description && task.description.toLowerCase().includes(keyword))
        );
      }

      if (filters.status && filters.status.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.status.includes(task.status)
        );
      }

      if (filters.priority && filters.priority.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.priority.includes(task.priority)
        );
      }

      if (filters.assignee) {
        filteredTasks = filteredTasks.filter(task => 
          task.assignees.includes(filters.assignee)
        );
      }

      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange;
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = dayjs(task.createdAt).format('YYYY-MM-DD');
          return taskDate >= startDate && taskDate <= endDate;
        });
      }
    }

    // 分页
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

  // 创建任务
  async createTask(formData: TaskFormData): Promise<ApiResponse<Task>> {
    await simulateApiDelay(300);

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newTask: Task = {
      id: generateId(),
      title: formData.title,
      description: formData.description,
      status: TaskStatus.PENDING,
      priority: formData.priority,
      assignees: formData.assignees,
      dueDate: formData.dueDate,
      createdAt: now,
      updatedAt: now,
      createdBy: 'current_user' // 在实际应用中从用户上下文获取
    };

    mockTasks.unshift(newTask);

    return {
      success: true,
      data: newTask,
      message: '任务创建成功'
    };
  },

  // 更新任务
  async updateTask(taskId: string, formData: TaskFormData): Promise<ApiResponse<Task>> {
    await simulateApiDelay(300);

    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return {
        success: false,
        data: {} as Task,
        message: '任务不存在'
      };
    }

    const updatedTask: Task = {
      ...mockTasks[taskIndex],
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      assignees: formData.assignees,
      dueDate: formData.dueDate,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };

    mockTasks[taskIndex] = updatedTask;

    return {
      success: true,
      data: updatedTask,
      message: '任务更新成功'
    };
  },

  // 删除任务
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

    mockTasks.splice(taskIndex, 1);

    return {
      success: true,
      data: undefined,
      message: '任务删除成功'
    };
  },

  // 更新任务状态
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<ApiResponse<Task>> {
    await simulateApiDelay(200);

    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return {
        success: false,
        data: {} as Task,
        message: '任务不存在'
      };
    }

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

  // 批量删除任务
  async batchDeleteTasks(taskIds: string[]): Promise<ApiResponse<void>> {
    await simulateApiDelay(300);

    mockTasks = mockTasks.filter(task => !taskIds.includes(task.id));

    return {
      success: true,
      data: undefined,
      message: `成功删除 ${taskIds.length} 个任务`
    };
  },

  // 批量更新任务状态
  async batchUpdateTaskStatus(taskIds: string[], status: TaskStatus): Promise<ApiResponse<Task[]>> {
    await simulateApiDelay(300);

    const updatedTasks: Task[] = [];
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

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