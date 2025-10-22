/**
 * 任务筛选区域组件
 * 提供关键词搜索、状态、负责人、优先级、时间范围等多维度筛选功能
 * 支持防抖搜索和筛选条件展示
 */
import React, { useEffect } from 'react';
import { 
  Row, 
  Col, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Card,
  Space
} from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { TaskStatus, TaskPriority, statusConfig, priorityConfig } from '../types';
import { useTaskStore } from '../store';
import { debounce } from '../utils';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 任务筛选区域组件
 * @returns {React.ReactElement}
 */
const TaskFilterSection: React.FC = () => {
  const { 
    filters, 
    users, 
    setFilters, 
    resetFilters, 
    loadUsers 
  } = useTaskStore();

  // 组件挂载时加载用户列表
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 防抖搜索
  const debouncedSearch = debounce((keyword: string) => {
    setFilters({ keyword: keyword || undefined });
  }, 500);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleStatusChange = (status: TaskStatus[]) => {
    setFilters({ status: status.length > 0 ? status : undefined });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    setFilters({ assigneeId: assigneeId || undefined });
  };

  const handlePriorityChange = (priority: TaskPriority[]) => {
    setFilters({ priority: priority.length > 0 ? priority : undefined });
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      });
    } else {
      setFilters({ startDate: undefined, endDate: undefined });
    }
  };

  const handleReset = () => {
    resetFilters();
  };

  // 获取日期范围的默认值
  const getDateRangeValue = () => {
    if (filters.startDate && filters.endDate) {
      return [dayjs(filters.startDate), dayjs(filters.endDate)];
    }
    return undefined;
  };

  return (
    <Card 
      title="任务筛选" 
      size="small"
      style={{ marginBottom: 16 }}
      extra={
        <Button 
          icon={<ClearOutlined />} 
          onClick={handleReset}
          size="small"
        >
          重置
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        {/* 关键词搜索 */}
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="搜索任务标题或描述"
            prefix={<SearchOutlined />}
            defaultValue={filters.keyword}
            onChange={handleKeywordChange}
            allowClear
          />
        </Col>

        {/* 状态筛选 */}
        <Col xs={24} sm={12} md={4}>
          <Select
            mode="multiple"
            placeholder="选择状态"
            style={{ width: '100%' }}
            value={filters.status}
            onChange={handleStatusChange}
            allowClear
            maxTagCount={2}
          >
            {Object.entries(statusConfig).map(([value, config]) => (
              <Option key={value} value={value}>
                <span style={{ color: config.color }}>●</span>
                <span style={{ marginLeft: 6 }}>{config.label}</span>
              </Option>
            ))}
          </Select>
        </Col>

        {/* 负责人筛选 */}
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="选择负责人"
            style={{ width: '100%' }}
            value={filters.assigneeId}
            onChange={handleAssigneeChange}
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
                {user.name}
              </Option>
            ))}
          </Select>
        </Col>

        {/* 优先级筛选 */}
        <Col xs={24} sm={12} md={4}>
          <Select
            mode="multiple"
            placeholder="选择优先级"
            style={{ width: '100%' }}
            value={filters.priority}
            onChange={handlePriorityChange}
            allowClear
            maxTagCount={2}
          >
            {Object.entries(priorityConfig).map(([value, config]) => (
              <Option key={value} value={value}>
                <span style={{ color: config.color }}>●</span>
                <span style={{ marginLeft: 6 }}>{config.label}</span>
              </Option>
            ))}
          </Select>
        </Col>

        {/* 时间范围筛选 */}
        <Col xs={24} sm={12} md={6}>
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['开始时间', '结束时间']}
            value={getDateRangeValue()}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
          />
        </Col>
      </Row>

      {/* 当前筛选条件显示 */}
      {(filters.keyword || 
        filters.status?.length || 
        filters.assigneeId || 
        filters.priority?.length || 
        filters.startDate) && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space wrap>
            <span style={{ color: '#595959', fontSize: '14px' }}>当前筛选:</span>
            
            {filters.keyword && (
              <span style={{ 
                background: '#f6ffed', 
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '12px'
              }}>
                关键词: {filters.keyword}
              </span>
            )}
            
            {filters.status?.length && (
              <span style={{ 
                background: '#f6ffed', 
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '12px'
              }}>
                状态: {filters.status.map(s => statusConfig[s].label).join(', ')}
              </span>
            )}
            
            {filters.assigneeId && (
              <span style={{ 
                background: '#f6ffed', 
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '12px'
              }}>
                负责人: {users.find(u => u.id === filters.assigneeId)?.name}
              </span>
            )}
            
            {filters.priority?.length && (
              <span style={{ 
                background: '#f6ffed', 
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '12px'
              }}>
                优先级: {filters.priority.map(p => priorityConfig[p].label).join(', ')}
              </span>
            )}
            
            {filters.startDate && filters.endDate && (
              <span style={{ 
                background: '#f6ffed', 
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '12px'
              }}>
                时间: {filters.startDate} ~ {filters.endDate}
              </span>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default TaskFilterSection;