/**
 * 任务管理服务模块
 * 
 * 功能说明：
 * - 提供任务管理系统的核心 API 服务层
 * - 模拟后端 API 接口行为，包含增删改查操作
 * - 支持任务筛选、分页、批量操作等功能
 * - 生成和维护模拟测试数据
 * 
 * 注意事项：
 * - 当前实现为模拟数据方案，数据存储在内存中
 * - 实际生产环境需对接真实后端 API
 * - 页面刷新后数据会重置
 */

import { Task, TaskStatus, TaskPriority, TaskFilters, TaskFormData, ApiResponse, TaskListResponse } from '../types/task';
import dayjs from 'dayjs';

/**
 * 模拟用户数据
 * 
 * 用途：
 * - 提供可分配的任务负责人列表
 * - 用于生成模拟任务数据时随机分配负责人
 * - 前端页面中用户选择的数据源
 */
export const MOCK_ASSIGNEES = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六'
];

/**
 * 生成模拟任务数据
 * 
 * 功能说明：
 * - 生成 50 条模拟任务数据
 * - 随机分配任务状态、优先级、负责人
 * - 随机设置创建时间和截止日期
 * 
 * @returns {Task[]} 包含 50 条模拟任务的数组
 */
const generateMockTasks = (): Task[] => {
  const tasks: Task[] = [];
  // 任务标题数组，循环使用
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

  // 任务描述数组，循环使用
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

  // 生成 50 条模拟任务
  for (let i = 1; i <= 50; i++) {
    // 循环使用标题和描述数组
    const titleIndex = (i - 1) % titles.length;
    const descIndex = Math.min(titleIndex, descriptions.length - 1);
    
    // 随机生成创建时间（过30天内）
    const createdAt = dayjs().subtract(Math.floor(Math.random() * 30), 'day');
    const task: Task = {
      id: `task_${i.toString().padStart(3, '0')}`,
      title: titles[titleIndex],
      description: descriptions[descIndex],
      status: Object.values(TaskStatus)[Math.floor(Math.random() * Object.values(TaskStatus).length)], // 随机分配任务状态
      priority: Object.values(TaskPriority)[Math.floor(Math.random() * Object.values(TaskPriority).length)], // 随机分配优先级
      assignees: MOCK_ASSIGNEES
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1), // 随机分配 1-3 个负责人
      dueDate: Math.random() > 0.3 ? dayjs().add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD') : undefined, // 70% 概率有截止日期
      createdAt: createdAt.format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: createdAt.add(Math.floor(Math.random() * 5), 'day').format('YYYY-MM-DD HH:mm:ss'),
      createdBy: MOCK_ASSIGNEES[Math.floor(Math.random() * MOCK_ASSIGNEES.length)]
    };
    tasks.push(task);
  }
  
  return tasks;
};

/**
 * 模拟数据存储
 * 
 * 说明：
 * - 全局变量，存储在内存中
 * - 由 generateMockTasks 函数初始化
 * - 所有 API 操作直接修改此变量
 * - 页面刷新后数据会重置
 */
let mockTasks = generateMockTasks();

