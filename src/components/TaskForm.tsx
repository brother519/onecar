/**
 * Tom cat
 * 
 * 任务管理系统 - 任务表单组件
 * 
 * 功能说明：
 * - 支持新建和编辑任务两种模式
 * - 提供完整的表单验证机制
 * - 支持任务标题、描述、优先级、负责人、截止日期输入
 * - 编辑模式下自动预填充现有数据
 * - 实时字符数统计和限制
 * 
 * 依赖组件：
 * - Modal: 弹窗容器
 * - Form: Ant Design表单组件
 * - Input/TextArea: 输入框
 * - Select: 选择器
 * - DatePicker: 日期选择器
 * 
 * 表单模式：
 * - 新建模式：editingTask为null，表单为空白状态
 * - 编辑模式：editingTask非空，表单预填充任务数据
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
 * 任务表单组件属性接口
 */
interface TaskFormProps {
  /** 弹窗显示状态 */
  visible: boolean;
  
  /** 
   * 当前编辑的任务对象
   * null时为新建模式，非空时为编辑模式
   */
  editingTask: Task | null;
  
  /** 
   * 取消按钮回调函数
   * 关闭弹窗并重置表单
   */
  onCancel: () => void;
  
  /** 
   * 表单提交回调函数
   * @param formData - 表单数据对象
   */
  onSubmit: (formData: TaskFormData) => void;
  
  /** 可选的负责人列表 */
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
        /** 编辑模式：填充现有数据 */
        form.setFieldsValue({
          title: editingTask.title,
          description: editingTask.description || '',
          priority: editingTask.priority,
          assignees: editingTask.assignees,
          dueDate: editingTask.dueDate ? dayjs(editingTask.dueDate) : null,
        });
      } else {
        /** 新建模式：重置表单 */
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

  /**
   * 表单验证规则配置
   * 
   * 包含所有表单字段的验证规则：
   * - title: 必填，1-100字符
   * - description: 可选，最多1000字符
   * - priority: 必填
   * - assignees: 必填，至少一人
   * - dueDate: 可选，不能早于今天
   */
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
      { type: 'array' as const, min: 1, message: '请至少选择一名负责人' }
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