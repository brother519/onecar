/**
 * 首页组件 - 任务管理系统主页面
 * 
 * 功能特性：
 * - 任务搜索与筛选
 * - 任务列表展示
 * - 用户信息展示
 * - 任务操作集成
 * - 快速任务创建
 * 
 * 状态依赖：
 * - taskService: 任务数据管理
 * - 本地状态: 搜索关键词、筛选条件
 * 
 * @component
 * @description 任务管理系统的主页面，提供任务的查看、搜索、创建等核心功能
 * @returns {JSX.Element} 首页组件渲染结果
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Card, Row, Col, Input, Button, Space, Typography, Statistic, message } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import SearchFilter from '../components/SearchFilter';
import FloatingButton from '../components/FloatingButton';
import { taskService } from '../services/taskService';
import { Task, TaskStatus, TaskPriority, TaskFilters } from '../types/task';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

/**
 * 首页组件主函数
 */
const HomePage = () => {
  // ========== 状态管理 ==========
  
  /**
   * 任务列表数据状态
   * @type {Task[]} 当前页面显示的任务列表
   */
  const [tasks, setTasks] = useState([]);
  
  /**
   * 数据加载状态
   * @type {boolean} 控制loading状态显示
   */
  const [loading, setLoading] = useState(false);
  
  /**
   * 任务表单弹窗状态
   * @type {boolean} 控制任务创建/编辑表单的显示
   */
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  /**
   * 当前编辑的任务
   * @type {Task|null} 编辑模式下的任务对象，null表示新建模式
   */
  const [editingTask, setEditingTask] = useState(null);
  
  /**
   * 搜索和筛选条件
   * @type {TaskFilters} 用户设置的任务筛选条件
   */
  const [filters, setFilters] = useState({
    keyword: '',
    status: [],
    priority: [],
    assignee: '',
    dateRange: null
  });

  /**
   * 任务统计数据状态
   * @type {Object} 包含各状态任务数量的统计信息
   */
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });

  // ========== 业务逻辑处理 ==========

  /**
   * 加载任务列表数据
   * 从后端API获取任务数据并更新本地状态
   * 
   * @async
   * @function loadTasks
   */
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      // 调用任务服务API获取任务列表
      const response = await taskService.getTasks(filters);
      
      if (response.success) {
        setTasks(response.data.tasks);
        // 更新任务统计信息
        updateStatistics(response.data.tasks);
      } else {
        message.error('加载任务列表失败：' + response.message);
      }
    } catch (error) {
      console.error('加载任务列表时发生错误:', error);
      message.error('加载任务列表失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * 更新任务统计数据
   * 根据任务列表计算各状态的任务数量
   * 
   * @param {Task[]} taskList - 任务列表数组
   */
  const updateStatistics = (taskList) => {
    const stats = {
      total: taskList.length,
      pending: taskList.filter(task => task.status === TaskStatus.PENDING).length,
      inProgress: taskList.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
      completed: taskList.filter(task => task.status === TaskStatus.COMPLETED).length
    };
    setStatistics(stats);
  };

  /**
   * 初始化页面数据
   * 组件挂载时执行，加载初始任务数据
   */
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ========== 事件处理函数 ==========

  /**
   * 处理搜索操作
   * 当用户输入搜索关键词时触发任务筛选
   * 
   * @param {string} value - 搜索关键词
   */
  const handleSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      keyword: value.trim()
    }));
  };

  /**
   * 处理筛选条件变更
   * 更新筛选条件并重新加载任务数据
   * 
   * @param {Partial<TaskFilters>} newFilters - 新的筛选条件
   */
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  /**
   * 打开任务创建表单
   * 设置表单为新建模式
   */
  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalVisible(true);
  };

  /**
   * 打开任务编辑表单
   * 设置表单为编辑模式并加载任务数据
   * 
   * @param {Task} task - 要编辑的任务对象
   */
  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalVisible(true);
  };

  /**
   * 处理任务表单提交
   * 根据编辑模式创建或更新任务
   * 
   * @param {TaskFormData} formData - 表单数据
   */
  const handleTaskSubmit = async (formData) => {
    try {
      let response;
      
      if (editingTask) {
        // 编辑模式：更新现有任务
        response = await taskService.updateTask(editingTask.id, formData);
        if (response.success) {
          message.success('任务更新成功');
        }
      } else {
        // 新建模式：创建新任务
        response = await taskService.createTask(formData);
        if (response.success) {
          message.success('任务创建成功');
        }
      }

      if (response.success) {
        setIsModalVisible(false);
        setEditingTask(null);
        // 重新加载任务列表以显示最新数据
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error('提交任务时发生错误:', error);
      message.error('操作失败，请重试');
    }
  };

  /**
   * 处理任务删除操作
   * 删除指定任务并刷新列表
   * 
   * @param {string} taskId - 要删除的任务ID
   */
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await taskService.deleteTask(taskId);
      if (response.success) {
        message.success('任务删除成功');
        // 重新加载任务列表
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error('删除任务时发生错误:', error);
      message.error('删除失败，请重试');
    }
  };

  /**
   * 处理任务状态更新
   * 更新任务状态并刷新列表
   * 
   * @param {string} taskId - 任务ID
   * @param {TaskStatus} newStatus - 新的任务状态
   */
  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const response = await taskService.updateTaskStatus(taskId, newStatus);
      if (response.success) {
        message.success('任务状态更新成功');
        // 重新加载任务列表以反映状态变更
        loadTasks();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error('更新任务状态时发生错误:', error);
      message.error('状态更新失败，请重试');
    }
  };

  // ========== 组件渲染 ==========

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 页面顶部导航栏 */}
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* 网站标题区域 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            任务管理系统
          </Title>
        </div>

        {/* 顶部搜索栏 */}
        <div style={{ width: '400px' }}>
          <Search
            placeholder="搜索任务标题、描述或负责人..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            style={{ width: '100%' }}
          />
        </div>

        {/* 用户操作区域 */}
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
            onClick={handleCreateTask}
          >
            新建任务
          </Button>
          <Button 
            icon={<UserOutlined />}
            size="large"
          >
            个人中心
          </Button>
        </Space>
      </Header>

      {/* 主要内容区域 */}
      <Content style={{ padding: '24px', marginTop: '64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* 任务统计卡片区域 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="总任务数"
                  value={statistics.total}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="待开始"
                  value={statistics.pending}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="进行中"
                  value={statistics.inProgress}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="已完成"
                  value={statistics.completed}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 搜索筛选组件区域 */}
          <Card style={{ marginBottom: '24px' }}>
            <SearchFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={() => setFilters({
                keyword: '',
                status: [],
                priority: [],
                assignee: '',
                dateRange: null
              })}
            />
          </Card>

          {/* 主要任务列表展示区域 */}
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: '16px' }}>
                  任务列表 ({tasks.length})
                </Text>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleCreateTask}
                >
                  新建任务
                </Button>
              </div>
            }
            bodyStyle={{ padding: '0' }}
          >
            {/* 任务列表组件 */}
            <TaskList
              tasks={tasks}
              loading={loading}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onStatusUpdate={handleStatusUpdate}
            />
          </Card>
        </div>
      </Content>

      {/* 任务表单弹窗组件 */}
      <TaskForm
        visible={isModalVisible}
        task={editingTask}
        onSubmit={handleTaskSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingTask(null);
        }}
      />

      {/* 悬浮操作按钮 */}
      <FloatingButton
        onClick={handleCreateTask}
        tooltip="快速创建任务"
      />
    </Layout>
  );
};

export default HomePage;