import React, { useState, useEffect } from 'react';
import { Layout, Typography, message, Modal, Spin } from 'antd';
import { 
  Task, 
  TaskFilters, 
  TaskFormData, 
  TaskStatus, 
  Pagination 
} from '../types/task';
import { taskService, MOCK_ASSIGNEES } from '../services/taskService';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import SearchFilter from '../components/SearchFilter';
import FloatingButton from '../components/FloatingButton';

const { Header, Content } = Layout;
const { Title } = Typography;

/**
 * TaskManager - 任务管理主组件
 * 
 * 主要功能:
 * - 任务列表展示和分页管理
 * - 任务的增删改查操作
 * - 多条件搜索和筛选
 * - 批量操作（删除、状态更新）
 * - 表单弹窗管理
 * - 状态管理和数据同步
 * 
 * 依赖组件: TaskList, TaskForm, SearchFilter, FloatingButton
 * 状态管理: 使用React Hooks进行本地状态管理，包含任务数据、UI状态、筛选条件等
 * 性能考量: 使用分页加载避免大量数据渲染，合理控制重新渲染范围
 * 
 * @returns {JSX.Element} 任务管理系统的主界面组件
 * @since 1.0.0
 */
const TaskManager: React.FC = () => {
  // ==================== 状态管理层 ====================
  // 模块职责: 管理组件的所有状态数据，包括任务数据、UI状态、筛选条件等
  // 数据流向: 从API加载 -> 本地状态 -> UI组件渲染
  // 关键逻辑: 状态变更触发对应的副作用和UI更新
  
  /** 
   * 当前页面的任务列表数据
   * 数据来源: taskService.getTaskList API
   * 更新时机: 组件初始化、搜索筛选、CRUD操作后
   */
  const [tasks, setTasks] = useState<Task[]>([]);
  
  /** 
   * 全局加载状态，控制loading指示器显示
   * 更新时机: API请求开始时设为true，结束时设为false
   */
  const [loading, setLoading] = useState<boolean>(false);
  
  /** 
   * 任务总数，用于分页组件计算
   * 数据来源: API响应中的total字段
   */
  const [total, setTotal] = useState<number>(0);
  
  /** 
   * 分页控制信息
   * current: 当前页号（从1开始）
   * pageSize: 每页显示条数，默认20条
   * total: 总记录数，与total状态保持同步
   */
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pageSize: 20,
    total: 0
  });

  /** 
   * 任务筛选条件集合
   * keyword: 关键词搜索，支持标题和描述模糊匹配
   * status: 状态筛选，支持多选
   * priority: 优先级筛选，支持多选  
   * assignee: 指定负责人筛选
   * dateRange: 创建时间范围筛选
   */
  const [filters, setFilters] = useState<TaskFilters>({
    keyword: '',
    status: [],
    priority: [],
    assignee: '',
    dateRange: null
  });

  /** 
   * 任务表单弹窗显示状态
   * 控制TaskForm组件的显示/隐藏
   */
  const [taskFormVisible, setTaskFormVisible] = useState<boolean>(false);
  
  /** 
   * 当前编辑的任务对象
   * null: 新建模式
   * Task对象: 编辑模式，表单会预填充该任务的数据
   */
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  /** 
   * 选中的任务ID列表，用于批量操作
   * 支持多选，与TaskList组件的选择状态同步
   */
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // ==================== 数据加载层 ====================
  // 模块职责: 负责与后端 API 的交互，处理异步数据加载和错误处理
  // 数据流向: API请求 -> 响应数据解析 -> 状态更新 -> UI更新
  // 关键逻辑: 分页加载、筛选参数传递、错误处理和用户反馈
  
  /**
   * 加载任务列表数据
   * 
   * 执行流程:
   * 1. 设置加载状态为true
   * 2. 构建请求参数（分页信息 + 筛选条件）
   * 3. 调用taskService.getTaskList API
   * 4. 解析响应数据并更新相关状态
   * 5. 处理成功/失败情况并统一关闭加载状态
   * 
   * @param {number} page - 目标页码，默认使用当前分页信息
   * @param {number} size - 每页数据条数，默认使用当前分页设置
   * @returns {Promise<void>} 异步操作，无返回值
   * @throws {Error} 网络请求失败或数据解析错误时抛出异常
   */
  const loadTasks = async (page: number = pagination.current, size: number = pagination.pageSize) => {
    setLoading(true);
    try {
      const response = await taskService.getTaskList({
        page,
        size,
        filters
      });
      
      if (response.success) {
        setTasks(response.data.tasks);
        setTotal(response.data.total);
        setPagination({
          current: page,
          pageSize: size,
          total: response.data.total
        });
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('加载任务列表失败');
      console.error('加载任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 组件初始化效果钩子
   * 在组件首次渲染时自动加载任务列表数据
   * 依赖数组为空，确保只执行一次
   */
  useEffect(() => {
    loadTasks();
  }, []);

  // ==================== 搜索和筛选层 ====================
  // 模块职责: 处理用户的搜索和筛选操作，管理筛选条件状态
  // 数据流向: 用户输入 -> 筛选条件更新 -> 重新加载数据 -> UI更新
  // 关键逻辑: 筛选条件变更时重置分页到第一页，确保搜索结果的准确性
  
  /**
   * 执行搜索操作
   * 当用户点击搜索按钮或触发搜索事件时调用
   * 
   * 执行流程:
   * 1. 将分页重置到第一页（避免搜索结果分页错乱）
   * 2. 使用当前的filters状态重新加载数据
   * 
   * @returns {void} 无返回值，通过状态更新触发UI重新渲染
   */
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadTasks(1, pagination.pageSize);
  };

  /**
   * 处理筛选条件变更
   * 由SearchFilter组件调用，用于同步筛选条件状态
   * 
   * @param {TaskFilters} newFilters - 新的筛选条件对象
   * @returns {void} 无返回值，直接更新filters状态
   */
  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
  };

  // ==================== 任务CRUD操作层 ====================
  // 模块职责: 处理任务的增删改查操作，管理表单状态
  // 数据流向: 用户操作 -> API请求 -> 状态更新 -> UI刷新
  // 关键逻辑: 表单状态管理、错误处理、成功后数据同步
  
  /**
   * 处理新建任务操作
   * 由FloatingButton组件调用，打开新建任务表单
   * 
   * 执行流程:
   * 1. 清空编辑状态（设置为新建模式）
   * 2. 显示任务表单弹窗
   * 
   * @returns {void} 无返回值，通过状态更新控制UI
   */
  const handleNewTask = () => {
    setEditingTask(null);
    setTaskFormVisible(true);
  };

  /**
   * 处理任务编辑操作
   * 由TaskList组件调用，打开指定任务的编辑表单
   * 
   * 执行流程:
   * 1. 设置当前编辑的任务对象
   * 2. 显示任务表单弹窗（表单会自动预填充数据）
   * 
   * @param {Task} task - 要编辑的任务对象
   * @returns {void} 无返回值，通过状态更新控制UI
   */
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormVisible(true);
  };

  /**
   * 处理任务表单提交
   * 由TaskForm组件调用，根据是否存在editingTask决定执行新建或更新操作
   * 
   * 执行流程:
   * 1. 判断当前操作类型（新建/编辑）
   * 2. 调用对应的API接口
   * 3. 处理API响应结果
   * 4. 成功后关闭表单并刷新数据
   * 5. 失败时显示错误信息
   * 
   * @param {TaskFormData} formData - 表单提交的任务数据
   * @returns {Promise<void>} 异步操作，无返回值
   * @throws {Error} API请求失败或数据验证错误时抛出异常
   */
  const handleTaskFormSubmit = async (formData: TaskFormData) => {
    try {
      let response;
      if (editingTask) {
        response = await taskService.updateTask(editingTask.id, formData);
        if (response.success) {
          message.success('任务更新成功');
        }
      } else {
        response = await taskService.createTask(formData);
        if (response.success) {
          message.success('任务创建成功');
        }
      }
      
      if (response.success) {
        setTaskFormVisible(false);
        setEditingTask(null);
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(editingTask ? '任务更新失败' : '任务创建失败');
      console.error('任务操作失败:', error);
    }
  };

  /**
   * 处理删除任务操作
   * 由TaskList组件调用，显示确认对话框并处理删除操作
   * 
   * 执行流程:
   * 1. 显示确认对话框，防止误操作
   * 2. 用户确认后调用删除API
   * 3. 处理API响应结果
   * 4. 成功后刷新任务列表
   * 5. 失败时显示错误信息
   * 
   * @param {string} taskId - 要删除的任务ID
   * @returns {void} 无返回值，通过Modal组件处理用户交互
   */
  const handleDeleteTask = (taskId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个任务吗？此操作无法撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await taskService.deleteTask(taskId);
          if (response.success) {
            message.success('任务删除成功');
            loadTasks();
          } else {
            message.error(response.message);
          }
        } catch (error) {
          message.error('任务删除失败');
          console.error('任务删除失败:', error);
        }
      }
    });
  };

  /**
   * 处理任务状态更新
   * 由TaskList组件调用，快速更新任务状态
   * 
   * 执行流程:
   * 1. 调用状态更新API
   * 2. 处理API响应结果
   * 3. 成功后刷新任务列表
   * 4. 失败时显示错误信息
   * 
   * @param {string} taskId - 要更新的任务ID
   * @param {TaskStatus} status - 新的任务状态
   * @returns {Promise<void>} 异步操作，无返回值
   * @throws {Error} API请求失败或状态更新错误时抛出异常
   */
  const handleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const response = await taskService.updateTaskStatus(taskId, status);
      if (response.success) {
        message.success('任务状态更新成功');
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('任务状态更新失败');
      console.error('任务状态更新失败:', error);
    }
  };

  // ==================== 批量操作层 ====================
  // 模块职责: 处理多个任务的批量操作，管理选中状态
  // 数据流向: 用户选择 -> 批量操作 -> API请求 -> 状态清空 -> 数据刷新
  // 关键逻辑: 批量操作成功后清空选中状态，确保操作一致性
  
  /**
   * 处理任务选中状态变更
   * 由TaskList组件调用，同步选中状态到父组件
   * 
   * @param {string[]} taskIds - 当前选中的任务ID数组
   * @returns {void} 无返回值，直接更新selectedTaskIds状态
   */
  const handleTaskSelect = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };

  /**
   * 处理批量操作路由分发
   * 由TaskList组件调用，根据操作类型分发到对应的处理方法
   * 
   * @param {string} operation - 操作类型（'delete' | 'updateStatus'）
   * @param {string[]} taskIds - 要操作的任务ID数组
   * @returns {void} 无返回值，根据操作类型分发给对应处理函数
   */
  const handleBatchOperation = (operation: string, taskIds: string[]) => {
    if (operation === 'delete') {
      handleBatchDelete(taskIds);
    } else if (operation === 'updateStatus') {
      // 批量状态更新操作，由FloatingButton组件直接处理
    }
  };

  /**
   * 处理批量删除操作
   * 由FloatingButton组件调用，批量删除选中的任务
   * 
   * 执行流程:
   * 1. 调用批量删除API
   * 2. 处理API响应结果
   * 3. 成功后清空选中状态并刷新数据
   * 4. 失败时显示错误信息
   * 
   * @param {string[]} taskIds - 要删除的任务ID数组
   * @returns {Promise<void>} 异步操作，无返回值
   * @throws {Error} API请求失败或批量删除错误时抛出异常
   */
  const handleBatchDelete = async (taskIds: string[]) => {
    try {
      const response = await taskService.batchDeleteTasks(taskIds);
      if (response.success) {
        message.success(response.message);
        setSelectedTaskIds([]);
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('批量删除失败');
      console.error('批量删除失败:', error);
    }
  };

  /**
   * 处理批量状态更新操作
   * 由FloatingButton组件调用，批量更新选中任务的状态
   * 
   * 执行流程:
   * 1. 调用批量状态更新API
   * 2. 处理API响应结果
   * 3. 成功后清空选中状态并刷新数据
   * 4. 失败时显示错误信息
   * 
   * @param {string[]} taskIds - 要更新的任务ID数组
   * @param {TaskStatus} status - 目标状态
   * @returns {Promise<void>} 异步操作，无返回值
   * @throws {Error} API请求失败或批量更新错误时抛出异常
   */
  const handleBatchStatusUpdate = async (taskIds: string[], status: TaskStatus) => {
    try {
      const response = await taskService.batchUpdateTaskStatus(taskIds, status);
      if (response.success) {
        message.success(response.message);
        setSelectedTaskIds([]);
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('批量状态更新失败');
      console.error('批量状态更新失败:', error);
    }
  };

  /**
   * 清空选中状态
   * 由FloatingButton组件调用，清空所有任务选中状态
   * 
   * @returns {void} 无返回值，直接清空selectedTaskIds状态
   */
  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  // ==================== UI交互处理层 ====================
  // 模块职责: 处理组件间的UI交互事件，管理弹窗状态
  // 数据流向: 用户交互 -> 事件处理 -> 状态更新 -> UI响应
  // 关键逻辑: 统一管理弹窗显示/隐藏和编辑状态重置
  
  /**
   * 处理任务表单取消操作
   * 由TaskForm组件调用，关闭表单弹窗并重置编辑状态
   * 
   * 执行流程:
   * 1. 关闭任务表单弹窗
   * 2. 清空编辑任务状态（防止数据残留）
   * 
   * @returns {void} 无返回值，通过状态更新控制UI
   */
  const handleTaskFormCancel = () => {
    setTaskFormVisible(false);
    setEditingTask(null);
  };

  // ==================== 组件渲染层 ====================
  // 模块职责: 组织和渲染所有子组件，构建完整的用户界面
  // 数据流向: 状态数据 -> 组件props -> 子组件渲染 -> 用户界面
  // 关键逻辑: 布局管理、组件集成、样式应用和响应式设计
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 页面头部区域 - 显示系统标题和统计信息 */}
      <Header style={{ 
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 1000
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%'
        }}>
          {/* 系统标题 */}
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            任务管理系统
          </Title>
          
          {/* 统计信息显示区 */}
          <div style={{ color: '#666', fontSize: 14 }}>
            共 {total} 个任务
            {selectedTaskIds.length > 0 && (
              <span style={{ marginLeft: 16, color: '#1890ff' }}>
                已选择 {selectedTaskIds.length} 个
              </span>
            )}
          </div>
        </div>
      </Header>
      
      {/* 主内容区域 */}
      <Content style={{ padding: '24px', overflow: 'auto' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 搜索筛选组件 - 提供多条件筛选功能 */}
          <SearchFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableAssignees={MOCK_ASSIGNEES}
            onSearch={handleSearch}
            loading={loading}
          />

          {/* 任务列表容器 */}
          <div style={{ 
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            {/* 任务列表组件 - 展示任务数据和单个操作 */}
            <TaskList
              tasks={tasks}
              loading={loading}
              selectedTaskIds={selectedTaskIds}
              onTaskSelect={handleTaskSelect}
              onTaskEdit={handleEditTask}
              onTaskDelete={handleDeleteTask}
              onTaskStatusChange={handleTaskStatusChange}
              onBatchOperation={handleBatchOperation}
            />
          </div>
        </div>

        {/* 浮动操作按钮 - 提供快捷操作入口 */}
        <FloatingButton
          selectedTaskIds={selectedTaskIds}
          onNewTask={handleNewTask}
          onBatchDelete={handleBatchDelete}
          onBatchStatusUpdate={handleBatchStatusUpdate}
          onClearSelection={handleClearSelection}
        />

        {/* 任务表单弹窗 - 用于新建和编辑任务 */}
        <TaskForm
          visible={taskFormVisible}
          editingTask={editingTask}
          onCancel={handleTaskFormCancel}
          onSubmit={handleTaskFormSubmit}
          availableAssignees={MOCK_ASSIGNEES}
        />
      </Content>
    </Layout>
  );
};

export default TaskManager;