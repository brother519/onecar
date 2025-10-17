/**
 * SearchFilter 组件 - 任务管理系统的核心筛选组件
 * 
 * 功能描述:
 * - 提供关键词搜索功能，支持任务标题和描述的模糊匹配
 * - 支持多维度筛选：状态、优先级、负责人、创建时间范围
 * - 提供高级筛选的展开/收起交互
 * - 实时显示活跃的筛选条件，支持单独移除
 * - 与父组件协调筛选状态管理和搜索执行
 * 
 * 技术栈:
 * - React 18.2.0 + TypeScript 5.2.2
 * - Ant Design 5.12.8 UI组件库
 * - Day.js 1.11.10 日期处理库
 * - Ant Design Icons 5.2.6 图标库
 * 
 * 作者: 开发团队
 * 创建时间: 2025-10-17
 * 最后修改: 2025-10-17
 * 
 * 性能优化注意事项:
 * - 组件使用React.FC类型注释，支持TypeScript类型检查
 * - 使用useState维护展开状态，避免不必要的父组件重渲染
 * - 筛选条件更新使用对象展开语法，保持数据不可变性
 * - 条件渲染优化：仅在hasActiveFilters()为true时渲染活跃筛选区域
 * - 使用React key属性优化列表渲染性能
 * - 建议父组件使用useCallback包装onFiltersChange和onSearch回调
 * 
 * @example
 * ```tsx
 * <SearchFilter
 *   filters={{
 *     keyword: '',
 *     status: [],
 *     priority: [],
 *     assignee: '',
 *     dateRange: null
 *   }}
 *   onFiltersChange={(filters) => setFilters(filters)}
 *   availableAssignees={['张三', '李四', '王五']}
 *   onSearch={() => performSearch()}
 *   loading={false}
 * />
 * ```
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
 * SearchFilter 组件的属性接口定义
 * 
 * @interface SearchFilterProps
 * @description 定义了SearchFilter组件所需的所有属性和回调函数
 */
interface SearchFilterProps {
  /** 
   * 当前的筛选条件对象
   * @description 包含关键词搜索、状态筛选、优先级筛选、负责人筛选和日期范围等所有筛选参数
   */
  filters: TaskFilters;
  
  /** 
   * 筛选条件变更回调函数
   * @param filters - 更新后的筛选条件对象
   * @description 当用户修改任何筛选条件时触发，用于向父组件传递最新的筛选状态
   */
  onFiltersChange: (filters: TaskFilters) => void;
  
  /** 
   * 可选择的负责人列表
   * @description 用于负责人下拉选择器的数据源，通常从后端API获取
   */
  availableAssignees: string[];
  
  /** 
   * 搜索执行回调函数
   * @description 当用户点击搜索按钮或按下回车键时触发，由父组件实现具体的搜索逻辑
   */
  onSearch: () => void;
  
  /** 
   * 搜索加载状态
   * @default false
   * @description 控制搜索按钮的loading状态，用于提供用户反馈
   */
  loading?: boolean;
}

/**
 * SearchFilter 组件主体
 * 
 * @param props - 组件属性对象
 * @returns React函数组件
 * 
 * @description 
 * 任务管理系统的核心筛选组件，提供多维度的任务搜索和筛选功能。
 * 组件内部维护高级筛选的展开/收起状态，对外提供筛选条件的统一管理接口。
 * 
 * @example
 * 使用示例：
 * ```tsx
 * const [filters, setFilters] = useState<TaskFilters>({
 *   keyword: '',
 *   status: [],
 *   priority: [],
 *   assignee: '',
 *   dateRange: null
 * });
 * 
 * <SearchFilter
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   availableAssignees={assignees}
 *   onSearch={handleSearch}
 *   loading={isLoading}
 * />
 * ```
 */
