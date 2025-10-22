/**
 * 任务服务层模块
 * 
 * 职责：
 * - 提供任务管理的数据操作接口
 * - 实现任务的增删改查功能
 * - 支持批量操作和状态管理
 * - 提供多维度筛选和分页能力
 * 
 * 说明：
 * - 当前使用模拟数据实现，便于前端开发和测试
 * - 生产环境需替换为真实的后端 API 调用
 * - 建议使用 axios 等 HTTP 客户端进行接口请求
 * 
 * 迁移指引：
 * - generateMockTasks 和 simulateApiDelay 函数在生产环境中需要移除
 * - mockTasks 变量需要移除，改为从后端接口获取数据
 * - 所有 taskService 方法需要改为实际的 HTTP 请求
 * 
 * 依赖：
 * - types/task.ts: 任务相关类型定义
 * - dayjs: 日期时间处理库
 */

import { Task, TaskStatus, TaskPriority, TaskFilters, TaskFormData, ApiResponse, TaskListResponse } from '../types/task';
import dayjs from 'dayjs';

/**
 * 模拟用户数据源
 * 
 * 说明：
 * - 用于任务分配的候选人列表
 * - 当前为硬编码的模拟数据，便于开发和演示
 * - 实际应用中应从用户管理系统或后端接口动态获取
 */
export const MOCK_ASSIGNEES = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六'
];

/**
 * 生成模拟任务数据
 * 
 * 功能：
 * - 生成 50 条模拟任务数据，用于开发和演示
 * - 使用预定义的标题和描述数组循环生成
 * - 随机分配状态、优先级、负责人和日期
 * 
 * @returns {Task[]} 包含 50 个任务对象的数组
 * 
 * 注意事项：
 * - 创建日期范围：过去 30 天内的随机日期
 * - 截止日期范围：未来 30 天内的随机日期（70% 概率设置）
 * - 更新日期：在创建日期后 0-5 天内
 * - 生产环境中此函数需要移除
 */
const generateMockTasks = (): Task[] => {
  const tasks: Task[] = [];
  
  // 预定义的任务标题模板，用于生成模拟数据
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

  // 预定义的任务描述模板，提供详细的任务背景信息
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

  // 循环生成 50 条任务数据
  for (let i = 1; i <= 50; i++) {
    // 通过取模计算循环使用标题数组，确保数组不越界
    const titleIndex = (i - 1) % titles.length;
    const descIndex = Math.min(titleIndex, descriptions.length - 1);
    
    // 生成创建日期：过去 30 天内的随机日期
    const createdAt = dayjs().subtract(Math.floor(Math.random() * 30), 'day');
    const task: Task = {
      id: `task_${i.toString().padStart(3, '0')}`,
      title: titles[titleIndex],
      description: descriptions[descIndex],
      // 随机分配任务状态（待开始/进行中/已完成/已取消）
      status: Object.values(TaskStatus)[Math.floor(Math.random() * Object.values(TaskStatus).length)],
      // 随机分配优先级（低/中/高/紧急）
      priority: Object.values(TaskPriority)[Math.floor(Math.random() * Object.values(TaskPriority).length)],
      // 随机分配 1-3 个负责人
      assignees: MOCK_ASSIGNEES
        .sort(() => 0.5 - Math.random()) // 打乱数组顺序
        .slice(0, Math.floor(Math.random() * 3) + 1), // 取 1-3 个人
      // 70% 概率设置截止日期（未来 30 天内）
      dueDate: Math.random() > 0.3 ? dayjs().add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD') : undefined,
      createdAt: createdAt.format('YYYY-MM-DD HH:mm:ss'),
      // 更新日期：在创建日期后 0-5 天内
      updatedAt: createdAt.add(Math.floor(Math.random() * 5), 'day').format('YYYY-MM-DD HH:mm:ss'),
      // 随机分配创建人
      createdBy: MOCK_ASSIGNEES[Math.floor(Math.random() * MOCK_ASSIGNEES.length)]
    };
    tasks.push(task);
  }
  
  return tasks;
};

