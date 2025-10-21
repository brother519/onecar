import React from 'react';
import { List, Tag, Space, Avatar, Typography, Empty } from 'antd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Task, getPriorityLabel, getPriorityColor, getStatusLabel, getStatusColor } from '../types/task';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  loading?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskClick, loading = false }) => {
  if (!loading && tasks.length === 0) {
    return (
      <Empty
        description="暂无任务，点击右下角按钮创建新任务"
        style={{ marginTop: 50 }}
      />
    );
  }

  return (
    <List
      loading={loading}
      dataSource={tasks}
      renderItem={(task) => (
        <List.Item
          onClick={() => onTaskClick(task)}
          style={{
            cursor: 'pointer',
            padding: '16px 24px',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            marginBottom: 12,
            transition: 'all 0.3s',
            background: '#fff'
          }}
          className="task-list-item"
        >
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Space align="start">
                <Text strong style={{ fontSize: 16 }}>
                  {task.title}
                </Text>
                <Tag color={getPriorityColor(task.priority)}>
                  {getPriorityLabel(task.priority)}
                </Tag>
                <Tag color={getStatusColor(task.status)}>
                  {getStatusLabel(task.status)}
                </Tag>
              </Space>
            </div>

            {task.description && (
              <Paragraph
                ellipsis={{ rows: 2 }}
                style={{ marginBottom: 12, color: '#666' }}
              >
                {task.description}
              </Paragraph>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Avatar.Group maxCount={3}>
                  {task.assignees.map(assignee => (
                    <Avatar
                      key={assignee.id}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    >
                      {assignee.name.charAt(0)}
                    </Avatar>
                  ))}
                </Avatar.Group>
                <Text type="secondary">
                  {task.assignees.map(a => a.name).join(', ')}
                </Text>
              </Space>

              {task.dueDate && (
                <Space>
                  <ClockCircleOutlined style={{ color: '#999' }} />
                  <Text type="secondary">
                    {dayjs(task.dueDate).format('YYYY-MM-DD')}
                  </Text>
                </Space>
              )}
            </div>
          </div>
        </List.Item>
      )}
    />
  );
};

export default TaskList;
