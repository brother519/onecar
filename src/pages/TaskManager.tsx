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
 * 任务管理器主组件
 * 
 * 这是任务管理系统的核心页面组件，承担着整个任务管理流程的协调工作。
 * 该组件采用了分层架构设计，将状态管理、业务逻辑和UI展示进行了清晰分离。
 * 
 * 核心特性：
 * - 任务列表展示与分页：支持大量任务数据的分页显示，提供良好的用户体验
 * - 高级搜索筛选：支持按关键词、状态、优先级、负责人、时间范围等多维度筛选
 * - 任务CRUD操作：完整的任务创建、读取、更新、删除功能
 * - 批量操作支持：支持批量删除任务和批量更新任务状态
 * - 实时状态同步：任务状态变更后立即同步到UI显示
 * - 响应式设计：适配不同屏幕尺寸，提供一致的用户体验
 * 
 * 状态管理架构：
 * - 任务数据状态：tasks, total, pagination - 管理任务列表数据和分页信息
 * - 筛选条件状态：filters - 管理用户设定的各种筛选条件
 * - UI控制状态：loading, taskFormVisible, editingTask, selectedTaskIds - 控制界面交互状态
 * 
 * 主要交互流程：
 * 1. 页面初始化 -> 加载任务列表 -> 渲染列表和分页控件
 * 2. 用户筛选操作 -> 更新筛选条件 -> 重新请求数据 -> 更新列表显示
 * 3. 任务操作流程 -> 打开表单/确认框 -> 调用API -> 刷新列表 -> 显示操作结果
 * 4. 批量操作流程 -> 选择任务 -> 显示操作按钮 -> 执行批量操作 -> 清空选择状态
 * 
 * 组件依赖关系：
 * - SearchFilter: 负责搜索和筛选功能的UI和逻辑
 * - TaskList: 负责任务列表的展示和单个任务的操作
 * - TaskForm: 负责任务创建和编辑的表单处理
 * - FloatingButton: 负责批量操作和快速新建任务的悬浮按钮
 * - taskService: 提供所有任务相关的API调用服务
 * 
 * 性能优化考虑：
 * - 使用分页减少单次数据加载量
 * - 状态更新时避免不必要的重新渲染
 * - API调用使用适当的loading状态提升用户体验
 * - 批量操作减少API调用次数
 */
