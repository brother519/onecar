/**
 * Tom cat
 * 
 * 任务管理服务层
 * 
 * 本文件封装了任务管理系统的所有 API 调用逻辑,当前使用模拟数据实现。
 * 主要功能模块:
 * - 任务列表查询(支持分页和多维度筛选)
 * - 任务创建、更新、删除
 * - 任务状态管理
 * - 批量操作(批量删除、批量更新状态)
 * 
 * 当前实现状态: 使用模拟数据和延迟模拟真实 API 调用
 * 后续需对接真实后端 API,替换模拟数据和延迟逻辑
 */

import { Task, TaskStatus, TaskPriority, TaskFilters, TaskFormData, ApiResponse, TaskListResponse } from '../types/task';
import dayjs from 'dayjs';

/**
 * 模拟用户数据常量
 * 
 * 用于任务分配和模拟数据生成,包含 14 个模拟用户名。
 * 在实际应用中,此数据应从真实的用户管理系统获取。
 * 
 * 使用场景:
 * - 生成模拟任务时随机分配负责人
 * - 任务表单中的负责人选择列表
 */
export const MOCK_ASSIGNEES = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六'
];

/**
 * 生成模拟任务数据
 * 
 * 生成 50 条模拟任务数据用于开发和测试。
 * 每条任务包含随机的状态、优先级、负责人和日期信息。
 * 
 * @returns {Task[]} 包含 50 条任务的数组
 * 
 * 数据特征:
 * - 任务标题和描述循环使用预定义模板
 * - 状态和优先级随机分配
 * - 负责人随机分配 1-3 人
 * - 创建时间为最近 30 天内的随机日期
 * - 70% 的任务设置截止日期(未来 30 天内)
 */
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

  // 循环生成 50 条任务数据
  for (let i = 1; i <= 50; i++) {
    // 使用模运算循环使用标题和描述模板
    const titleIndex = (i - 1) % titles.length;
    const descIndex = Math.min(titleIndex, descriptions.length - 1);
    
    // 随机生成最近 30 天内的创建时间
    const createdAt = dayjs().subtract(Math.floor(Math.random() * 30), 'day');
    const task: Task = {
      id: `task_${i.toString().padStart(3, '0')}`, // 生成格式化的任务 ID,如 task_001
      title: titles[titleIndex],
      description: descriptions[descIndex],
      status: Object.values(TaskStatus)[Math.floor(Math.random() * Object.values(TaskStatus).length)], // 随机分配任务状态
      priority: Object.values(TaskPriority)[Math.floor(Math.random() * Object.values(TaskPriority).length)], // 随机分配优先级
      assignees: MOCK_ASSIGNEES
        .sort(() => 0.5 - Math.random()) // 随机打乱用户列表
        .slice(0, Math.floor(Math.random() * 3) + 1), // 随机分配 1-3 个负责人
      dueDate: Math.random() > 0.3 ? dayjs().add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD') : undefined, // 70% 的任务设置截止日期
      createdAt: createdAt.format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: createdAt.add(Math.floor(Math.random() * 5), 'day').format('YYYY-MM-DD HH:mm:ss'),
      createdBy: MOCK_ASSIGNEES[Math.floor(Math.random() * MOCK_ASSIGNEES.length)]
    };
    tasks.push(task);
  }
  
  return tasks;
};

/**
 * 模拟数据存储变量
 * 
 * 在内存中存储所有任务数据,初始化时调用 generateMockTasks() 生成 50 条模拟数据。
 * 所有 CRUD 操作直接修改此变量。
 * 
 * 注意: 在实际应用中,数据应存储在数据库中,此变量仅用于开发和演示。
 */
let mockTasks = generateMockTasks();

/**
 * 模拟 API 请求延迟
 * 
 * 使用 Promise 和 setTimeout 模拟真实 API 调用的网络延迟,
 * 以便在开发环境中更真实地测试用户体验和加载状态。
 * 
 * @param {number} delay - 延迟时长(毫秒),默认 500ms
 * @returns {Promise<void>} 延迟后 resolve 的 Promise
 * 
 * 使用场景: 所有 taskService 方法调用前都会执行此延迟
 */
