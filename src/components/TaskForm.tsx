import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Space, Button, message } from 'antd';
import { Task, TaskPriority, TaskFormData, PRIORITY_CONFIG } from '../types/task';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface TaskFormProps {
  visible: boolean;
  editingTask: Task | null;
  onCancel: () => void;
  onSubmit: (formData: TaskFormData) => void;
  availableAssignees: string[];
}

const TaskForm: React.FC<TaskFormProps> = ({
  visible,
  editingTask,
  onCancel,
  onSubmit,
  availableAssignees
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (editingTask) {
        // 编辑模式：填充现有数据
        form.setFieldsValue({
          title: editingTask.title,
          description: editingTask.description || '',
          priority: editingTask.priority,
          assignees: editingTask.assignees,
          dueDate: editingTask.dueDate ? dayjs(editingTask.dueDate) : null,
        });
      } else {
        // 新建模式：重置表单
        form.resetFields();
        form.setFieldsValue({
          priority: TaskPriority.MEDIUM, // 默认中优先级
          assignees: [],
        });
      }
    }
  }, [visible, editingTask, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData: TaskFormData = {
        title: values.title.trim(),
        description: values.description?.trim() || '',
        priority: values.priority,
        assignees: values.assignees,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
      };
      onSubmit(formData);
    } catch (errorInfo) {
      console.log('表单验证失败:', errorInfo);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // 验证规则
  const validationRules = {
    title: [
      { required: true, message: '任务标题不能为空' },
      { max: 100, message: '任务标题不能超过100字符' },
      { min: 1, message: '任务标题不能为空' }
    ],
    description: [
      { max: 1000, message: '任务描述不能超过1000字符' }
    ],
    priority: [
      { required: true, message: '请选择任务优先级' }
    ],
    assignees: [
      { required: true, message: '请至少选择一名负责人' },
      { type: 'array', min: 1, message: '请至少选择一名负责人' }
    ],
    dueDate: [
      {
        validator: (_: any, value: any) => {
          if (value && value.isBefore(dayjs(), 'day')) {
            return Promise.reject(new Error('截止日期不能早于今天'));
          }
          return Promise.resolve();
        }
      }
    ]
  };

  return (
    <Modal
      title={editingTask ? '编辑任务' : '新建任务'}
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {editingTask ? '更新' : '创建'}
        </Button>,
      ]}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="title"
          label="任务标题"
          rules={validationRules.title}
        >
          <Input 
            placeholder="请输入任务标题"
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="任务描述"
          rules={validationRules.description}
        >
          <TextArea
            placeholder="请输入任务描述（可选）"
            rows={4}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Space style={{ width: '100%' }} size="large">
          <Form.Item
            name="priority"
            label="优先级"
            rules={validationRules.priority}
            style={{ flex: 1 }}
          >
            <Select placeholder="请选择优先级">
              {Object.values(TaskPriority).map(priority => (
                <Option key={priority} value={priority}>
                  <Space>
                    <span style={{ color: PRIORITY_CONFIG[priority].color }}>
                      ●
                    </span>
                    {PRIORITY_CONFIG[priority].label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="截止日期"
            rules={validationRules.dueDate}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择截止日期（可选）"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Space>

        <Form.Item
          name="assignees"
          label="负责人"
          rules={validationRules.assignees}
        >
          <Select
            mode="multiple"
            placeholder="请选择负责人"
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {availableAssignees.map(assignee => (
              <Option key={assignee} value={assignee}>
                {assignee}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskForm;