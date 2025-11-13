/**
 * Tom cat
 * 
 * Task Management System - Search and Filter Component
 * 
 * Features:
 * - Provides keyword search functionality
 * - Supports multi-criteria filtering (status, priority, assignee, date range)
 * - Collapsible advanced filter area with expand/collapse functionality
 * - Displays active filter condition tags
 * - Supports one-click clear all filters
 * 
 * Dependent Components:
 * - Input.Search: Search input box
 * - Select: Dropdown selector
 * - DatePicker.RangePicker: Date range picker
 * - Collapse: Collapse panel
 * - Tag: Filter condition tags
 * 
 * State Management:
 * - expanded: Controls the expand/collapse state of the advanced filter area
 * 
 * @module SearchFilter
 */

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

/**
 * Search filter component properties interface
 */
interface SearchFilterProps {
  /** Current filter criteria object */
  filters: TaskFilters;
  
  /** 
   * Filter change callback function
   * @param filters - New filter criteria object
   */
  onFiltersChange: (filters: TaskFilters) => void;
  
  /** Available assignee list */
  availableAssignees: string[];
  
  /** 
   * Search button click callback function
   * Triggers actual data loading operation
   */
  onSearch: () => void;
  
  /** Loading state to control search button loading effect */
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

  // Update filter criteria
  const updateFilter = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  /**
   * Clear all filter criteria
   * 
   * Reset all filter criteria to initial values
   * 
   * @returns {void} No return value
   */
  const clearAllFilters = () => {
    onFiltersChange({
      keyword: '',
      status: [],
      priority: [],
      assignee: '',
      dateRange: null
    });
  };

  /**
   * Check if there are active filter criteria
   * 
   * Check if any filter criteria has non-empty value
   * 
   * @returns {boolean} Returns true if there are active filter criteria, otherwise returns false
   */
  const hasActiveFilters = () => {
    return !!(
      filters.keyword ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.assignee ||
      filters.dateRange
    );
  };

  /**
   * Get the count of active filter criteria
   * 
   * Count non-empty filter criteria for display on button
   * 
   * @returns {number} The count of active filter criteria
   */
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
        {/* Main search box */}
        <Col xs={24} sm={12} md={8}>
          <Search
            placeholder="Search task title or description"
            value={filters.keyword}
            onChange={(e) => updateFilter('keyword', e.target.value)}
            onSearch={onSearch}
            enterButton={<SearchOutlined />}
            allowClear
          />
        </Col>

        {/* Quick filter buttons */}
        <Col xs={24} sm={12} md={16}>
          <Space wrap>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setExpanded(!expanded)}
              type={expanded ? 'primary' : 'default'}
            >
              Advanced Filters
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
              Search
            </Button>

            {hasActiveFilters() && (
              <Button
                onClick={clearAllFilters}
                icon={<ClearOutlined />}
              >
                Clear Filters
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* Advanced filter area */}
      <Collapse 
        activeKey={expanded ? ['filters'] : []} 
        onChange={(keys) => setExpanded(keys.includes('filters'))}
        ghost
      >
        <Panel key="filters" header="" showArrow={false}>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* Status filter */}
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>
                <label>Task Status:</label>
              </div>
              <Select
                mode="multiple"
                placeholder="Select status"
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

            {/* Priority filter */}
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>
                <label>Priority:</label>
              </div>
              <Select
                mode="multiple"
                placeholder="Select priority"
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

            {/* Assignee filter */}
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>
                <label>Assignee:</label>
              </div>
              <Select
                placeholder="Select assignee"
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

            {/* Date range filter */}
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>
                <label>Created Time:</label>
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
                placeholder={['Start Date', 'End Date']}
              />
            </Col>
          </Row>
        </Panel>
      </Collapse>

      {/* Active filter conditions display */}
      {hasActiveFilters() && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space wrap>
            <span style={{ color: '#666' }}>Active Filters:</span>
            
            {filters.keyword && (
              <Tag 
                closable 
                onClose={() => updateFilter('keyword', '')}
              >
                Keyword: {filters.keyword}
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
                Assignee: {filters.assignee}
              </Tag>
            )}
            
            {filters.dateRange && (
              <Tag
                closable
                onClose={() => updateFilter('dateRange', null)}
              >
                Time: {filters.dateRange[0]} ~ {filters.dateRange[1]}
              </Tag>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default SearchFilter;