import React, { useState } from 'react';
import { 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Button, 
  Card, 
  Row, 
  Col,
  Tag,
  Collapse
} from 'antd';
import { SearchOutlined, ClearOutlined, FilterOutlined } from '@ant-design/icons';
import { TaskFilters, TaskStatus, TaskPriority, STATUS_CONFIG, PRIORITY_CONFIG } from '../types/task';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

interface SearchFilterProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  availableAssignees: string[];
  onSearch: () => void;
  loading?: boolean;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onFiltersChange,
  availableAssignees,
  onSearch,
  loading = false
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      keyword: '',
      status: [],
      priority: [],
      assignee: '',
      dateRange: null
    });
  };

  const hasActiveFilters = () => {
    return !!(
      filters.keyword ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.assignee ||
      filters.dateRange
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.keyword) count++;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.assignee) count++;
    if (filters.dateRange) count++;
    return count;
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Search
            placeholder="搜索任务标题或描述"
            value={filters.keyword}
            onChange={(e) => updateFilter('keyword', e.target.value)}
            onSearch={onSearch}
            enterButton={<SearchOutlined />}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={16}>
          <Space wrap>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setExpanded(!expanded)}
              type={expanded ? 'primary' : 'default'}
            >
              高级筛选
              {getActiveFilterCount() > 0 && (
                <span style={{ marginLeft: 4 }}>
                  ({getActiveFilterCount()})
                </span>
              )}
            </Button>
            
            <Button
              onClick={onSearch}
              type="primary"
              loading={loading}
              icon={<SearchOutlined />}
            >
              搜索
            </Button>

            {hasActiveFilters() && (
              <Button
                onClick={clearAllFilters}
                icon={<ClearOutlined />}
              >
                清空筛选
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <Collapse 
        activeKey={expanded ? ['filters'] : []} 
        onChange={(keys) => setExpanded(keys.includes('filters'))}
        ghost
      >
        <Panel key="filters" header="" showArrow={false}>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>
                <label>任务状态:</label>
              </div>
              <Select
                mode="multiple"
                placeholder="选择状态"
                value={filters.status}
                onChange={(value) => updateFilter('status', value)}
                style={{ width: '100%' }}
                allowClear
              >
                {Object.values(TaskStatus).map(status => (
                  <Option key={status} value={status}>
                    <Tag color={STATUS_CONFIG[status].color}>
                      {STATUS_CONFIG[status].label}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>
                <label>优先级:</label>
              </div>
              <Select
                mode="multiple"
                placeholder="选择优先级"
                value={filters.priority}
                onChange={(value) => updateFilter('priority', value)}
                style={{ width: '100%' }}
                allowClear
              >
                {Object.values(TaskPriority).map(priority => (
                  <Option key={priority} value={priority}>
                    <Tag color={PRIORITY_CONFIG[priority].color}>
                      {PRIORITY_CONFIG[priority].label}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>
                <label>负责人:</label>
              </div>
              <Select
                placeholder="选择负责人"
                value={filters.assignee}
                onChange={(value) => updateFilter('assignee', value)}
                style={{ width: '100%' }}
                allowClear
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
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>
                <label>创建时间:</label>
              </div>
              <RangePicker
                value={filters.dateRange ? [
                  dayjs(filters.dateRange[0]),
                  dayjs(filters.dateRange[1])
                ] : null}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    updateFilter('dateRange', [
                      dates[0].format('YYYY-MM-DD'),
                      dates[1].format('YYYY-MM-DD')
                    ]);
                  } else {
                    updateFilter('dateRange', null);
                  }
                }}
                style={{ width: '100%' }}
                placeholder={['开始日期', '结束日期']}
              />
            </Col>
          </Row>
        </Panel>
      </Collapse>

      {hasActiveFilters() && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space wrap>
            <span style={{ color: '#666' }}>活动筛选:</span>
            
            {filters.keyword && (
              <Tag 
                closable 
                onClose={() => updateFilter('keyword', '')}
              >
                关键词: {filters.keyword}
              </Tag>
            )}
            
            {filters.status.map(status => (
              <Tag
                key={status}
                closable
                color={STATUS_CONFIG[status].color}
                onClose={() => updateFilter('status', filters.status.filter(s => s !== status))}
              >
                {STATUS_CONFIG[status].label}
              </Tag>
            ))}
            
            {filters.priority.map(priority => (
              <Tag
                key={priority}
                closable
                color={PRIORITY_CONFIG[priority].color}
                onClose={() => updateFilter('priority', filters.priority.filter(p => p !== priority))}
              >
                {PRIORITY_CONFIG[priority].label}
              </Tag>
            ))}
            
            {filters.assignee && (
              <Tag
                closable
                onClose={() => updateFilter('assignee', '')}
              >
                负责人: {filters.assignee}
              </Tag>
            )}
            
            {filters.dateRange && (
              <Tag
                closable
                onClose={() => updateFilter('dateRange', null)}
              >
                时间: {filters.dateRange[0]} ~ {filters.dateRange[1]}
              </Tag>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default SearchFilter;