/**
 * 模拟任务数据存储
 * 
 * 说明：
 * - 模块级变量，用于在内存中存储任务数据
 * - 当前用于前端功能演示和开发调试
 * - 生产环境中应替换为数据库或后端接口数据
 * - 页面刷新后数据会重置为初始状态
 */
let mockTasks = generateMockTasks();

/**
 * 模拟 API 请求延迟
 * 
 * 功能：
 * - 模拟真实网络环境的请求延迟
 * - 增强开发环境的真实性，便于测试加载状态和用户体验
 * 
 * @param {number} delay - 延迟毫秒数，默认 500ms
 * @returns {Promise<void>} 在指定延迟后 resolve 的 Promise
 * 
 * 使用场景：
 * - 测试 loading 状态显示
 * - 模拟网络慢速情况
 * - 生产环境中此函数需要移除
 */
const simulateApiDelay = (delay: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * 生成唯一任务 ID
 * 
 * 功能：
 * - 生成唯一的任务标识符
 * - 结合时间戳和随机字符串确保唯一性
 * 
 * @returns {string} 唯一任务 ID
 * 
 * 格式示例：
 * - task_1234567890_abc123xyz
 * 
 * 生产环境：
 * - 实际应用中应由后端数据库生成（如 UUID 或自增 ID）
 */
const generateId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 任务 API 服务对象
 * 
 * 功能：
 * - 提供任务管理的核心服务接口
 * - 实现完整的 CRUD 操作和批量处理能力
 * - 所有方法返回统一的 ApiResponse 格式
 * 
 * 说明：
 * - 当前为模拟实现，操作本地内存数据
 * - 生产环境中需替换为实际的 HTTP 请求（建议使用 axios）
 */
export const taskService = {
  /**
   * 获取任务列表（支持筛选和分页）
   * 
   * @param params - 查询参数对象
   * @param params.page - 当前页码，默认 1
   * @param params.size - 每页条数，默认 20
   * @param params.filters - 筛选条件（可选）
   * @param params.filters.keyword - 关键词搜索（匹配标题或描述）
   * @param params.filters.status - 状态筛选数组
   * @param params.filters.priority - 优先级筛选数组
   * @param params.filters.assignee - 负责人筛选
   * @param params.filters.dateRange - 日期范围筛选
   * 
   * @returns Promise<ApiResponse<TaskListResponse>> 包含任务列表、总数、分页信息
   * 
   * 业务逻辑：
   * 1. 复制任务数据副本，避免修改原始数据
   * 2. 依次应用各项筛选条件
   * 3. 计算分页的起始和结束索引
   * 4. 返回符合条件的任务子集
   */
  async getTaskList(params: {
    page?: number;
    size?: number;
    filters?: TaskFilters;
  }): Promise<ApiResponse<TaskListResponse>> {
    await simulateApiDelay();

    const { page = 1, size = 20, filters } = params;
    // 复制任务数据副本，避免修改原始数据
    let filteredTasks = [...mockTasks];

    // 应用筛选条件
    if (filters) {
      // 关键词筛选：对任务标题和描述进行不区分大小写的模糊匹配
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(keyword) ||
          (task.description && task.description.toLowerCase().includes(keyword))
        );
      }

      // 状态筛选：支持同时选择多个状态
      if (filters.status && filters.status.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.status.includes(task.status)
        );
      }

      // 优先级筛选：支持同时选择多个优先级
      if (filters.priority && filters.priority.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.priority.includes(task.priority)
        );
      }

      // 负责人筛选：检查任务的负责人数组是否包含指定人员
      if (filters.assignee) {
        filteredTasks = filteredTasks.filter(task => 
          task.assignees.includes(filters.assignee)
        );
      }

      // 日期范围筛选：按任务创建日期进行区间过滤
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange;
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = dayjs(task.createdAt).format('YYYY-MM-DD');
          return taskDate >= startDate && taskDate <= endDate;
        });
      }
    }

    // 分页处理：计算当前页的起始和结束索引
    const total = filteredTasks.length; // 筛选后的总数
    const startIndex = (page - 1) * size; // 起始索引（0 基于）
    const endIndex = startIndex + size; // 结束索引（不包含）
    const tasks = filteredTasks.slice(startIndex, endIndex); // 提取当前页数据

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
   * @param formData - 任务表单数据对象
   * @param formData.title - 任务标题
   * @param formData.description - 任务描述
   * @param formData.priority - 优先级
   * @param formData.assignees - 负责人数组
   * @param formData.dueDate - 截止日期
   * 
   * @returns Promise<ApiResponse<Task>> 包含新创建的任务完整信息
   * 
   * 业务逻辑：
   * 1. 生成唯一任务 ID
   * 2. 设置初始状态为待开始
   * 3. 记录创建时间和更新时间
   * 4. 将新任务插入到列表头部
   * 
   * 注意事项：
   * - 创建人字段当前硬编码，实际应从用户上下文获取
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

    // 将新任务插入到列表头部
    mockTasks.unshift(newTask);

    return {
      success: true,
      data: newTask,
      message: '任务创建成功'
    };
  },

  /**
   * 更新任务信息
   * 
   * @param taskId - 要更新的任务 ID
   * @param formData - 新的任务数据
   * @param formData.title - 任务标题
   * @param formData.description - 任务描述
   * @param formData.priority - 优先级
   * @param formData.assignees - 负责人数组
   * @param formData.dueDate - 截止日期
   * 
   * @returns Promise<ApiResponse<Task>> 包含更新后的任务信息
   * 
   * 业务逻辑：
   * 1. 查找任务是否存在
   * 2. 不存在则返回错误
   * 3. 存在则更新字段并刷新更新时间
   * 
   * 注意事项：
   * - 不允许直接修改任务状态，状态修改需使用专用方法 updateTaskStatus
   */
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

  /**
   * 删除指定任务
   * 
   * @param taskId - 要删除的任务 ID
   * 
   * @returns Promise<ApiResponse<void>> 成功或失败信息
   * 
   * 业务逻辑：
   * 1. 查找任务索引
   * 2. 不存在则返回错误
   * 3. 存在则从数组中移除
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

    mockTasks.splice(taskIndex, 1);

    return {
      success: true,
      data: undefined,
      message: '任务删除成功'
    };
  },

  /**
   * 更新任务状态
   * 
   * @param taskId - 要更新的任务 ID
   * @param status - 新的任务状态枚举值（待开始/进行中/已完成/已取消）
   * 
   * @returns Promise<ApiResponse<Task>> 包含更新后的任务信息
   * 
   * 业务逻辑：
   * 1. 查找任务
   * 2. 更新状态字段
   * 3. 刷新更新时间
   * 
   * 使用场景：
   * - 任务流转
   * - 状态变更操作
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
   * 批量删除任务
   * 
   * @param taskIds - 任务 ID 数组
   * 
   * @returns Promise<ApiResponse<void>> 包含删除数量的成功消息
   * 
   * 业务逻辑：
   * - 过滤掉 ID 在删除列表中的所有任务
   * 
   * 性能考虑：
   * - 使用 filter 方法一次性处理，避免多次数组操作
   */
  async batchDeleteTasks(taskIds: string[]): Promise<ApiResponse<void>> {
    await simulateApiDelay(300);

    mockTasks = mockTasks.filter(task => !taskIds.includes(task.id));

    return {
      success: true,
      data: undefined,
      message: `成功删除 ${taskIds.length} 个任务`
    };
  },

  /**
   * 批量更新任务状态
   * 
   * @param taskIds - 任务 ID 数组
   * @param status - 目标状态枚举值
   * 
   * @returns Promise<ApiResponse<Task[]>> 包含所有更新后的任务信息
   * 
   * 业务逻辑：
   * 1. 遍历任务列表
   * 2. 匹配 ID 的任务更新状态和时间
   * 3. 收集所有更新的任务并返回
   * 
   * 使用场景：
   * - 批量操作
   * - 工作流批量流转
   */
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