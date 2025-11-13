/**
 * Tom cat
 * 
 * Task Management System - Task Form Component
 * 
 * Features:
 * - Supports both create and edit task modes
 * - Provides complete form validation mechanism
 * - Supports task title, description, priority, assignee, due date inputs
 * - Auto-fills existing data in edit mode
 * - Real-time character count and limit
 * 
 * Dependencies:
 * - Modal: Dialog container
 * - Form: Ant Design form component
 * - Input/TextArea: Input fields
 * - Select: Dropdown selector
 * - DatePicker: Date picker
 * 
 * Form Modes:
 * - Create mode: editingTask is null, form is blank
 * - Edit mode: editingTask is not null, form is pre-filled with task data
 * 
 * @module TaskForm
 */

import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Space, Button } from 'antd';
import { Task, TaskPriority, TaskFormData, PRIORITY_CONFIG } from '../types/task';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Task form component props interface
 */
interface TaskFormProps {
  /** Modal visibility state */
  visible: boolean;
  
  /** 
   * Currently editing task object
   * null: create mode, non-null: edit mode
   */
  editingTask: Task | null;
  
  /** 
   * Cancel button callback function
   * Close modal and reset form
   */
  onCancel: () => void;
  
  /** 
   * Form submit callback function
   * @param formData - Form data object
   */
  onSubmit: (formData: TaskFormData) => void;
  
  /** List of available assignees */
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
        /** Edit mode: Fill in existing data */
        form.setFieldsValue({
          title: editingTask.title,
          description: editingTask.description || '',
          priority: editingTask.priority,
          assignees: editingTask.assignees,
          dueDate: editingTask.dueDate ? dayjs(editingTask.dueDate) : null,
        });
      } else {
        /** Create mode: Reset form */
        form.resetFields();
        form.setFieldsValue({
          priority: TaskPriority.MEDIUM, // Default medium priority
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
      console.log('Form validation failed:', errorInfo);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  /**
   * Form validation rules configuration
   * 
   * Contains validation rules for all form fields:
   * - title: Required, 1-100 characters
   * - description: Optional, max 1000 characters
   * - priority: Required
   * - assignees: Required, at least one person
   * - dueDate: Optional, cannot be earlier than today
   */
  const validationRules = {
    title: [
      { required: true, message: 'Task title cannot be empty' },
      { max: 100, message: 'Task title cannot exceed 100 characters' },
      { min: 1, message: 'Task title cannot be empty' }
    ],
    description: [
      { max: 1000, message: 'Task description cannot exceed 1000 characters' }
    ],
    priority: [
      { required: true, message: 'Please select task priority' }
    ],
    assignees: [
      { required: true, message: 'Please select at least one assignee' },
      { type: 'array' as const, min: 1, message: 'Please select at least one assignee' }
    ],
    dueDate: [
      {
        validator: (_: any, value: any) => {
          if (value && value.isBefore(dayjs(), 'day')) {
            return Promise.reject(new Error('Due date cannot be earlier than today'));
          }
          return Promise.resolve();
        }
      }
    ]
  };

  return (
    <Modal
      title={editingTask ? 'Edit Task' : 'Create Task'}
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {editingTask ? 'Update' : 'Create'}
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
          label="Task Title"
          rules={validationRules.title}
        >
          <Input 
            placeholder="Please enter task title"
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Task Description"
          rules={validationRules.description}
        >
          <TextArea
            placeholder="Please enter task description (optional)"
            rows={4}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Space style={{ width: '100%' }} size="large">
          <Form.Item
            name="priority"
            label="Priority"
            rules={validationRules.priority}
            style={{ flex: 1 }}
          >
            <Select placeholder="Please select priority">
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
            label="Due Date"
            rules={validationRules.dueDate}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Please select due date (optional)"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Space>

        <Form.Item
          name="assignees"
          label="Assignees"
          rules={validationRules.assignees}
        >
          <Select
            mode="multiple"
            placeholder="Please select assignees"
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