const simulateApiDelay = (delay: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delay));
};


/**
 * 生成唯一任务 ID
 * 
 * 使用当前时间戳和随机字符串组合生成唯一的任务标识符。
 * 
 * @returns {string} 唯一的任务 ID
 * 
 * ID 格式: task_{时间戳}_{9位随机字符串}
 * 示例: task_1234567890123_a1b2c3d4e
 * 
 * 唯一性保证: 时间戳确保时间维度唯一,随机字符串避免同一毫秒内的冲突
 */
const generateId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 任务管理服务对象
 * 
 * 封装了所有任务相关的 API 方法,提供统一的服务接口。
 * 当前使用模拟数据和延迟实现,后续需替换为真实的 HTTP 请求。
 * 
 * 包含的 API 方法:
 * - getTaskList: 获取任务列表(支持分页和筛选)
 * - createTask: 创建新任务
 * - updateTask: 更新任务信息
 * - deleteTask: 删除单个任务
 * - updateTaskStatus: 快速更新任务状态
 * - batchDeleteTasks: 批量删除任务
 * - batchUpdateTaskStatus: 批量更新任务状态
 * 
 * 迁移指引: 将模拟逻辑替换为 axios/fetch 等 HTTP 请求,
 * 保持方法签名和返回值格式不变,确保组件层无需修改。
 */