const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onFiltersChange,
  availableAssignees,
  onSearch,
  loading = false
}) => {
  /** 
   * 高级筛选区域的展开/收起状态
   * @description 控制高级筛选面板的显示和隐藏，默认为收起状态
   * @default false
   */
  const [expanded, setExpanded] = useState<boolean>(false);

  /**
   * 更新单个筛选条件
   * 
   * @param key - 要更新的筛选条件的键名
   * @param value - 筛选条件的新值
   * 
   * @description
   * 用于更新单个筛选参数的通用方法。使用对象展开语法保持其他筛选条件不变，
   * 只更新指定的字段。这种设计遵循React中不可变数据的原则。
   * 
   * @example
   * ```tsx
   * // 更新关键词搜索
   * updateFilter('keyword', 'React');
   * // 更新状态筛选
   * updateFilter('status', [TaskStatus.PENDING, TaskStatus.IN_PROGRESS]);
   * ```
   */
  const updateFilter = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  /**
   * 清空所有筛选条件
   * 
   * @description
   * 重置所有筛选条件到初始状态，包括：
   * - 关键词搜索清空
   * - 状态和优先级筛选清空
   * - 负责人筛选清空
   * - 日期范围筛选清空
   * 
   * 通常用于用户点击“清空筛选”按钮时执行。
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
   * 检查是否存在活跃的筛选条件
   * 
   * @returns {boolean} 是否存在任何非空的筛选条件
   * 
   * @description
   * 用于判断当前是否设置了任何筛选条件。检查所有筛选字段：
   * - keyword: 非空字符串
   * - status: 非空数组
   * - priority: 非空数组
   * - assignee: 非空字符串
   * - dateRange: 非空null值
   * 
   * 这个函数用于控制UI元素的显示，如“清空筛选”按钮和活跃筛选条件列表。
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
   * 获取活跃筛选条件的数量
   * 
   * @returns {number} 活跃筛选条件的数量
   * 
   * @description
   * 计算当前设置的筛选条件数量，用于在“高级筛选”按钮上显示当前
   * 活跃的筛选条件数。每个非空的筛选字段计为1个活跃筛选条件。
   * 
   * 计数规则：
   * - keyword: 非空字符串计为1
   * - status: 数组长度>0计为1  
   * - priority: 数组长度>0计为1
   * - assignee: 非空字符串计为1
   * - dateRange: 非空值计为1
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
    {/* 主容器卡片 - 包含整个筛选组件的外层容器 */}
    <Card style={{ marginBottom: 16 }}>
      {/* 主搜索区域 - 第一行包含搜索框和快速操作按钮 */}
      <Row gutter={[16, 16]}>
        {/* 主搜索框 - 支持关键词搜索，可搜索任务标题和描述 */}
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

        {/* 快速操作按钮组 - 高级筛选、搜索、清空筛选按钮 */}
        <Col xs={24} sm={12} md={16}>
          <Space wrap>
            {/* 高级筛选切换按钮 - 显示当前活跃筛选数量 */}
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
            
            {/* 搜索执行按钮 - 支持loading状态 */}
            <Button
              onClick={onSearch}
              type="primary"
              loading={loading}
              icon={<SearchOutlined />}
            >
              搜索
            </Button>

            {/* 清空筛选按钮 - 仅在有活跃筛选时显示 */}
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

      {/* 高级筛选区域 - 使用Collapse组件实现展开/收起功能 */}
      <Collapse 
        activeKey={expanded ? ['filters'] : []} 
        onChange={(keys) => setExpanded(keys.includes('filters'))}
        ghost
      >
        <Panel key="filters" header="" showArrow={false}>
          {/* 筛选条件表单区域 - 四列响应式布局 */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* 任务状态筛选 - 支持多选，显示带颜色标签的状态选项 */}
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

            {/* 任务优先级筛选 - 支持多选，显示带颜色标签的优先级选项 */}
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

            {/* 负责人筛选 - 单选，支持搜索功能 */}
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
                // 性能优化: 使用自定义过滤函数实现大小写不敏感的搜索
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

            {/* 创建日期范围筛选 - 支持日期范围选择，使用dayjs处理日期格式 */}
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
                  // 性能优化: 使用条件判断减少不必要的函数调用
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

      {/* 活动筛选条件显示区域 - 仅在有活跃筛选时显示，支持单个标签的移除 */}
      {hasActiveFilters() && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space wrap>
            <span style={{ color: '#666' }}>活动筛选:</span>
            
            {/* 关键词搜索标签 */}
            {filters.keyword && (
              <Tag 
                closable 
                onClose={() => updateFilter('keyword', '')}
              >
                关键词: {filters.keyword}
              </Tag>
            )}
            
            {/* 状态筛选标签 - 显示所有已选择的状态 */}
            {/* 性能优化: 使用map函数时确保每个元素都有唯一的key属性 */}
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
            
            {/* 优先级筛选标签 - 显示所有已选择的优先级 */}
            {/* 性能优化: 使用map函数时确保每个元素都有唯一的key属性 */}
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
            
            {/* 负责人筛选标签 */}
            {filters.assignee && (
              <Tag
                closable
                onClose={() => updateFilter('assignee', '')}
              >
                负责人: {filters.assignee}
              </Tag>
            )}
            
            {/* 日期范围筛选标签 */}
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