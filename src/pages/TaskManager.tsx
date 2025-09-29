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

const TaskManager: React.FC = () => {
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 筛选条件
  const [filters, setFilters] = useState<TaskFilters>({
    keyword: '',
    status: [],
    priority: [],
    assignee: '',
    dateRange: null
  });

  // UI状态
  const [taskFormVisible, setTaskFormVisible] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // 加载任务列表
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

  // 初始加载
  useEffect(() => {
    loadTasks();
  }, []);

  // 搜索处理
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadTasks(1, pagination.pageSize);
  };

  // 筛选条件变更
  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
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

  // 任务选择
  const handleTaskSelect = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };

  // 批量操作
  const handleBatchOperation = (operation: string, taskIds: string[]) => {
    if (operation === 'delete') {
      handleBatchDelete(taskIds);
    } else if (operation === 'updateStatus') {
      // 这个由FloatingButton组件处理
    }
  };

  // 批量删除
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

  // 批量状态更新
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

  // 清空选择
  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  // 表单取消
  const handleTaskFormCancel = () => {
    setTaskFormVisible(false);
    setEditingTask(null);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
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
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            任务管理系统
          </Title>
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
      
      <Content style={{ padding: '24px', overflow: 'auto' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 搜索筛选区域 */}
          <SearchFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableAssignees={MOCK_ASSIGNEES}
            onSearch={handleSearch}
            loading={loading}
          />

          {/* 任务列表区域 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 8,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
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

        {/* 悬浮操作按钮 */}
        <FloatingButton
          selectedTaskIds={selectedTaskIds}
          onNewTask={handleNewTask}
          onBatchDelete={handleBatchDelete}
          onBatchStatusUpdate={handleBatchStatusUpdate}
          onClearSelection={handleClearSelection}
        />

        {/* 任务表单弹窗 */}
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