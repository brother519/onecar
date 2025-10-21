import React from 'react';
import { Modal, Form, Input, Select, DatePicker, Checkbox, Space, message } from 'antd';
import { TaskFormData, TaskPriority, PRIORITY_OPTIONS, Assignee } from '../types/task';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface TaskFormModalProps {
  visible: boolean;
  assignees: Assignee[];
  onSubmit: (formData: TaskFormData) => void;
  onCancel: () => void;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  assignees,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理日期格式
      const formData: TaskFormData = {
        title: values.title,
        description: values.description,
        assignees: values.assignees,
        priority: values.priority,
        dueDate: values.dueDate ? dayjs(values.dueDate).format('YYYY-MM-DD') : undefined
      };

      onSubmit(formData);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="创建任务"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={600}
      okText="创建"
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="title"
          label="任务标题"
          rules={[
            { required: true, message: '任务标题不能为空' },
            { min: 1, max: 200, message: '任务标题长度应在1-200字符之间' }
          ]}
        >
          <TextArea
            placeholder="请输入任务标题"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="任务描述"
          rules={[
            { max: 1000, message: '任务描述不能超过1000字符' }
          ]}
        >
          <TextArea
            placeholder="请输入任务描述（可选）"
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={1000}
            showCount
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
          name="dueDate"
          label="完成时间"
          rules={[
            {
              validator: (_, value) => {
                if (value && dayjs(value).isBefore(dayjs(), 'day')) {
                  return Promise.reject('完成时间不能早于今天');
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            placeholder="请选择完成时间（可选）"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskFormModal;
