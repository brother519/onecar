importReact, { useState, useEffect } from 'react';
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

constTaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [pagination, setPagination] = useState<Pagination>({
    current:1,
    pageSize: 20,
    total: 0
  });

  const [filters, setFilters] = useState<TaskFilters>({
    keyword: '',
    status: [],
    priority: [],
    assignee: '',
    dateRange: null
  });

  const [taskFormVisible, setTaskFormVisible] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const loadTasks = async (page: number = pagination.current, size: number = pagination.pageSize)=> {
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
          pageSize:size,
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

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadTasks(1, pagination.pageSize);
  };

  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
 };

  consthandleNewTask = () => {
    setEditingTask(null);
    setTaskFormVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormVisible(true);
  };

  const handleTaskFormSubmit = async (formData: TaskFormData) =>{
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
      message.error(editingTask? '任务更新失败' : '任务创建失败');
      console.error('任务操作失败:', error);
    }
  };

  consthandleDeleteTask = (taskId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个任务吗？此操作无法撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async ()=> {
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

  consthandleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
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

  consthandleTaskSelect = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };

  const handleBatchOperation = (operation: string, taskIds: string[]) => {
    if (operation === 'delete') {
      handleBatchDelete(taskIds);
    } else if (operation === 'updateStatus') {
      // 批量状态更新操作，由FloatingButton组件直接处理
    }
  };

  consthandleBatchDelete = async (taskIds: string[]) => {
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

  consthandleBatchStatusUpdate = async (taskIds: string[], status: TaskStatus) => {
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

  consthandleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  const handleTaskFormCancel = () => {
    setTaskFormVisible(false);
    setEditingTask(null);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5'}}>
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
          <SearchFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableAssignees={MOCK_ASSIGNEES}
            onSearch={handleSearch}
            loading={loading}
          />

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

<FloatingButton
          selectedTaskIds={selectedTaskIds}
          onNewTask={handleNewTask}
          onBatchDelete={handleBatchDelete}
          onBatchStatusUpdate={handleBatchStatusUpdate}
          onClearSelection={handleClearSelection}
        />

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