import React, { useState } from 'react';
import { Modal, Descriptions, Tag, Space, Button, Form, Select, Checkbox, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import {
  Task,
  Assignee,
  getPriorityLabel,
  getPriorityColor,
  getStatusLabel,
  getStatusColor,
  PRIORITY_OPTIONS,
  TaskPriority
} from '../types/task';
import dayjs from 'dayjs';

interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  assignees: Assignee[];
  onUpdate: (taskId: string | number, updates: { assignees?: (string | number)[]; priority?: TaskPriority }) => void;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  assignees,
  onUpdate,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  if (!task) return null;

  const handleEdit = () => {
    form.setFieldsValue({
      assignees: task.assignees.map(a => a.id),
      priority: task.priority
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onUpdate(task.id, values);
      setIsEditing(false);
      message.success('任务更新成功');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleClose = () => {
    setIsEditing(false);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <span>任务详情</span>
          {!isEditing && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              编辑
            </Button>
          )}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={
        isEditing ? (
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" onClick={handleSave}>保存</Button>
          </Space>
        ) : (
          <Button type="primary" onClick={handleClose}>关闭</Button>
        )
      }
    >
      {!isEditing ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="任务标题">
            {task.title}
          </Descriptions.Item>
          
          <Descriptions.Item label="任务描述">
            {task.description || '无'}
          </Descriptions.Item>
          
          <Descriptions.Item label="任务状态">
            <Tag color={getStatusColor(task.status)}>
              {getStatusLabel(task.status)}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="优先级">
            <Tag color={getPriorityColor(task.priority)}>
              {getPriorityLabel(task.priority)}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="负责人">
            <Space wrap>
              {task.assignees.map(assignee => (
                <Tag key={assignee.id} color="blue">
                  {assignee.name}
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="完成时间">
            {task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : '未设置'}
          </Descriptions.Item>
          
          <Descriptions.Item label="创建时间">
            {dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          
          <Descriptions.Item label="更新时间">
            {dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item label="任务标题">
            <div style={{ padding: '8px 0' }}>{task.title}</div>
          </Form.Item>

          <Form.Item label="任务描述">
            <div style={{ padding: '8px 0' }}>{task.description || '无'}</div>
          </Form.Item>

          <Form.Item label="任务状态">
            <div style={{ padding: '8px 0' }}>
              <Tag color={getStatusColor(task.status)}>
                {getStatusLabel(task.status)}
              </Tag>
            </div>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[
              { required: true, message: '请选择任务优先级' }
            ]}
          >
            <Select
              placeholder="请选择优先级"
              options={PRIORITY_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            name="assignees"
            label="任务负责人"
            rules={[
              { required: true, message: '请至少选择一个任务负责人' },
              {
                validator: (_, value) => {
                  if (!value || value.length === 0) {
                    return Promise.reject('请至少选择一个任务负责人');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical">
                {assignees.map(assignee => (
                  <Checkbox key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item label="完成时间">
            <div style={{ padding: '8px 0' }}>
              {task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : '未设置'}
            </div>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default TaskDetailModal;
