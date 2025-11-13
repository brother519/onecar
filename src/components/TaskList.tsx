/**
 * Tom cat
 * 
 * Task Management System - Task List Component
 * 
 * Features:
 * - Display task list in table format
 * - Support multi-select and batch operations
 * - Provide sorting and filtering functions
 * - Support edit, delete, status update for individual tasks
 * - Display pagination controls
 * - Due date warning display (overdue/today/tomorrow color markers)
 * 
 * Dependencies:
 * - Table: Ant Design table component
 * - Tag: Tag component for displaying status, priority, assignees
 * - Dropdown: Dropdown menu component
 * - Button: Button component
 * 
 * Table Column Configuration:
 * - Task Title: Supports text ellipsis and Tooltip display, click to edit
 * - Status: Display Tag, support filtering
 * - Priority: Display Tag, support filtering and sorting
 * - Assignees: Display multiple Tags
 * - Due Date: Support sorting, overdue displays in red
 * - Created At: Support sorting
 * - Actions: Status update, edit, delete
 * 
 * @module TaskList
 */

import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Dropdown, Menu } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Task, TaskStatus, TaskPriority, STATUS_CONFIG, PRIORITY_CONFIG } from '../types/task';
import dayjs from 'dayjs';

/**
 * Task list component props interface
 */
interface TaskListProps {
  /** Task list data array */
  tasks: Task[];
  
  /** Global loading state, controls table loading effect */
  loading: boolean;
  
  /** Array of currently selected task IDs for batch operations */
  selectedTaskIds: string[];
  
  /** 
   * Task selection state change callback
   * @param taskIds - New array of selected task IDs
   */
  onTaskSelect: (taskIds: string[]) => void;
  
  /** 
   * Task edit callback, opens edit form
   * @param task - Task object to edit
   */
  onTaskEdit: (task: Task) => void;
  
  /** 
   * Task delete callback
   * @param taskId - Task ID to delete
   */
  onTaskDelete: (taskId: string) => void;
  
  /** 
   * Task status update callback
   * @param taskId - Task ID to update
   * @param status - Target status
   */
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  
  /** 
   * Batch operation callback
   * @param operation - Operation type
   * @param taskIds - Array of task IDs to operate on
   */
  onBatchOperation: (operation: string, taskIds: string[]) => void;
}

/**
 * Task List Component
 * 
 * Main Features:
 * - Display task list data in table format
 * - Support multi-select and batch operations
 * - Provide sorting and filtering functions
 * - Support edit, delete, status update for individual tasks
 * - Display pagination controls
 * 
 * Special Display Logic:
 * - Due Date: Overdue displays in red, today in orange, tomorrow in gold
 * - Task Title: Supports text ellipsis and Tooltip display
 * 
 * @param {TaskListProps} props - Component props
 * @returns {JSX.Element} Task list table component
 */
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
  /**
   * Get task status update dropdown menu
   * 
   * Generates all available status options based on current task status
   * Current status option is disabled
   * 
   * @param {Task} task - Task object
   * @returns {JSX.Element} Ant Design Menu component
   */
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

  /**
   * Get task action menu
   * 
   * Generates dropdown menu containing edit and delete options
   * 
   * @param {Task} task - Task object
   * @returns {JSX.Element} Ant Design Menu component
   */
  const getActionMenu = (task: Task) => (
    <Menu
      items={[
        {
          key: 'edit',
          label: 'Edit',
          icon: <EditOutlined />,
          onClick: () => onTaskEdit(task)
        },
        {
          key: 'delete',
          label: 'Delete',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => onTaskDelete(task.id)
        }
      ]}
    />
  );

  const columns: ColumnsType<Task> = [
    {
      title: 'Task Title',
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
      title: 'Status',
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
      title: 'Priority',
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
      title: 'Assignees',
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
      title: 'Due Date',
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
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt: string) => dayjs(createdAt).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_, record: Task) => (
        <Space size="middle">
          <Dropdown overlay={getStatusMenu(record)} trigger={['click']}>
            <Button size="small" type="link">
              Status
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
    onSelectAll: (selected: boolean, _selectedRows: Task[], changeRows: Task[]) => {
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
            <span>Selected {selectedTaskIds.length} task(s)</span>
            <Button 
              size="small" 
              onClick={() => onBatchOperation('updateStatus', selectedTaskIds)}
            >
              Batch Update Status
            </Button>
            <Button 
              size="small" 
              danger 
              onClick={() => onBatchOperation('delete', selectedTaskIds)}
            >
              Batch Delete
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
            `Showing ${range[0]}-${range[1]} of ${total} record(s)`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        scroll={{ x: 1000 }}
        size="middle"
      />
    </div>
  );
};

export default TaskList;