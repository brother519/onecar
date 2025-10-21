import React from 'react';
import { Input, Select, Space, Card } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { TaskStatus, TaskPriority, FilterConditions, STATUS_OPTIONS, PRIORITY_OPTIONS, Assignee } from '../types/task';

const { Search } = Input;

interface TaskFilterProps {
  assignees: Assignee[];
  filters: FilterConditions;
  onFilterChange: (filters: FilterConditions) => void;
}

const TaskFilter: React.FC<TaskFilterProps> = ({ assignees, filters, onFilterChange }) => {
  const handleKeywordChange = (value: string) => {
    onFilterChange({ ...filters, keyword: value });
  };

  const handleStatusChange = (value: TaskStatus | undefined) => {
    onFilterChange({ ...filters, status: value });
  };

  const handlePriorityChange = (value: TaskPriority | undefined) => {
    onFilterChange({ ...filters, priority: value });
  };

  const handleAssigneeChange = (values: (string | number)[]) => {
    onFilterChange({ ...filters, assigneeIds: values });
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Search
          placeholder="搜索任务标题或描述"
          prefix={<SearchOutlined />}
          allowClear
          value={filters.keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          style={{ width: '100%' }}
        />
        
        <Space wrap style={{ width: '100%' }}>
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: 150 }}
            value={filters.status}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
          />
          
          <Select
            placeholder="选择优先级"
            allowClear
            style={{ width: 150 }}
            value={filters.priority}
            onChange={handlePriorityChange}
            options={PRIORITY_OPTIONS}
          />
          
          <Select
            mode="multiple"
            placeholder="选择负责人"
            allowClear
            style={{ minWidth: 200 }}
            value={filters.assigneeIds}
            onChange={handleAssigneeChange}
            options={assignees.map(a => ({ label: a.name, value: a.id }))}
            maxTagCount="responsive"
          />
        </Space>
      </Space>
    </Card>
  );
};

export default TaskFilter;
