/**
 * SearchFilter Component
 * 
 * A comprehensive search and filter component for the task management system.
 * Provides multi-dimensional filtering capabilities including keyword search,
 * status filtering, priority filtering, assignee selection, and date range filtering.
 * 
 * Features:
 * - Real-time keyword search for task titles and descriptions
 * - Multiple filter criteria (status, priority, assignee, date range)
 * - Collapsible advanced filter panel
 * - Active filter visualization with removable tags
 * - Filter count indicator
 * - Batch clear functionality
 * 
 * Dependencies: Ant Design components, dayjs for date handling
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
 * Props interface for SearchFilter component
 * 
 * @interface SearchFilterProps
 * @property {TaskFilters} filters - Current filter values including keyword, status, priority, assignee, and date range
 * @property {function} onFiltersChange - Callback function triggered when any filter value changes
 * @property {string[]} availableAssignees - List of available assignee names for the assignee dropdown
 * @property {function} onSearch - Callback function triggered when search button is clicked
 * @property {boolean} [loading] - Optional loading state for search button (default: false)
 */
interface SearchFilterProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  availableAssignees: string[];
  onSearch: () => void;
  loading?: boolean;
}

/**
 * SearchFilter Component
 * 
 * Main component that renders a comprehensive filtering interface for task management.
 * Manages local state for advanced filter panel expansion and provides utility functions
 * for filter manipulation.
 * 
 * @param {SearchFilterProps} props - Component props
 * @returns {JSX.Element} Rendered search and filter interface
 */
const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onFiltersChange,
  availableAssignees,
  onSearch,
  loading = false
}) => {
  // Controls the visibility of the advanced filter panel
  const [expanded, setExpanded] = useState<boolean>(false);

  /**
   * Updates a specific filter field value
   * 
   * Merges the new value with existing filter state and triggers the onFiltersChange callback.
   * 
   * @param {keyof TaskFilters} key - The filter field to update (keyword, status, priority, assignee, or dateRange)
   * @param {any} value - The new value for the specified filter field
   */
  const updateFilter = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  /**
   * Resets all filter criteria to their default values
   * 
   * Clears keyword search, status filters, priority filters, assignee selection,
   * and date range selection by setting them to their initial empty states.
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
   * Checks if any filter criteria is currently active
   * 
   * Evaluates all filter fields to determine if at least one filter is applied.
   * Used to conditionally render the clear filters button and active filter tags section.
   * 
   * @returns {boolean} True if any filter has a non-empty value, false otherwise
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
   * Calculates the total number of active filter criteria
   * 
   * Counts each filter type as one unit, regardless of how many values are selected
   * within multi-select filters (e.g., multiple statuses count as 1).
   * Used to display the filter count badge on the advanced filter button.
   * 
   * @returns {number} Total count of active filters (0-5)
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
      {/* Main search and filter control row */}
      <Row gutter={[16, 16]}>
        {/* Keyword search input */}
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

        {/* Action buttons: advanced filter toggle, search, and clear */}
        <Col xs={24} sm={12} md={16}>
          <Space wrap>
            {/* Advanced filter toggle button with active filter count badge */}
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
            
            {/* Search button - triggers the search operation */}
            <Button
              onClick={onSearch}
              type="primary"
              loading={loading}
              icon={<SearchOutlined />}
            >
              搜索
            </Button>

            {/* Clear all filters button - only shown when filters are active */}
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

      {/* Collapsible advanced filter panel */}
      <Collapse 
        activeKey={expanded ? ['filters'] : []} 
        onChange={(keys) => setExpanded(keys.includes('filters'))}
        ghost
      >
        <Panel key="filters" header="" showArrow={false}>
          {/* Advanced filter criteria grid */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* Task status multi-select filter */}
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
                {/* Render status options from TaskStatus enum with color-coded tags */}
                {Object.values(TaskStatus).map(status => (
                  <Option key={status} value={status}>
                    <Tag color={STATUS_CONFIG[status].color}>
                      {STATUS_CONFIG[status].label}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Col>

            {/* Task priority multi-select filter */}
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
                {/* Render priority options from TaskPriority enum with color-coded tags */}
                {Object.values(TaskPriority).map(priority => (
                  <Option key={priority} value={priority}>
                    <Tag color={PRIORITY_CONFIG[priority].color}>
                      {PRIORITY_CONFIG[priority].label}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Col>

            {/* Assignee single-select filter with search capability */}
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
                // Case-insensitive search filter for assignee names
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

            {/* Date range picker for filtering by creation time */}
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>
                <label>创建时间:</label>
              </div>
              <RangePicker
                // Convert stored string dates to dayjs objects for display
                value={filters.dateRange ? [
                  dayjs(filters.dateRange[0]),
                  dayjs(filters.dateRange[1])
                ] : null}
                onChange={(dates) => {
                  // Convert dayjs objects to YYYY-MM-DD string format for storage
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

      {/* Active filters display section - shows removable tags for all active filters */}
      {hasActiveFilters() && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space wrap>
            <span style={{ color: '#666' }}>活动筛选:</span>
            
            {/* Keyword filter tag */}
            {filters.keyword && (
              <Tag 
                closable 
                onClose={() => updateFilter('keyword', '')}
              >
                关键词: {filters.keyword}
              </Tag>
            )}
            
            {/* Status filter tags - one tag per selected status */}
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
            
            {/* Priority filter tags - one tag per selected priority */}
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
            
            {/* Assignee filter tag */}
            {filters.assignee && (
              <Tag
                closable
                onClose={() => updateFilter('assignee', '')}
              >
                负责人: {filters.assignee}
              </Tag>
            )}
            
            {/* Date range filter tag */}
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