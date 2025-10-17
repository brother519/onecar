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

  const [tasks, setTasks] = useState<Task[]>([]);
  

  const [loading, setLoading] = useState<boolean>(false);
  

  const [total, setTotal] = useState<number>(0);
  

  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
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
      message.error('Failed to load task list');
      console.error('Failed to load task list:', error);
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


  const handleNewTask = () => {
    setEditingTask(null);
    setTaskFormVisible(true);
  };


  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormVisible(true);
  };


  const handleTaskFormSubmit = async (formData: TaskFormData) => {
    try {
      let response;
      if (editingTask) {
        response = await taskService.updateTask(editingTask.id, formData);
        if (response.success) {
          message.success('Task updated successfully');
        }
      } else {
        response = await taskService.createTask(formData);
        if (response.success) {
          message.success('Task created successfully');
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
      message.error(editingTask ? 'Failed to update task' : 'Failed to create task');
      console.error('Task operation failed:', error);
    }
  };


  const handleDeleteTask = (taskId: string) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this task? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await taskService.deleteTask(taskId);
          if (response.success) {
            message.success('Task deleted successfully');
            loadTasks();
          } else {
            message.error(response.message);
          }
        } catch (error) {
          message.error('Failed to delete task');
          console.error('Failed to delete task:', error);
        }
      }
    });
  };


  const handleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const response = await taskService.updateTaskStatus(taskId, status);
      if (response.success) {
        message.success('Task status updated successfully');
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('Failed to update task status');
      console.error('Failed to update task status:', error);
    }
  };


  const handleTaskSelect = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };


  const handleBatchOperation = (operation: string, taskIds: string[]) => {
    if (operation === 'delete') {
      handleBatchDelete(taskIds);
    } else if (operation === 'updateStatus') {

    }
  };


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
      message.error('Batch delete failed');
      console.error('Batch delete failed:', error);
    }
  };


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
      message.error('Batch status update failed');
      console.error('Batch status update failed:', error);
    }
  };


  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };


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
            Task Management System
          </Title>
          

          <div style={{ color: '#666', fontSize: 14 }}>
            Total {total} tasks
            {selectedTaskIds.length > 0 && (
              <span style={{ marginLeft: 16, color: '#1890ff' }}>
                Selected {selectedTaskIds.length} items
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