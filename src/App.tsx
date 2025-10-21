import React, { useState, useEffect } from 'react';
import { Layout, Typography, message, Tabs } from 'antd';
import TaskFilter from './components/TaskFilter';
import TaskList from './components/TaskList';
import TaskFormModal from './components/TaskFormModal';
import TaskDetailModal from './components/TaskDetailModal';
import FloatingActionButton from './components/FloatingActionButton';
import { taskService } from './services/taskService';
import { Task, FilterConditions, TaskFormData, Assignee, TaskPriority } from './types/task';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

type ViewType = 'active' | 'archived';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [filters, setFilters] = useState<FilterConditions>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('active');
  const [loading, setLoading] = useState(false);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [currentView]);

  // 应用筛选
  useEffect(() => {
    const filtered = taskService.filterTasks(tasks, filters);
    setFilteredTasks(filtered);
  }, [tasks, filters]);

  const loadData = () => {
    setLoading(true);
    try {
      const allAssignees = taskService.getAllAssignees();
      setAssignees(allAssignees);

      const loadedTasks = currentView === 'active' 
        ? taskService.getActiveTasks() 
        : taskService.getArchivedTasks();
      setTasks(loadedTasks);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterConditions) => {
    setFilters(newFilters);
  };

  const handleCreateTask = (formData: TaskFormData) => {
    try {
      taskService.createTask(formData);
      message.success('任务创建成功');
      setCreateModalVisible(false);
      loadData();
    } catch (error) {
      message.error('任务创建失败');
      console.error('Create task error:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const handleUpdateTask = (taskId: string | number, updates: { assignees?: (string | number)[]; priority?: TaskPriority }) => {
    try {
      taskService.updateTask(taskId, updates);
      message.success('任务更新成功');
      loadData();
      
      // 更新选中的任务
      const updatedTask = taskService.getTaskById(taskId);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    } catch (error) {
      message.error('任务更新失败');
      console.error('Update task error:', error);
    }
  };

  const handleDeleteTask = () => {
    if (!selectedTask) return;

    try {
      taskService.deleteTask(selectedTask.id);
      message.success('任务删除成功');
      setSelectedTask(null);
      setDetailModalVisible(false);
      loadData();
    } catch (error) {
      message.error('任务删除失败');
      console.error('Delete task error:', error);
    }
  };

  const handleArchiveTask = () => {
    if (!selectedTask) return;

    try {
      taskService.archiveTask(selectedTask.id);
      message.success('任务归档成功');
      setSelectedTask(null);
      setDetailModalVisible(false);
      loadData();
    } catch (error) {
      message.error('任务归档失败');
      console.error('Archive task error:', error);
    }
  };

  const handleUnarchiveTask = () => {
    if (!selectedTask) return;

    try {
      taskService.unarchiveTask(selectedTask.id);
      message.success('取消归档成功');
      setSelectedTask(null);
      setDetailModalVisible(false);
      loadData();
    } catch (error) {
      message.error('取消归档失败');
      console.error('Unarchive task error:', error);
    }
  };

  const handleViewChange = (key: string) => {
    setCurrentView(key as ViewType);
    setFilters({});
    setSelectedTask(null);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={2} style={{ margin: '16px 0', color: '#1890ff' }}>
          任务管理系统
        </Title>
      </Header>

      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Tabs
          activeKey={currentView}
          onChange={handleViewChange}
          items={[
            {
              key: 'active',
              label: '活动任务',
            },
            {
              key: 'archived',
              label: '已归档任务',
            },
          ]}
          style={{ marginBottom: 16 }}
        />

        <TaskFilter
          assignees={assignees}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <TaskList
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          loading={loading}
        />

        <TaskFormModal
          visible={createModalVisible}
          assignees={assignees}
          onSubmit={handleCreateTask}
          onCancel={() => setCreateModalVisible(false)}
        />

        <TaskDetailModal
          visible={detailModalVisible}
          task={selectedTask}
          assignees={assignees}
          onUpdate={handleUpdateTask}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedTask(null);
          }}
        />

        <FloatingActionButton
          selectedTask={selectedTask}
          onCreateTask={() => setCreateModalVisible(true)}
          onDeleteTask={handleDeleteTask}
          onArchiveTask={handleArchiveTask}
          onUnarchiveTask={handleUnarchiveTask}
        />
      </Content>
    </Layout>
  );
};

export default App;
