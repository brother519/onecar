/**
 * Tom cat
 * 
 * 任务管理系统 - 任务列表组件
 * 
 * 功能说明：
 * - 以表格形式展示任务列表
 * - 支持多选和批量操作
 * - 提供排序、筛选功能
 * - 支持单个任务的编辑、删除、状态更新
 * - 显示分页控件
 * - 截止日期预警显示(过期/今天/明天颜色标记)
 * 
 * 依赖组件：
 * - Table: Ant Design表格组件
 * - Tag: 标签组件用于显示状态、优先级、负责人
 * - Dropdown: 下拉菜单组件
 * - Button: 按钮组件
 * 
 * 表格列配置：
 * - 任务标题：支持文本省略和Tooltip显示，点击进入编辑
 * - 状态：显示Tag，支持筛选
 * - 优先级：显示Tag，支持筛选和排序
 * - 负责人：显示多个Tag
 * - 截止日期：支持排序，过期显示红色
 * - 创建时间：支持排序
 * - 操作：状态更新、编辑、删除
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
 * 任务列表组件属性接口
 */
interface TaskListProps {
  /** 任务列表数据数组 */
  tasks: Task[];
  
  /** 全局加载状态，控制表格loading效果 */
  loading: boolean;
  
  /** 当前选中的任务ID数组，用于批量操作 */
  selectedTaskIds: string[];
  
  /** 
   * 任务选中状态变更回调
   * @param taskIds - 新的选中任务ID数组
   */
  onTaskSelect: (taskIds: string[]) => void;
  
  /** 
   * 任务编辑回调，打开编辑表单
   * @param task - 要编辑的任务对象
   */
  onTaskEdit: (task: Task) => void;
  
  /** 
   * 任务删除回调
   * @param taskId - 要删除的任务ID
   */
  onTaskDelete: (taskId: string) => void;
  
  /** 
   * 任务状态更新回调
   * @param taskId - 要更新的任务ID
   * @param status - 目标状态
   */
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  
  /** 
   * 批量操作回调
   * @param operation - 操作类型
   * @param taskIds - 要操作的任务ID数组
   */
  onBatchOperation: (operation: string, taskIds: string[]) => void;
}

/**
 * 任务列表组件
 * 
 * 主要功能：
 * - 以表格形式展示任务列表数据
 * - 支持多选和批量操作
 * - 提供排序、筛选功能
 * - 支持单个任务的编辑、删除、状态更新
 * - 显示分页控件
 * 
 * 特殊显示逻辑：
 * - 截止日期：过期显示红色，今天显示橙色，明天显示金色
 * - 任务标题：支持文本省略和Tooltip显示
 * 
 * @param {TaskListProps} props - 组件属性
 * @returns {JSX.Element} 任务列表表格组件
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
   * 获取任务状态更新下拉菜单
   * 
   * 根据当前任务状态，生成所有可用状态选项
   * 当前状态的选项为禁用状态
   * 
   * @param {Task} task - 任务对象
   * @returns {JSX.Element} Ant Design的Menu组件
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
   * 获取任务操作菜单
   * 
   * 生成包含编辑和删除选项的下拉菜单
   * 
   * @param {Task} task - 任务对象
   * @returns {JSX.Element} Ant Design的Menu组件
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