export const taskService = {
  /**
   * 获取任务列表
   * 
   * 支持分页和多维度筛选的任务列表查询接口。
   * 筛选条件之间为 AND 关系,即同时满足所有条件的任务才会被返回。
   * 
   * @param {Object} params - 查询参数对象
   * @param {number} params.page - 页码,从 1 开始,默认为 1
   * @param {number} params.size - 每页数量,默认为 20
   * @param {TaskFilters} params.filters - 筛选条件对象
   * @param {string} params.filters.keyword - 关键字搜索(匹配标题和描述)
   * @param {TaskStatus[]} params.filters.status - 状态筛选(可多选)
   * @param {TaskPriority[]} params.filters.priority - 优先级筛选(可多选)
   * @param {string} params.filters.assignee - 负责人筛选(单选)
   * @param {[string, string]} params.filters.dateRange - 日期范围筛选 [开始日期, 结束日期]
   * 
   * @returns {Promise<ApiResponse<TaskListResponse>>} 包含任务列表和分页信息的响应对象
   * 
   * 业务逻辑流程:
   * 1. 模拟 API 延迟
   * 2. 应用关键字筛选(标题或描述包含关键字)
   * 3. 应用状态筛选(任务状态在选中的状态列表中)
   * 4. 应用优先级筛选(任务优先级在选中的优先级列表中)
   * 5. 应用负责人筛选(任务负责人列表包含指定负责人)
   * 6. 应用日期范围筛选(任务创建日期在指定范围内)
   * 7. 根据页码和页面大小进行分页计算
   * 8. 返回当前页的任务数据和总数信息
   */
  async getTaskList(params: {
    page?: number;
    size?: number;
    filters?: TaskFilters;
  }): Promise<ApiResponse<TaskListResponse>> {
    await simulateApiDelay();

    const { page = 1, size = 20, filters } = params;
    let filteredTasks = [...mockTasks]; // 复制任务数组,避免修改原始数据

    // 应用各种筛选条件(所有条件为 AND 关系)
    if (filters) {
      // 关键字筛选: 在标题或描述中搜索(不区分大小写)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(keyword) ||
          (task.description && task.description.toLowerCase().includes(keyword))
        );
      }

      // 状态筛选: 任务状态在选中的状态列表中
      if (filters.status && filters.status.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.status.includes(task.status)
        );
      }

      // 优先级筛选: 任务优先级在选中的优先级列表中
      if (filters.priority && filters.priority.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.priority.includes(task.priority)
        );
      }

      // 负责人筛选: 任务的负责人列表包含指定负责人
      if (filters.assignee) {
        filteredTasks = filteredTasks.filter(task => 
          task.assignees.includes(filters.assignee)
        );
      }

      // 日期范围筛选: 任务创建日期在指定的开始和结束日期之间(包含边界)
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange;
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = dayjs(task.createdAt).format('YYYY-MM-DD');
          return taskDate >= startDate && taskDate <= endDate;
        });
      }
    }

    // 计算分页参数
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
   * 根据表单数据创建一个新的任务,自动生成唯一 ID 并设置默认状态。
   * 
   * @param {TaskFormData} formData - 任务表单数据对象
   * @param {string} formData.title - 任务标题(必填)
   * @param {string} formData.description - 任务描述(可选)
   * @param {TaskPriority} formData.priority - 任务优先级(必填)
   * @param {string[]} formData.assignees - 负责人列表(必填)
   * @param {string} formData.dueDate - 截止日期(可选,格式: YYYY-MM-DD)
   * 
   * @returns {Promise<ApiResponse<Task>>} 包含新创建任务对象的响应
   * 
   * 业务逻辑:
   * 1. 生成唯一的任务 ID
   * 2. 设置初始状态为 PENDING(待开始)
   * 3. 设置当前时间为创建时间和更新时间
   * 4. 将新任务添加到任务列表头部(最新任务在前)
   * 
   * 注意事项:
   * - createdBy 字段当前使用 'current_user' 占位符,需对接用户上下文获取实际用户信息
   */
  async createTask(formData: TaskFormData): Promise<ApiResponse<Task>> {
    await simulateApiDelay(300);

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss'); // 获取当前时间戳
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
      createdBy: 'current_user' // 在实际应用中从用户上下文获取当前登录用户
    };

    mockTasks.unshift(newTask); // 将新任务添加到列表头部

    return {
      success: true,
      data: newTask,
      message: '任务创建成功'
    };
  },

  /**
   * 更新任务信息
   * 
   * 根据任务 ID 更新任务的详细信息,包括标题、描述、优先级、负责人和截止日期。
   * 
   * @param {string} taskId - 要更新的任务 ID
   * @param {TaskFormData} formData - 更新的表单数据
   * @param {string} formData.title - 新的任务标题
   * @param {string} formData.description - 新的任务描述
   * @param {TaskPriority} formData.priority - 新的任务优先级
   * @param {string[]} formData.assignees - 新的负责人列表
   * @param {string} formData.dueDate - 新的截止日期
   * 
   * @returns {Promise<ApiResponse<Task>>} 包含更新后任务对象的响应
   * 
   * 业务逻辑:
   * 1. 查找指定 ID 的任务
   * 2. 验证任务是否存在,不存在则返回失败响应
   * 3. 合并原任务数据和更新的字段
   * 4. 更新 updatedAt 时间戳为当前时间
   * 5. 替换原任务对象
   * 
   * 错误处理:
   * - 任务不存在时返回 success: false 和错误消息
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

    // 合并原任务数据和更新的字段,保留 id、status、createdAt、createdBy 等不变字段
    const updatedTask: Task = {
      ...mockTasks[taskIndex],
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      assignees: formData.assignees,
      dueDate: formData.dueDate,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') // 更新时间戳
    };

    mockTasks[taskIndex] = updatedTask; // 替换原任务对象

    return {
      success: true,
      data: updatedTask,
      message: '任务更新成功'
    };
  },

  /**
   * 删除单个任务
   * 
   * 根据任务 ID 从任务列表中删除指定任务。
   * 
   * @param {string} taskId - 要删除的任务 ID
   * @returns {Promise<ApiResponse<void>>} 删除操作的响应
   * 
   * 业务逻辑:
   * 1. 查找指定 ID 的任务索引
   * 2. 验证任务是否存在,不存在则返回失败响应
   * 3. 使用 splice 方法从数组中移除任务
   * 
   * 错误处理:
   * - 任务不存在时返回 success: false 和错误消息
   */
  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    await simulateApiDelay(200);

    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) { // 任务不存在的错误处理
      return {
        success: false,
        data: undefined,
        message: '任务不存在'
      };
    }

    mockTasks.splice(taskIndex, 1); // 从数组中移除任务

    return {
      success: true,
      data: undefined,
      message: '任务删除成功'
    };
  },

  /**
   * 快速更新任务状态
   * 
   * 单独更新任务的状态字段,不修改其他信息。
   * 这是一个便捷方法,用于快速的状态流转操作。
   * 
   * @param {string} taskId - 要更新的任务 ID
   * @param {TaskStatus} status - 新的任务状态
   * @returns {Promise<ApiResponse<Task>>} 包含更新后任务对象的响应
   * 
   * 业务逻辑:
   * 1. 查找指定 ID 的任务
   * 2. 验证任务是否存在,不存在则返回失败响应
   * 3. 仅更新 status 字段和 updatedAt 时间戳
   * 4. 保留其他所有字段不变
   * 
   * 使用场景:
   * - 任务列表中的状态快速切换
   * - 任务详情页的状态流转操作
   * - 如: 标记任务完成、取消任务等
   */
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<ApiResponse<Task>> {
    await simulateApiDelay(200);

    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) { // 任务不存在的错误处理
      return {
        success: false,
        data: {} as Task,
        message: '任务不存在'
      };
    }

    // 仅更新状态字段和时间戳,保留其他字段不变
    const updatedTask: Task = {
      ...mockTasks[taskIndex],
      status,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };

    mockTasks[taskIndex] = updatedTask; // 替换原任务对象

    return {
      success: true,
      data: updatedTask,
      message: '任务状态更新成功'
    };
  },

  /**
   * 批量删除任务
   * 
   * 一次性删除多个任务,提高批量操作效率。
   * 
   * @param {string[]} taskIds - 要删除的任务 ID 数组
   * @returns {Promise<ApiResponse<void>>} 批量删除操作的响应
   * 
   * 业务逻辑:
   * - 使用 filter 方法过滤掉所有 ID 在删除列表中的任务
   * - 返回成功响应,包含删除数量统计
   * 
   * 响应消息:
   * - 包含实际删除的任务数量信息
   */
  async batchDeleteTasks(taskIds: string[]): Promise<ApiResponse<void>> {
    await simulateApiDelay(300);

    // 过滤掉所有 ID 在删除列表中的任务
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
   * 一次性更新多个任务的状态,提高批量操作效率。
   * 所有指定的任务都将更新为相同的状态。
   * 
   * @param {string[]} taskIds - 要更新的任务 ID 数组
   * @param {TaskStatus} status - 新的任务状态
   * @returns {Promise<ApiResponse<Task[]>>} 包含所有更新后任务对象的响应
   * 
   * 业务逻辑:
   * 1. 初始化空数组用于收集更新后的任务
   * 2. 获取当前时间戳用于统一更新时间
   * 3. 遍历任务列表,更新匹配的任务状态
   * 4. 收集所有更新后的任务对象
   * 
   * 响应消息:
   * - 包含实际更新的任务数量统计
   * 
   * @example
   * // 批量将多个任务标记为已完成
   * await batchUpdateTaskStatus(['task_001', 'task_002'], TaskStatus.COMPLETED);
   */
  async batchUpdateTaskStatus(taskIds: string[], status: TaskStatus): Promise<ApiResponse<Task[]>> {
    await simulateApiDelay(300);

    const updatedTasks: Task[] = []; // 收集更新后的任务
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss'); // 统一的更新时间戳

    // 遍历任务列表,更新匹配的任务
    mockTasks = mockTasks.map(task => {
      if (taskIds.includes(task.id)) {
        const updatedTask = {
          ...task,
          status,
          updatedAt: now
        };
        updatedTasks.push(updatedTask); // 收集更新后的任务
        return updatedTask;
      }
      return task; // 不匹配的任务保持不变
    });

    return {
      success: true,
      data: updatedTasks,
      message: `成功更新 ${taskIds.length} 个任务状态`
    };
  }
};