/**
 * Task Search and Filter Component
 *
 * A comprehensive search and filter component for task management system.
 * Provides keyword-based quick search and multi-dimensional advanced filtering
 * capabilities with visual filter management through tags.
 *
 * Features:
 * - Keyword-based quick search for task titles and descriptions
 * - Multi-dimensional advanced filtering (status, priority, assignee, date range)
 * - Visual filter management with removable tags
 * - Collapsible filter panel for better space utilization
 * - Real-time active filter count display
 *
 * Dependencies:
 * - TaskFilters, TaskStatus, TaskPriority types from '../types/task'
 * - Ant Design components for UI elements
 * - Day.js for date handling
 *
 * @module components/SearchFilter
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

// Destructure Ant Design sub-components for cleaner code
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

/**
 * Props interface for SearchFilter component
 *
 * @interface SearchFilterProps
 * @property {TaskFilters} filters - Current active filter conditions applied to task list
 * @property {Function} onFiltersChange - Callback fired when any filter value changes
 * @property {string[]} availableAssignees - List of available assignees for dropdown selection
 * @property {Function} onSearch - Callback to trigger search operation with current filters
 * @property {boolean} [loading] - Loading state for search button feedback
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
 * Renders a comprehensive search and filter interface for task management.
 * Combines quick search with advanced filtering options in a collapsible panel.
 *
 * @param {SearchFilterProps} props - Component properties
 * @returns {React.ReactElement} Rendered search filter component
 */
const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onFiltersChange,
  availableAssignees,
  onSearch,
  loading = false
}) => {
  // Controls the expanded/collapsed state of advanced filter panel
  const [expanded, setExpanded] = useState<boolean>(false);

  /**
   * Updates a single filter field value
   *
   * Preserves other filter values using object spread operator while
   * updating the specified field.
   *
   * @param {keyof TaskFilters} key - The filter field to update
   * @param {any} value - New value for the filter field
   */
  const updateFilter = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  /**
   * Resets all filter conditions to their initial state
   *
   * Clears keyword, status, priority, assignee, and date range filters.
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
   * Checks if any filter condition is currently active
   *
   * @returns {boolean} True if any filter has a non-empty value
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
   * Calculates the number of active filter conditions
   *
   * Each filter type (keyword, status, priority, assignee, date range)
   * is counted as one active filter regardless of how many values it contains.
   *
   * @returns {number} Count of active filter types
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
      {/* Main filter row: Quick search input and action buttons */}
      <Row gutter={[16, 16]}>
        {/* Quick search input area */}
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

        {/* Action buttons area: Advanced filter toggle, search, and clear */}
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

      {/* Collapsible advanced filter panel */}
      <Collapse 
        activeKey={expanded ? ['filters'] : []} 
        onChange={(keys) => setExpanded(keys.includes('filters'))}
        ghost
      >
        <Panel key="filters" header="" showArrow={false}>
          {/* Advanced filter options: Status, Priority, Assignee, Date Range */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* Task status filter - multi-select dropdown */}
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

            {/* Task priority filter - multi-select dropdown */}
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

            {/* Assignee filter - searchable single-select dropdown */}
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
                // Type assertion required due to Ant Design Select's generic children type
                // Case-insensitive search provides better user experience
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

            {/* Date range filter - creation time */}
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
                  // Null check ensures both dates are selected before updating
                  // Convert Day.js objects to string format for consistent data handling
                  // YYYY-MM-DD format matches backend API requirements
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

      {/* Active filters display area - shows removable tags for each active filter */}
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
            
            {/* Status filter tags - remove individual status by filtering array */}
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
            
            {/* Priority filter tags - remove individual priority by filtering array */}
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
            
            {/* Assignee filter tag - remove by clearing string value */}
            {filters.assignee && (
              <Tag
                closable
                onClose={() => updateFilter('assignee', '')}
              >
                负责人: {filters.assignee}
              </Tag>
            )}
            
            {/* Date range filter tag - remove by setting to null */}
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