// 模拟API延迟
const simulateApiDelay = (delay: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * 生成唯一任务 ID
 * 
 * 功能说明：
 * - 基于时间戳和随机字符串生成唯一标识符
 * - 确保每次调用都能生成不同的 ID
 * 
 * @returns {string} 格式为 'task_{timestamp}_{random}' 的唯一 ID
 */
const generateId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 任务 API 服务对象
 * 
 * 功能说明：
 * - 提供完整的任务管理 API 接口
 * - 包括查询、创建、更新、删除、批量操作等功能
 * - 所有方法均为异步方法，模拟真实 API 调用
 * 
 * 注意：当前为模拟实现，生产环境需替换为真实 HTTP 请求
 */
export const taskService = {
  /**
   * 获取任务列表（支持分页和多条件筛选）
   * 
   * 功能说明：
   * - 分页查询任务列表
   * - 支持关键词、状态、优先级、负责人、日期范围筛选
   * 
   * @param {Object} params - 查询参数对象
   * @param {number} params.page - 页码，默认为 1
   * @param {number} params.size - 每页数量，默认为 20
   * @param {TaskFilters} params.filters - 筛选条件对象（可选）
   *   @param {string} params.filters.keyword - 关键词（匹配标题和描述）
   *   @param {TaskStatus[]} params.filters.status - 状态数组
   *   @param {TaskPriority[]} params.filters.priority - 优先级数组
   *   @param {string} params.filters.assignee - 负责人
   *   @param {[string, string]} params.filters.dateRange - 日期范围 [startDate, endDate]
   * 
   * @returns {Promise<ApiResponse<TaskListResponse>>} 包含任务列表、总数、分页信息的响应对象
   * 
   * 业务逻辑：
   * 1. 应用所有筛选条件（关键词、状态、优先级、负责人、日期范围）
   * 2. 执行分页计算
   * 3. 返回当前页数据和元信息
   */
  async getTaskList(params: {
    page?: number;
    size?: number;
    filters?: TaskFilters;
  }): Promise<ApiResponse<TaskListResponse>> {
    await simulateApiDelay();

    const { page = 1, size = 20, filters } = params;
    let filteredTasks = [...mockTasks]; // 复制数据，避免修改原始数据

    // 应用筛选条件
    if (filters) {
      // 关键词搜索（不区分大小写，匹配标题和描述）
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(keyword) ||
          (task.description && task.description.toLowerCase().includes(keyword))
        );
      }

      // 状态筛选
      if (filters.status && filters.status.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.status.includes(task.status)
        );
      }

      // 优先级筛选
      if (filters.priority && filters.priority.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.priority.includes(task.priority)
        );
      }

      // 负责人筛选
      if (filters.assignee) {
        filteredTasks = filteredTasks.filter(task => 
          task.assignees.includes(filters.assignee)
        );
      }

      // 日期范围筛选
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange;
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = dayjs(task.createdAt).format('YYYY-MM-DD');
          return taskDate >= startDate && taskDate <= endDate;
        });
      }
    }

    // 分页处理
    const total = filteredTasks.length; // 筛选后的总数
    const startIndex = (page - 1) * size; // 当前页起始索引
    const endIndex = startIndex + size; // 当前页结束索引
    const tasks = filteredTasks.slice(startIndex, endIndex); // 截取当前页数据

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
   * 创建新任务
   * 
   * 功能说明：
   * - 根据表单数据创建一个新任务
   * - 自动生成唯一 ID 和时间戳
   * - 默认状态为 PENDING（待开始）
   * 
   * @param {TaskFormData} formData - 任务表单数据
   *   @param {string} formData.title - 任务标题
   *   @param {string} formData.description - 任务描述
   *   @param {TaskPriority} formData.priority - 优先级
   *   @param {string[]} formData.assignees - 负责人数组
   *   @param {string} formData.dueDate - 截止日期（可选）
   * 
   * @returns {Promise<ApiResponse<Task>>} 包含新创建任务对象的响应
   * 
   * 业务逻辑：
   * 1. 生成唯一任务 ID
   * 2. 设置默认状态为 PENDING
   * 3. 记录创建时间和更新时间
   * 4. 插入到数据存储首位（最新任务排前）
   */
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

    mockTasks.unshift(newTask); // 插入到数组首位

    return {
      success: true,
      data: newTask,
      message: '任务创建成功'
    };
  },

  /**
   * 更新任务基本信息
   * 
   * 功能说明：
   * - 更新指定任务的基本信息（标题、描述、优先级、负责人、截止日期）
   * - 不修改任务状态（状态修改请使用 updateTaskStatus 方法）
   * 
   * @param {string} taskId - 任务 ID
   * @param {TaskFormData} formData - 更新的表单数据
   * 
   * @returns {Promise<ApiResponse<Task>>} 更新后的任务对象，若任务不存在则返回失败响应
   * 
   * 业务逻辑：
   * 1. 查找指定 ID 的任务
   * 2. 若任务不存在，返回错误响应
   * 3. 合并更新数据，保留原有其他字段
   * 4. 更新 updatedAt 时间戳
   */
  async updateTask(taskId: string, formData: TaskFormData): Promise<ApiResponse<Task>> {
    await simulateApiDelay(300);

    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) { // 任务不存在
      return {
        success: false,
        data: {} as Task,
        message: '任务不存在'
      };
    }

    const updatedTask: Task = {
      ...mockTasks[taskIndex], // 保留原有字段
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      assignees: formData.assignees,
      dueDate: formData.dueDate,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') // 更新时间戳
    };

    mockTasks[taskIndex] = updatedTask; // 更新到数据存储

    return {
      success: true,
      data: updatedTask,
      message: '任务更新成功'
    };
  },

  /**
   * 删除任务
   * 
   * 功能说明：
   * - 根据任务 ID 删除指定任务
   * - 从数据存储中永久移除
   * 
   * @param {string} taskId - 要删除的任务 ID
   * 
   * @returns {Promise<ApiResponse<void>>} 成功或失败响应
   * 
   * 业务逻辑：
   * 1. 查找指定 ID 的任务
   * 2. 若任务不存在，返回错误响应
   * 3. 从数据存储中移除该任务
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

    mockTasks.splice(taskIndex, 1); // 从数组中移除

    return {
      success: true,
      data: undefined,
      message: '任务删除成功'
    };
  },

  /**
   * 更新任务状态
   * 
   * 功能说明：
   * - 单独更新指定任务的状态
   * - 不修改任务的其他信息
   * 
   * @param {string} taskId - 任务 ID
   * @param {TaskStatus} status - 新的任务状态
   * 
   * @returns {Promise<ApiResponse<Task>>} 更新后的任务对象
   * 
   * 使用场景：
   * - 任务流转：待开始 → 进行中 → 已完成
   * - 任务暂停、取消等状态变更
   */
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
      ...mockTasks[taskIndex], // 保留原有字段
      status, // 更新状态
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') // 更新时间戳
    };

    mockTasks[taskIndex] = updatedTask; // 更新到数据存储

    return {
      success: true,
      data: updatedTask,
      message: '任务状态更新成功'
    };
  },

  /**
   * 批量删除任务
   * 
   * 功能说明：
   * - 根据任务 ID 数组批量删除多个任务
   * - 一次性从数据存储中移除所有指定任务
   * 
   * @param {string[]} taskIds - 要删除的任务 ID 数组
   * 
   * @returns {Promise<ApiResponse<void>>} 成功响应，包含删除数量
   * 
   * 业务逻辑：
   * - 过滤掉所有包含在 taskIds 中的任务
   * - 更新全局数据存储
   */
  async batchDeleteTasks(taskIds: string[]): Promise<ApiResponse<void>> {
    await simulateApiDelay(300);

    mockTasks = mockTasks.filter(task => !taskIds.includes(task.id)); // 过滤掉被删除的任务

    return {
      success: true,
      data: undefined,
      message: `成功删除 ${taskIds.length} 个任务`
    };
  },

  /**
   * 批量更新任务状态
   * 
   * 功能说明：
   * - 根据任务 ID 数组批量更新多个任务的状态
   * - 同时更新所有目标任务的时间戳
   * 
   * @param {string[]} taskIds - 要更新的任务 ID 数组
   * @param {TaskStatus} status - 目标状态
   * 
   * @returns {Promise<ApiResponse<Task[]>>} 更新后的任务列表
   * 
   * 业务逻辑：
   * 1. 遍历所有任务
   * 2. 匹配 taskIds 中的任务并更新状态
   * 3. 记录更新时间戳
   * 4. 返回所有被更新的任务
   */
  async batchUpdateTaskStatus(taskIds: string[], status: TaskStatus): Promise<ApiResponse<Task[]>> {
    await simulateApiDelay(300);

    const updatedTasks: Task[] = []; // 存储被更新的任务
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 遍历所有任务，更新匹配的任务
    mockTasks = mockTasks.map(task => {
      if (taskIds.includes(task.id)) { // 匹配到目标任务
        const updatedTask = {
          ...task,
          status, // 更新状态
          updatedAt: now // 更新时间戳
        };
        updatedTasks.push(updatedTask); // 记录更新的任务
        return updatedTask;
      }
      return task; // 未匹配的任务保持不变
    });

    return {
      success: true,
      data: updatedTasks,
      message: `成功更新 ${taskIds.length} 个任务状态`
    };
  }
};