const TaskManager: React.FC = () => {
  // ==================== 状态管理层 ====================
  // 任务数据相关状态 - 管理核心业务数据
  /**
   * 任务列表数据
   * 存储当前显示的任务列表，每个任务包含id、标题、描述、状态、优先级等完整信息。
   * 该状态会根据筛选条件和分页参数从后端API动态获取。
   * @type {Task[]} Task对象数组，初始为空数组
   */
  const [tasks, setTasks] = useState<Task[]>([]);
  
  /**
   * 数据加载状态
   * 用于控制加载指示器的显示和隐藏，以及防止用户在请求过程中进行其他操作。
   * 在API调用开始时设为true，调用结束后设为false。
   * @type {boolean} 默认为false，表示非加载状态
   */
  const [loading, setLoading] = useState<boolean>(false);
  
  /**
   * 任务总数
   * 用于显示系统中符合当前筛选条件的任务总数量，同时用于分页组件的显示。
   * 该值由后端API返回，与当前显示的tasks数组长度可能不同。
   * @type {number} 默认为0
   */
  const [total, setTotal] = useState<number>(0);
  
  /**
   * 分页配置状态
   * 存储当前分页的配置信息，包括当前页码、每页数量和总数量。
   * current: 当前页码，从1开始
   * pageSize: 每页显示的任务数量，默认20个
   * total: 任务总数，用于计算总页数
   * @type {Pagination}
   */
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,      // 初始加载第一页
    pageSize: 20,    // 每页默认20个任务，平衡加载性能和用户体验
    total: 0         // 初始时为0，等待API返回实际数量
  });

  // 筛选条件状态 - 管理用户搜索和筛选参数
  /**
   * 筛选条件状态
   * 存储用户设定的所有筛选条件，用于在API请求时传递给后端进行数据筛选。
   * keyword: 关键词搜索，支持在任务标题和描述中模糊匹配
   * status: 任务状态筛选，支持多选。空数组表示不筛选
   * priority: 优先级筛选，支持多选。空数组表示不筛选
   * assignee: 负责人筛选，单选。空字符串表示不筛选
   * dateRange: 时间范围筛选，支持按创建时间筛选。null表示不筛选
   * @type {TaskFilters}
   */
  const [filters, setFilters] = useState<TaskFilters>({
    keyword: '',      // 默认无关键词搜索
    status: [],       // 默认不筛选状态，显示所有状态的任务
    priority: [],     // 默认不筛选优先级，显示所有优先级的任务
    assignee: '',     // 默认不筛选负责人，显示所有人的任务
    dateRange: null   // 默认不筛选时间，显示所有时间的任务
  });

  // UI控制状态 - 管理界面交互和显示状态
  /**
   * 任务表单显示状态
   * 控制任务创建/编辑表单弹窗的显示和隐藏。
   * true: 显示表单弹窗，用户可以进行任务编辑
   * false: 隐藏表单弹窗，返回主列表界面
   * @type {boolean} 默认为false，即表单不显示
   */
  const [taskFormVisible, setTaskFormVisible] = useState<boolean>(false);
  
  /**
   * 当前编辑的任务
   * 存储正在编辑的任务对象，用于区分新建和编辑模式。
   * null: 表示新建任务模式，表单为空
   * Task对象: 表示编辑模式，表单会预填充该任务的信息
   * @type {Task | null} 默认为null
   */
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  /**
   * 已选中的任务ID列表
   * 用于批量操作功能，存储用户选中的所有任务的ID。
   * 空数组: 表示没有选中任何任务，批量操作按钮不可用
   * 非空数组: 显示已选中数量，激活批量操作按钮
   * @type {string[]} 默认为空数组
   */
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // ==================== 数据加载层 ====================
  /**
   * 加载任务列表数据
   * 
   * 该函数是数据获取的核心函数，负责从后端API获取任务列表数据。
   * 支持分页加载和条件筛选，是整个任务管理系统的数据基础。
   * 
   * 主要功能：
   * - 根据分页参数和筛选条件获取任务数据
   * - 更新组件内部的任务列表、总数和分页状态
   * - 提供统一的加载状态管理和错误处理
   * - 支持多种调用场景：初始加载、筛选、分页、刷新
   * 
   * 执行流程：
   * 1. 设置loading状态为true，显示加载指示器
   * 2. 构建请求参数：包含分页参数和当前筛选条件
   * 3. 调用taskService.getTaskList API接口
   * 4. 处理响应数据：成功时更新状态，失败时显示错误信息
   * 5. 最终设置loading状态为false，隐藏加载指示器
   * 
   * 错误处理策略：
   * - API调用返回错误状态：显示API返回的错误信息
   * - 网络异常或其他异常：显示通用错误信息并记录控制台日志
   * - 遇到错误时不会清空已有的tasks数据，保持用户体验
   * 
   * 性能优化：
   * - 使用默认参数减少函数调用复杂度
   * - loading状态控制防止重复请求
   * - 异常情况下保持UI稳定性
   * 
   * @param page - 目标页码，默认使用当前分页状态中的页码
   * @param size - 每页数量，默认使用当前分页状态中的pageSize
   * @returns Promise<void> 异步操作，无返回值
   */
  const loadTasks = async (page: number = pagination.current, size: number = pagination.pageSize) => {
    setLoading(true);  // 开始加载，显示加载指示器
    try {
      // 调用API获取任务列表，传递分页参数和当前筛选条件
      const response = await taskService.getTaskList({
        page,      // 目标页码
        size,      // 每页数量
        filters    // 当前的筛选条件，包括关键词、状态、优先级等
      });
      
      if (response.success) {
        // API调用成功，更新组件状态
        setTasks(response.data.tasks);           // 更新任务列表数据
        setTotal(response.data.total);           // 更新任务总数
        setPagination({                          // 更新分页状态
          current: page,                         // 当前页码
          pageSize: size,                        // 每页数量
          total: response.data.total             // 总数量，用于计算总页数
        });
      } else {
        // API返回业务错误，显示具体错误信息
        message.error(response.message);
      }
    } catch (error) {
      // 网络异常或其他未知错误，显示通用错误信息
      message.error('加载任务列表失败');
      console.error('加载任务列表失败:', error);  // 记录详细错误信息供调试
    } finally {
      // 无论成功失败，都要关闭加载指示器
      setLoading(false);
    }
  };

  // 初始化加载 - 组件首次渲染时执行
  /**
   * 组件初始化副作用
   * 
   * 使用useEffect Hook在组件首次渲染时自动加载任务列表数据。
   * 该effect不依赖任何状态变量，只在组件挂载时执行一次。
   * 
   * 执行时机：
   * - 组件首次渲染完成后立即执行
   * - 使用默认的分页参数（第1页，每页20条）
   * - 使用空的初始筛选条件（显示所有任务）
   * 
   * 依赖数组为空，确保只在组件挂载时执行一次。
   */
  useEffect(() => {
    loadTasks();  // 加载首页任务数据
  }, []);  // 空依赖数组，只在组件挂载时执行

  // ==================== 搜索和筛选层 ====================
  /**
   * 处理搜索操作
   * 
   * 当用户点击搜索按钮时触发，执行基于当前筛选条件的任务搜索。
   * 为了确保搜索结果的完整性，搜索时会重置到第一页。
   * 
   * 执行逻辑：
   * 1. 重置分页到第一页：用户可能在任意页码进行搜索，为显示完整搜索结果需要重置
   * 2. 使用当前的filters状态作为搜索条件
   * 3. 调用loadTasks重新获取数据
   * 
   * 为SearchFilter组件的onSearch回调函数。
   */
  const handleSearch = () => {
    // 搜索时重置到第一页，确保用户看到完整的搜索结果
    setPagination(prev => ({ ...prev, current: 1 }));
    // 使用第一页和当前页面大小重新加载数据
    loadTasks(1, pagination.pageSize);
  };

  /**
   * 处理筛选条件变更
   * 
   * 当SearchFilter组件中的筛选条件发生变化时触发。
   * 该函数只负责更新筛选条件状态，不立即发起数据请求。
   * 用户需要点击搜索按钮才会触发实际的数据查询。
   * 
   * 这种设计的优点：
   * - 避免用户输入过程中的頻繁API调用
   * - 给用户时间设置多个筛选条件后一次性搜索
   * - 减少服务器负载和网络流量消耗
   * 
   * @param newFilters - 新的筛选条件对象，包含用户设定的所有筛选参数
   */
  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);  // 更新筛选条件状态，但不立即搜索
  };

  // 新建任务
  const handleNewTask = () => {
    setEditingTask(null);
    setTaskFormVisible(true);
  };

  // 编辑任务
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormVisible(true);
  };

  // 任务表单提交
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

  // 删除任务
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

  // 更新任务状态
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
  /**
   * 处理任务选择操作
   * 
   * 当用户在任务列表中勾选或取消勾选任务时触发。
   * 该函数更新已选中任务的ID列表，为批量操作提供数据基础。
   * 
   * 主要用途：
   * - 更新selectedTaskIds状态，记录用户当前选中的任务
   * - 控制批量操作按钮的显示和隐藏
   * - 在界面上显示已选中任务的数量
   * 
   * @param taskIds - 新的已选中任务ID列表
   */
  const handleTaskSelect = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);  // 直接更新已选中任务列表
  };

  /**
   * 处理批量操作调度
   * 
   * 这是批量操作的调度中心，根据操作类型将请求路由到对应的处理函数。
   * 由TaskList组件调用，传递操作类型和目标任务ID列表。
   * 
   * 支持的操作类型：
   * - 'delete': 批量删除任务
   * - 'updateStatus': 批量更新任务状态（由FloatingButton组件处理）
   * 
   * 设计优点：
   * - 提供统一的批量操作入口，方便扩展新的操作类型
   * - 将不同操作的具体实现分离到不同函数，保持代码的清晰性
   * - 支持将来添加更多批量操作类型
   * 
   * @param operation - 操作类型字符串，标识要执行的批量操作
   * @param taskIds - 目标任务ID列表，操作将应用于这些任务
   */
  const handleBatchOperation = (operation: string, taskIds: string[]) => {
    if (operation === 'delete') {
      // 批量删除操作
      handleBatchDelete(taskIds);
    } else if (operation === 'updateStatus') {
      // 批量状态更新操作，由FloatingButton组件直接处理
      // 这里不做具体处理，因为状态值由FloatingButton组件提供
    }
  };

  /**
   * 批量删除任务
   * 
   * 执行批量删除操作，将多个任务一次性删除。
   * 该函数会自动处理所有相关的状态更新和用户反馈。
   * 
   * 主要功能：
   * - 调用后端API执行批量删除操作
   * - 处理成功和失败的情况，给出相应的用户反馈
   * - 删除成功后清空选中状态和刷新列表数据
   * - 提供错误处理和日志记录
   * 
   * 性能优化：
   * - 使用单个API调用处理多个任务，网络效率高
   * - 同时更新多个相关状态，避免多次状态更新
   * 
   * @param taskIds - 要删除的任务ID列表
   * @returns Promise<void> 异步操作，无返回值
   */
  const handleBatchDelete = async (taskIds: string[]) => {
    try {
      // 调用后端批量删除API
      const response = await taskService.batchDeleteTasks(taskIds);
      if (response.success) {
        message.success(response.message);    // 显示成功信息（通常包含删除数量）
        setSelectedTaskIds([]);              // 清空选中状态
        loadTasks();                         // 刷新任务列表，移除已删除的任务
      } else {
        message.error(response.message);     // 显示API返回的错误信息
      }
    } catch (error) {
      // 网络异常或其他未知错误
      message.error('批量删除失败');
      console.error('批量删除失败:', error);  // 记录详细错误信息供调试
    }
  };

  /**
   * 批量更新任务状态
   * 
   * 执行批量状态更新操作，将多个任务的状态一次性更新为指定状态。
   * 该函数由FloatingButton组件调用，在用户选择目标状态后执行。
   * 
   * 常见使用场景：
   * - 批量将任务标记为“已完成”
   * - 批量将任务标记为“进行中”
   * - 批量将任务挂起或取消
   * 
   * 执行流程：
   * 1. 调用后端批量状态更新API
   * 2. 处理API响应并给出相应反馈
   * 3. 更新成功后清空选中状态和刷新列表
   * 
   * @param taskIds - 要更新状态的任务ID列表
   * @param status - 目标状态值，所有指定任务都将更新为此状态
   * @returns Promise<void> 异步操作，无返回值
   */
  const handleBatchStatusUpdate = async (taskIds: string[], status: TaskStatus) => {
    try {
      // 调用后端批量状态更新API
      const response = await taskService.batchUpdateTaskStatus(taskIds, status);
      if (response.success) {
        message.success(response.message);    // 显示成功信息（通常包含更新数量）
        setSelectedTaskIds([]);              // 清空选中状态
        loadTasks();                         // 刷新任务列表，同步最新状态
      } else {
        message.error(response.message);     // 显示API返回的错误信息
      }
    } catch (error) {
      // 网络异常或其他未知错误
      message.error('批量状态更新失败');
      console.error('批量状态更新失败:', error);  // 记录详细错误信息供调试
    }
  };

  /**
   * 清空选中状态
   * 
   * 当用户点击“取消选择”或想要重新开始选择时调用。
   * 该函数会清空所有已选中的任务，隐藏批量操作按钮。
   * 
   * 使用场景：
   * - 用户主动取消选择
   * - 批量操作完成后自动清空
   * - 页面刷新或重新加载时的状态重置
   */
  const handleClearSelection = () => {
    setSelectedTaskIds([]);  // 清空选中任务ID列表
  };

  // ==================== UI交互处理层 ====================
  /**
   * 处理任务表单取消操作
   * 
   * 当用户在TaskForm组件中点击“取消”按钮或点击弹窗外部时触发。
   * 该函数负责清理任务表单相关的所有UI状态，恢复到主列表界面。
   * 
   * 清理操作：
   * - 关闭任务表单弹窗：隐藏TaskForm组件
   * - 清空编辑状态：避免下次打开表单时出现遗留数据
   * - 不保存用户在表单中的任何修改：符合用户取消操作的预期
   * 
   * 用户体验考虑：
   * - 取消操作不会显示任何确认对话框，符合用户对取消操作的预期
   * - 立即恢复到主列表界面，给用户直接的反馈
   * - 下次打开表单时不会有之前的遗留数据
   */
  const handleTaskFormCancel = () => {
    setTaskFormVisible(false);    // 关闭任务表单弹窗
    setEditingTask(null);         // 清空编辑状态，避免下次打开时的数据污染
  };

  // ==================== 组件渲染层 ====================
  return (
    {/* 主容器布局 - 使用Ant Design的Layout组件构建整体页面结构 */}
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 页面头部 - 显示系统标题、任务统计信息和选中状态 */}
      <Header style={{ 
        background: '#fff',                    // 白色背景，与内容区分开
        padding: '0 24px',                     // 水平内边距，与内容区保持一致
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',  // 轻微阴影，增加层次感
        zIndex: 1000                           // 高层级，确保在所有内容之上
      }}>
        {/* 头部内容容器 - 使用Flex布局实现左右分布 */}
        <div style={{ 
          display: 'flex',                      // Flex布局
          alignItems: 'center',                 // 垂直居中对齐
          justifyContent: 'space-between',      // 水平两端对齐
          height: '100%'                        // 充满整个Header高度
        }}>
          {/* 系统标题 - 使用主色调突出品牌形象 */}
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            任务管理系统
          </Title>
          
          {/* 右侧信息显示区 - 显示任务统计和选中状态 */}
          <div style={{ color: '#666', fontSize: 14 }}>
            共 {total} 个任务  {/* 显示符合当前筛选条件的任务总数 */}
            {/* 有选中任务时显示选中数量，用主色突出显示 */}
            {selectedTaskIds.length > 0 && (
              <span style={{ marginLeft: 16, color: '#1890ff' }}>
                已选择 {selectedTaskIds.length} 个
              </span>
            )}
          </div>
        </div>
      </Header>
      
      {/* 主内容区域 - 包含搜索筛选和任务列表 */}
      <Content style={{ padding: '24px', overflow: 'auto' }}>
        {/* 内容容器 - 限制最大宽度并居中显示，适配大屏幕 */}
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 搜索筛选区域 - 包装SearchFilter组件 */}
          <SearchFilter
            filters={filters}                    // 当前筛选条件状态
            onFiltersChange={handleFiltersChange}  // 筛选条件变更回调
            availableAssignees={MOCK_ASSIGNEES}   // 可用的负责人列表
            onSearch={handleSearch}               // 搜索操作回调
            loading={loading}                     // 加载状态，用于禁用搜索按钮
          />

          {/* 任务列表区域 - 包装TaskList组件，使用卡片样式 */}
          <div style={{ 
            background: '#fff',                   // 白色背景，与页面背景对比
            borderRadius: 8,                      // 圆角设计，现代化视觉效果
            padding: 24,                          // 内边距，给内容适当的呼吸空间
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' // 轻微阴影，增加卡片层次感
          }}>
            <TaskList
              tasks={tasks}                       // 当前页的任务数据
              loading={loading}                   // 加载状态，控制骨架屏显示
              selectedTaskIds={selectedTaskIds}   // 已选中的任务ID列表
              onTaskSelect={handleTaskSelect}     // 任务选择回调
              onTaskEdit={handleEditTask}         // 任务编辑回调
              onTaskDelete={handleDeleteTask}     // 任务删除回调
              onTaskStatusChange={handleTaskStatusChange}  // 任务状态变更回调
              onBatchOperation={handleBatchOperation}      // 批量操作回调
            />
          </div>
        </div>

        {/* 悬浮操作按钮 - 按钮固定在右下角，提供快捷操作 */}
        <FloatingButton
          selectedTaskIds={selectedTaskIds}           // 已选中的任务ID列表
          onNewTask={handleNewTask}                   // 新建任务回调
          onBatchDelete={handleBatchDelete}           // 批量删除回调
          onBatchStatusUpdate={handleBatchStatusUpdate} // 批量状态更新回调
          onClearSelection={handleClearSelection}     // 清空选择回调
        />

        {/* 任务表单弹窗 - 用于创建和编辑任务 */}
        <TaskForm
          visible={taskFormVisible}              // 弹窗显示状态控制
          editingTask={editingTask}               // 当前编辑的任务（null表示新建模式）
          onCancel={handleTaskFormCancel}        // 表单取消回调
          onSubmit={handleTaskFormSubmit}        // 表单提交回调
          availableAssignees={MOCK_ASSIGNEES}     // 可用的负责人列表
        />
      </Content>
    </Layout>
  );
};

export default TaskManager;