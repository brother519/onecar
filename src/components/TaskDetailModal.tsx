import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Row,
  Col,
  Space,
  Button,
  Avatar,
  Descriptions,
  message
} from 'antd';
import { UserOutlined, TagOutlined } from '@ant-design/icons';
import { 
  TaskStatus, 
  TaskPriority, 
  statusConfig, 
  priorityConfig,
  TaskCreateRequest,
  TaskUpdateRequest
} from '../types';
import { useTaskStore } from '../store';
import { validateTaskForm, formatDate } from '../utils';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const TaskDetailModal: React.FC = () => {
  const {
    modalVisible,
    modalMode,
    currentTask,
    users,
    closeModal,
    createTask,
    updateTask
  } = useTaskStore();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  // 当模态框打开时，初始化表单数据
  useEffect(() => {
    if (modalVisible && currentTask) {
      form.setFieldsValue({
        title: currentTask.title,
        description: currentTask.description,
        priority: currentTask.priority,
        assigneeId: currentTask.assignee?.id,
        dueDate: currentTask.dueDate ? dayjs(currentTask.dueDate) : undefined,
        status: currentTask.status
      });
      setTags(currentTask.tags || []);
    } else if (modalVisible && modalMode === 'create') {
      form.resetFields();
      setTags([]);
    }
  }, [modalVisible, currentTask, modalMode, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const formData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigneeId: values.assigneeId,
        dueDate: values.dueDate?.toISOString(),
        tags: tags.length > 0 ? tags : undefined
      };

      // 表单验证
      const validation = validateTaskForm(formData);
      if (!validation.isValid) {
        Object.entries(validation.errors).forEach(([field, error]) => {
          message.error(error);
        });
        return;
      }

      setLoading(true);

      let success = false;
      if (modalMode === 'create') {
        success = await createTask(formData as TaskCreateRequest);
        if (success) {
          message.success('任务创建成功！');
        } else {
          message.error('任务创建失败，请重试');
        }
      } else if (modalMode === 'edit' && currentTask) {
        const updateData: TaskUpdateRequest = {
          ...formData,
          status: values.status
        };
        success = await updateTask(currentTask.id, updateData);
        if (success) {
          message.success('任务更新成功！');
        } else {
          message.error('任务更新失败，请重试');
        }
      }

      if (success) {
        closeModal();
      }
    } catch (error) {
      console.error('表单提交错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    closeModal();
  };

  const handleTagChange = (newTags: string[]) => {
    setTags(newTags);
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case 'create':
        return '新建任务';
      case 'edit':
        return '编辑任务';
      case 'view':
        return '任务详情';
      default:
        return '任务';
    }
  };

  const isReadOnly = modalMode === 'view';

  // 查看模式的内容
  if (isReadOnly && currentTask) {
    return (
      <Modal
        title={getModalTitle()}
        open={modalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="任务标题" span={2}>
            <strong>{currentTask.title}</strong>
          </Descriptions.Item>
          
          <Descriptions.Item label="任务状态">
            <Tag color={statusConfig[currentTask.status].color}>
              {statusConfig[currentTask.status].label}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="优先级">
            <Tag color={priorityConfig[currentTask.priority].color}>
              {priorityConfig[currentTask.priority].label}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="负责人">
            {currentTask.assignee ? (
              <Space>
                <Avatar 
                  size="small" 
                  src={currentTask.assignee.avatar}
                  icon={<UserOutlined />}
                />
                {currentTask.assignee.name}
              </Space>
            ) : (
              <span style={{ color: '#bfbfbf' }}>未分配</span>
            )}
          </Descriptions.Item>
          
          <Descriptions.Item label="截止时间">
            {currentTask.dueDate 
              ? formatDate(currentTask.dueDate) 
              : <span style={{ color: '#bfbfbf' }}>未设置</span>
            }
          </Descriptions.Item>
          
          <Descriptions.Item label="创建时间">
            {formatDate(currentTask.createdAt)}
          </Descriptions.Item>
          
          <Descriptions.Item label="更新时间">
            {formatDate(currentTask.updatedAt)}
          </Descriptions.Item>
          
          {currentTask.completedDate && (
            <Descriptions.Item label="完成时间" span={2}>
              {formatDate(currentTask.completedDate)}
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="任务描述" span={2}>
            {currentTask.description || (
              <span style={{ color: '#bfbfbf' }}>无描述</span>
            )}
          </Descriptions.Item>
          
          {currentTask.tags && currentTask.tags.length > 0 && (
            <Descriptions.Item label="标签" span={2}>
              <Space wrap>
                {currentTask.tags.map(tag => (
                  <Tag key={tag} icon={<TagOutlined />}>
                    {tag}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Modal>
    );
  }

  // 创建/编辑模式的表单
  return (
    <Modal
      title={getModalTitle()}
      open={modalVisible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
      okText={modalMode === 'create' ? '创建' : '保存'}
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.PENDING
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="title"
              label="任务标题"
              rules={[
                { required: true, message: '请输入任务标题' },
                { max: 100, message: '任务标题不能超过100个字符' }
              ]}
            >
              <Input placeholder="请输入任务标题" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select placeholder="选择优先级">
                {Object.entries(priorityConfig).map(([value, config]) => (
                  <Option key={value} value={value}>
                    <span style={{ color: config.color }}>●</span>
                    <span style={{ marginLeft: 6 }}>{config.label}</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          {modalMode === 'edit' && (
            <Col span={12}>
              <Form.Item
                name="status"
                label="任务状态"
                rules={[{ required: true, message: '请选择任务状态' }]}
              >
                <Select placeholder="选择状态">
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <Option key={value} value={value}>
                      <span style={{ color: config.color }}>●</span>
                      <span style={{ marginLeft: 6 }}>{config.label}</span>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="assigneeId"
              label="负责人"
            >
              <Select 
                placeholder="选择负责人" 
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
              >
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    <Space>
                      <Avatar 
                        size="small" 
                        src={user.avatar}
                        icon={<UserOutlined />}
                      />
                      {user.name}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="dueDate"
              label="截止时间"
            >
              <DatePicker
                style={{ width: '100%' }}
                showTime
                format="YYYY-MM-DD HH:mm"
                placeholder="选择截止时间"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="description"
              label="任务描述"
              rules={[
                { max: 1000, message: '任务描述不能超过1000个字符' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="请输入任务描述"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="标签">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="输入标签按回车添加"
                value={tags}
                onChange={handleTagChange}
                tokenSeparators={[',']}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default TaskDetailModal;