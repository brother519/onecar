// React core import
import React from 'react';
// Ant Design UI components for table, tags, buttons, tooltips, dropdowns
import { Table, Tag, Space, Button, Checkbox, Tooltip, Dropdown, Menu } from 'antd';
// Ant Design icons for edit, delete, and more actions
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
// TypeScript type definition for table columns
import type { ColumnsType } from 'antd/es/table';
// Task-related types and configuration constants
import { Task, TaskStatus, TaskPriority, STATUS_CONFIG, PRIORITY_CONFIG } from '../types/task';
// Date manipulation library
import dayjs from 'dayjs';

/**
 * Props interface for TaskList component
 */
interface TaskListProps {
  /** Array of tasks to display in the table */
  tasks: Task[];
  /** Loading state for the table */
  loading: boolean;
  /** Array of currently selected task IDs */
  selectedTaskIds: string[];
  /** Callback function when task selection changes */
  onTaskSelect: (taskIds: string[]) => void;
  /** Callback function when a task is edited */
  onTaskEdit: (task: Task) => void;
  /** Callback function when a task is deleted */
  onTaskDelete: (taskId: string) => void;
  /** Callback function when task status is changed */
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  /** Callback function for batch operations on selected tasks */
  onBatchOperation: (operation: string, taskIds: string[]) => void;
}

/**
 * TaskList component - Displays tasks in a table format with advanced features
 * 
 * Features:
 * - Task display with sorting and filtering
 * - Batch operations (select multiple tasks)
 * - Status and priority indicators
 * - Due date highlighting
 * - Action menus for individual tasks
 * - Responsive design with scroll support
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
   * Creates a dropdown menu for changing task status
   * @param task - The task object for which to create the status menu
   * @returns Menu component with status options
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
   * Creates a dropdown menu for task actions (edit, delete)
   * @param task - The task object for which to create the action menu
   * @returns Menu component with action options
   */
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

  /**
   * Table column configuration
   * Defines how each column should be displayed, filtered, and sorted
   */
  const columns: ColumnsType<Task> = [
    {
      title: '任务标题', // Task Title
      dataIndex: 'title',
      key: 'title',
      ellipsis: {
        showTitle: false, // Disable default tooltip to use custom one
      },
      render: (title: string, record: Task) => (
        <Tooltip placement="topLeft" title={title}>
          <div 
            style={{ cursor: 'pointer' }}
            onClick={() => onTaskEdit(record)} // Click to edit task
          >
            {title}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '状态', // Status
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
      // Add filter options for all status types
      filters: Object.values(TaskStatus).map(status => ({
        text: STATUS_CONFIG[status].label,
        value: status,
      })),
      // Filter function to match status
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '优先级', // Priority
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
      // Add filter options for all priority types
      filters: Object.values(TaskPriority).map(priority => ({
        text: PRIORITY_CONFIG[priority].label,
        value: priority,
      })),
      // Filter function to match priority
      onFilter: (value, record) => record.priority === value,
      // Sort by priority weight (higher weight = higher priority)
      sorter: (a, b) => PRIORITY_CONFIG[a.priority].weight - PRIORITY_CONFIG[b.priority].weight,
    },
    {
      title: '负责人', // Assignees
      dataIndex: 'assignees',
      key: 'assignees',
      width: 150,
      render: (assignees: string[]) => (
        <Space size={[0, 4]} wrap>
          {/* Display each assignee as a blue tag */}
          {assignees.map(assignee => (
            <Tag key={assignee} color="blue">
              {assignee}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '截止日期', // Due Date
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (dueDate: string) => {
        if (!dueDate) return '-';
        const date = dayjs(dueDate);
        const now = dayjs();
        // Check date status for color coding
        const isOverdue = date.isBefore(now, 'day');
        const isToday = date.isSame(now, 'day');
        const isTomorrow = date.isSame(now.add(1, 'day'), 'day');
        
        // Apply color based on urgency
        let color = '';
        if (isOverdue) color = 'red';        // Overdue tasks in red
        else if (isToday) color = 'orange';   // Today's tasks in orange
        else if (isTomorrow) color = 'gold';  // Tomorrow's tasks in gold
        
        return (
          <span style={{ color }}>
            {date.format('YYYY-MM-DD')}
          </span>
        );
      },
      // Sort by due date, handling null values
      sorter: (a, b) => {
        if (!a.dueDate && !b.dueDate) return 0; // Both null, equal
        if (!a.dueDate) return 1;               // a is null, b comes first
        if (!b.dueDate) return -1;              // b is null, a comes first
        return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
      },
    },
    {
      title: '创建时间', // Created At
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt: string) => dayjs(createdAt).format('YYYY-MM-DD'),
      // Sort by creation date
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: '操作', // Actions
      key: 'action',
      width: 120,
      render: (_, record: Task) => (
        <Space size="middle">
          {/* Dropdown for status change */}
          <Dropdown overlay={getStatusMenu(record)} trigger={['click']}>
            <Button size="small" type="link">
              状态
            </Button>
          </Dropdown>
          {/* Dropdown for other actions (edit, delete) */}
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

  /**
   * Configuration for row selection (checkboxes)
   * Handles individual and bulk selection of tasks
   */
  const rowSelection = {
    selectedRowKeys: selectedTaskIds,
    // Handle individual row selection changes
    onChange: (selectedRowKeys: React.Key[]) => {
      onTaskSelect(selectedRowKeys as string[]);
    },
    // Handle "Select All" checkbox behavior
    onSelectAll: (selected: boolean, selectedRows: Task[], changeRows: Task[]) => {
      const changeIds = changeRows.map(row => row.id);
      if (selected) {
        // Add new selections to existing ones
        onTaskSelect([...selectedTaskIds, ...changeIds]);
      } else {
        // Remove deselected items from existing selections
        onTaskSelect(selectedTaskIds.filter(id => !changeIds.includes(id)));
      }
    },
  };

  return (
    <div>
      {/* Batch operation bar - shown when tasks are selected */}
      {selectedTaskIds.length > 0 && (
        <div style={{ marginBottom: 16, padding: '8px 16px', background: '#f0f2f5', borderRadius: '6px' }}>
          <Space>
            <span>已选择 {selectedTaskIds.length} 个任务</span> {/* Selected X tasks */}
            <Button 
              size="small" 
              onClick={() => onBatchOperation('updateStatus', selectedTaskIds)}
            >
              批量更新状态 {/* Batch update status */}
            </Button>
            <Button 
              size="small" 
              danger 
              onClick={() => onBatchOperation('delete', selectedTaskIds)}
            >
              批量删除 {/* Batch delete */}
            </Button>
          </Space>
        </div>
      )}
      
      {/* Main task table */}
      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id" // Use task ID as unique row key
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          showSizeChanger: true,     // Allow changing page size
          showQuickJumper: true,     // Allow jumping to specific page
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`, // "Showing X-Y of Z records"
          pageSizeOptions: ['10', '20', '50', '100'], // Available page sizes
        }}
        scroll={{ x: 1000 }} // Enable horizontal scroll for responsive design
        size="middle"        // Table size (compact/middle/large)
      />
    </div>
  );
};

export default TaskList;