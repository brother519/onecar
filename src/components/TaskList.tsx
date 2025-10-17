import React from 'react';
import { Table, Tag, Space, Button, Checkbox, Tooltip, Dropdown, Menu } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Task, TaskStatus, TaskPriority, STATUS_CONFIG, PRIORITY_CONFIG } from '../types/task';
import dayjs from 'dayjs';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  selectedTaskIds: string[];
  onTaskSelect: (taskIds: string[]) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  onBatchOperation: (operation: string, taskIds: string[]) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  loading,
  selectedTaskIds,
  onTaskSelect,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onBatchOperation
}) => {
  const getStatusMenu = (task: Task) => (
    <Menu
      items={Object.values(TaskStatus).map(status => ({
        key: status,
        label: STATUS_CONFIG[status].label,
        disabled: task.status === status,
        onClick: () => onTaskStatusChange(task.id, status)
      }))}
    />
  );

  const getActionMenu = (task: Task) => (
    <Menu
      items={[
        {
          key: 'edit',
          label: '编辑',
          icon: <EditOutlined />,
          onClick: () => onTaskEdit(task)
        },
        {
          key: 'delete',
          label: '删除',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => onTaskDelete(task.id)
        }
      ]}
    />
  );

  const columns: ColumnsType<Task> = [
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: {
        showTitle: false,
      },
      render: (title: string, record: Task) => (
        <Tooltip placement="topLeft" title={title}>
          <div 
            style={{ cursor: 'pointer' }}
            onClick={() => onTaskEdit(record)}
          >
            {title}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => {
        const config = STATUS_CONFIG[status];
        return (
          <Tag color={config.color}>
            {config.label}
          </Tag>
        );
      },
      filters: Object.values(TaskStatus).map(status => ({
        text: STATUS_CONFIG[status].label,
        value: status,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: TaskPriority) => {
        const config = PRIORITY_CONFIG[priority];
        return (
          <Tag color={config.color}>
            {config.label}
          </Tag>
        );
      },
      filters: Object.values(TaskPriority).map(priority => ({
        text: PRIORITY_CONFIG[priority].label,
        value: priority,
      })),
      onFilter: (value, record) => record.priority === value,
      sorter: (a, b) => PRIORITY_CONFIG[a.priority].weight - PRIORITY_CONFIG[b.priority].weight,
    },
    {
      title: '负责人',
      dataIndex: 'assignees',
      key: 'assignees',
      width: 150,
      render: (assignees: string[]) => (
        <Space size={[0, 4]} wrap>
          {assignees.map(assignee => (
            <Tag key={assignee} color="blue">
              {assignee}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (dueDate: string) => {
        if (!dueDate) return '-';
        const date = dayjs(dueDate);
        const now = dayjs();
        const isOverdue = date.isBefore(now, 'day');
        const isToday = date.isSame(now, 'day');
        const isTomorrow = date.isSame(now.add(1, 'day'), 'day');
        
        let color = '';
        if (isOverdue) color = 'red';
        else if (isToday) color = 'orange';
        else if (isTomorrow) color = 'gold';
        
        return (
          <span style={{ color }}>
            {date.format('YYYY-MM-DD')}
          </span>
        );
      },
      sorter: (a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt: string) => dayjs(createdAt).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: Task) => (
        <Space size="middle">
          <Dropdown overlay={getStatusMenu(record)} trigger={['click']}>
            <Button size="small" type="link">
              状态
            </Button>
          </Dropdown>
          <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
            <Button 
              size="small" 
              type="text" 
              icon={<MoreOutlined />}
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedTaskIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      onTaskSelect(selectedRowKeys as string[]);
    },
    onSelectAll: (selected: boolean, selectedRows: Task[], changeRows: Task[]) => {
      const changeIds = changeRows.map(row => row.id);
      if (selected) {
        onTaskSelect([...selectedTaskIds, ...changeIds]);
      } else {
        onTaskSelect(selectedTaskIds.filter(id => !changeIds.includes(id)));
      }
    },
  };

  return (
    <div>
      {selectedTaskIds.length > 0 && (
        <div style={{ marginBottom: 16, padding: '8px 16px', background: '#f0f2f5', borderRadius: '6px' }}>
          <Space>
            <span>已选择 {selectedTaskIds.length} 个任务</span>
            <Button 
              size="small" 
              onClick={() => onBatchOperation('updateStatus', selectedTaskIds)}
            >
              批量更新状态
            </Button>
            <Button 
              size="small" 
              danger 
              onClick={() => onBatchOperation('delete', selectedTaskIds)}
            >
              批量删除
            </Button>
          </Space>
        </div>
      )}
      
      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        scroll={{ x: 1000 }}
        size="middle"
      />
    </div>
  );
};

export default TaskList;