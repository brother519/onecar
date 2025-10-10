import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Button,
  Row,
  Col,
  Pagination,
  Space,
  Typography,
  Checkbox,
  Popconfirm,
  FloatButton,
  Spin,
  Empty,
  Statistic,
  message
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTaskStore } from '../store';
import TaskFilterSection from './TaskFilterSection';
import TaskCard from './TaskCard';
import TaskDetailModal from './TaskDetailModal';
import { TaskStatus } from '../types';

const { Content } = Layout;
const { Title, Text } = Typography;

type ViewMode = 'card' | 'list';

const TaskManagementPage: React.FC = () => {
  const {
    tasks,
    total,
    loading,
    pagination,
    selectedTaskIds,
    modalVisible,
    loadTasks,
    setPagination,
    openModal,
    batchDeleteTasks,
    selectAllTasks,
    clearSelection
  } = useTaskStore();

  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // 组件挂载时加载任务
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = () => {
    openModal('create');
  };

  const handleRefresh = () => {
    loadTasks();
    message.success('任务列表已刷新');
  };

  const handleBatchDelete = async () => {
    if (selectedTaskIds.length === 0) {
      message.warning('请先选择要删除的任务');
      return;
    }

    const success = await batchDeleteTasks(selectedTaskIds);
    if (success) {
      message.success(`成功删除 ${selectedTaskIds.length} 个任务`);
    } else {
      message.error('批量删除失败，请重试');
    }
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      clearSelection();
    } else {
      selectAllTasks();
    }
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination({
      page,
      pageSize: pageSize || pagination.pageSize
    });
  };

  const handlePageSizeChange = (current: number, size: number) => {
    setPagination({
      page: 1,
      pageSize: size
    });
  };

  // 计算统计数据
  const getStatistics = () => {
    const pendingCount = tasks.filter(task => task.status === TaskStatus.PENDING).length;
    const inProgressCount = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const completedCount = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    
    return { pendingCount, inProgressCount, completedCount };
  };

  const { pendingCount, inProgressCount, completedCount } = getStatistics();

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '24px' }}>
        {/* 页面标题和统计 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              任务管理系统
            </Title>
            <Text type="secondary">
              管理您的任务，提升工作效率
            </Text>
          </Col>
          <Col>
            <Row gutter={16}>
              <Col>
                <Statistic 
                  title="待办" 
                  value={pendingCount} 
                  valueStyle={{ color: '#f59e0b' }}
                />
              </Col>
              <Col>
                <Statistic 
                  title="进行中" 
                  value={inProgressCount} 
                  valueStyle={{ color: '#3b82f6' }}
                />
              </Col>
              <Col>
                <Statistic 
                  title="已完成" 
                  value={completedCount} 
                  valueStyle={{ color: '#10b981' }}
                />
              </Col>
            </Row>
          </Col>
        </Row>

        {/* 筛选区域 */}
        <TaskFilterSection />

        {/* 操作工具栏 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateTask}
                >
                  新建任务
                </Button>
                
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={loading}
                >
                  刷新
                </Button>

                {tasks.length > 0 && (
                  <Checkbox
                    indeterminate={
                      selectedTaskIds.length > 0 && selectedTaskIds.length < tasks.length
                    }
                    checked={tasks.length > 0 && selectedTaskIds.length === tasks.length}
                    onChange={handleSelectAll}
                  >
                    全选 ({selectedTaskIds.length}/{tasks.length})
                  </Checkbox>
                )}

                {selectedTaskIds.length > 0 && (
                  <Popconfirm
                    title={`确定要删除选中的 ${selectedTaskIds.length} 个任务吗？`}
                    icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                    onConfirm={handleBatchDelete}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button 
                      danger
                      icon={<DeleteOutlined />}
                    >
                      批量删除 ({selectedTaskIds.length})
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Col>

            <Col>
              <Space>
                <Text type="secondary">
                  共 {total} 个任务
                </Text>
                
                <Button.Group>
                  <Button
                    icon={<AppstoreOutlined />}
                    type={viewMode === 'card' ? 'primary' : 'default'}
                    onClick={() => setViewMode('card')}
                  />
                  <Button
                    icon={<BarsOutlined />}
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                  />
                </Button.Group>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 任务列表 */}
        <Spin spinning={loading}>
          {tasks.length === 0 ? (
            <Card>
              <Empty
                description="暂无任务"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTask}>
                  创建第一个任务
                </Button>
              </Empty>
            </Card>
          ) : (
            <>
              {viewMode === 'card' ? (
                <Row gutter={[16, 16]}>
                  {tasks.map(task => (
                    <Col key={task.id} xs={24} sm={12} lg={8} xl={6}>
                      <TaskCard task={task} selectable />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div>
                  {tasks.map(task => (
                    <TaskCard key={task.id} task={task} selectable />
                  ))}
                </div>
              )}

              {/* 分页 */}
              {total > pagination.pageSize && (
                <Row justify="center" style={{ marginTop: 24 }}>
                  <Pagination
                    current={pagination.page}
                    pageSize={pagination.pageSize}
                    total={total}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageSizeChange}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) =>
                      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                    }
                    pageSizeOptions={['10', '20', '50', '100']}
                  />
                </Row>
              )}
            </>
          )}
        </Spin>

        {/* 任务详情模态框 */}
        {modalVisible && <TaskDetailModal />}

        {/* 浮动按钮 */}
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          onClick={handleCreateTask}
          tooltip="新建任务"
        />
      </Content>
    </Layout>
  );
};

export default TaskManagementPage;