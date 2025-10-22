/**
 * 任务卡片组件
 * 展示单个任务的详细信息，支持查看、编辑、删除操作
 * 支持多选模式，用于批量操作
 */
import React from 'react';
import { Card, Tag, Avatar, Checkbox, Button, Popconfirm, Tooltip } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  CalendarOutlined, 
  UserOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Task, statusConfig, priorityConfig } from '../types';
import { formatDate, isOverdue } from '../utils';
import { useTaskStore } from '../store';

/**
 * 任务卡片组件属性
 */
interface TaskCardProps {
  task: Task;           // 任务数据
  selectable?: boolean; // 是否支持多选
}

/**
 * 任务卡片组件
 * @param {TaskCardProps} props - 组件属性
 * @returns {React.ReactElement}
 */
const TaskCard: React.FC<TaskCardProps> = ({ task, selectable = false }) => {
  const { 
    selectedTaskIds, 
    toggleTaskSelection, 
    openModal, 
    deleteTask 
  } = useTaskStore();

  const isSelected = selectedTaskIds.includes(task.id);
  const isTaskOverdue = task.dueDate && isOverdue(task.dueDate);

  const handleEdit = () => {
    openModal('edit', task);
  };

  const handleView = () => {
    openModal('view', task);
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
  };

  const handleCheckboxChange = () => {
    toggleTaskSelection(task.id);
  };

  const statusColor = statusConfig[task.status].color;
  const priorityColor = priorityConfig[task.priority].color;

  return (
    <Card
      className={`task-card ${isSelected ? 'selected' : ''}`}
      bodyStyle={{ padding: '16px' }}
      style={{
        borderLeft: `4px solid ${statusColor}`,
        marginBottom: 16,
        background: isSelected ? '#f0f8ff' : '#fff',
        borderColor: isSelected ? '#1890ff' : '#d9d9d9'
      }}
      hoverable
    >
      <div className="task-card-header">
        <div className="task-card-title-section">
          {selectable && (
            <Checkbox
              checked={isSelected}
              onChange={handleCheckboxChange}
              style={{ marginRight: 8 }}
            />
          )}
          <div className="task-title-content">
            <h4 
              className="task-title"
              style={{ 
                margin: 0, 
                fontSize: '16px', 
                fontWeight: 600,
                color: '#262626'
              }}
            >
              {task.title}
            </h4>
            <div className="task-tags" style={{ marginTop: 4 }}>
              <Tag 
                color={priorityColor}
                style={{ fontSize: '12px' }}
              >
                {priorityConfig[task.priority].label}
              </Tag>
              <Tag 
                color={statusColor}
                style={{ fontSize: '12px' }}
              >
                {statusConfig[task.status].label}
              </Tag>
              {task.tags?.map(tag => (
                <Tag key={tag} style={{ fontSize: '12px' }}>
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        </div>
        
        <div className="task-card-actions">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={handleView}
            />
          </Tooltip>
          <Tooltip title="编辑任务">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={handleEdit}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个任务吗？"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            onConfirm={handleDelete}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除任务">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </div>
      </div>

      {task.description && (
        <div 
          className="task-description"
          style={{ 
            margin: '12px 0',
            color: '#595959',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        >
          {task.description.length > 100 
            ? `${task.description.slice(0, 100)}...` 
            : task.description
          }
        </div>
      )}

      <div 
        className="task-card-footer"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #f0f0f0'
        }}
      >
        <div className="task-assignee">
          {task.assignee ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                size="small" 
                src={task.assignee.avatar}
                icon={<UserOutlined />}
                style={{ marginRight: 6 }}
              />
              <span style={{ fontSize: '12px', color: '#595959' }}>
                {task.assignee.name}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: '#bfbfbf' }}>
              未分配
            </span>
          )}
        </div>

        <div className="task-dates">
          {task.dueDate && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '12px',
                color: isTaskOverdue ? '#ff4d4f' : '#595959'
              }}
            >
              <CalendarOutlined style={{ marginRight: 4 }} />
              <span>
                {formatDate(task.dueDate, 'MM-DD HH:mm')}
                {isTaskOverdue && (
                  <span style={{ color: '#ff4d4f', marginLeft: 4 }}>
                    (已过期)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;