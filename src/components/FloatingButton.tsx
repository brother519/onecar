/**
 * @fileoverview FloatingButton 组件 - 任务管理应用的浮动操作按钮组件
 * 
 * 提供以下核心功能：
 * - 新建任务快捷操作
 * - 批量任务状态更新
 * - 批量任务删除操作
 * - 动态操作菜单显示
 * - 用户操作引导提示
 * 
 * 组件采用悬浮设计，根据任务选中状态动态调整可用操作，
 * 为用户提供直观高效的任务管理体验。
 * 
 * @author 开发团队
 * @since 1.0.0
 * @version 1.0.0
 * @lastModified 2025-10-09
 */

import React, { useState } from 'react';
import { FloatButton, Modal, Select, Space, message } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  SettingOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { TaskStatus, STATUS_CONFIG } from '../types/task';

const { Option } = Select;

/**
 * FloatingButton 组件的 Props 接口定义
 * 
 * @interface FloatingButtonProps
 * @description 定义了浮动操作按钮组件所需的所有属性和回调函数
 */
interface FloatingButtonProps {
  /**
   * 当前选中的任务ID列表
   * @description 用于确定批量操作的目标任务，影响动态按钮的显示和功能
   * @example ['task-001', 'task-002', 'task-003']
   */
  selectedTaskIds: string[];
  
  /**
   * 新建任务回调函数
   * @description 点击新建任务按钮时触发，通常打开任务创建表单
   */
  onNewTask: () => void;
  
  /**
   * 批量删除任务回调函数
   * @description 确认批量删除操作后触发，执行任务删除业务逻辑
   * @param taskIds - 要删除的任务ID数组
   */
  onBatchDelete: (taskIds: string[]) => void;
  
  /**
   * 批量状态更新回调函数
   * @description 批量更新任务状态时触发，执行状态变更业务逻辑
   * @param taskIds - 要更新的任务ID数组
   * @param status - 目标状态值
   */
  onBatchStatusUpdate: (taskIds: string[], status: TaskStatus) => void;
  
  /**
   * 清除选择回调函数
   * @description 取消当前任务选择状态，重置选中列表为空
   */
  onClearSelection: () => void;
}

/**
 * FloatingButton 浮动操作按钮组件
 * 
 * @description 提供任务管理的核心操作入口，包括新建任务、批量操作等功能。
 * 组件会根据当前选中任务数量动态调整显示的操作按钮，为用户提供
 * 上下文相关的操作选项。
 * 
 * @component
 * @param props - 组件属性，参见 FloatingButtonProps 接口
 * @returns {React.ReactElement} 浮动按钮组件JSX元素
 * 
 * @example
 * ```tsx
 * <FloatingButton
 *   selectedTaskIds={['task-1', 'task-2']}
 *   onNewTask={() => setShowTaskForm(true)}
 *   onBatchDelete={(ids) => deleteTasksById(ids)}
 *   onBatchStatusUpdate={(ids, status) => updateTasksStatus(ids, status)}
 *   onClearSelection={() => setSelectedTasks([])}
 * />
 * ```
 * 
 * @since 1.0.0
 */
const FloatingButton: React.FC<FloatingButtonProps> = ({
  selectedTaskIds,
  onNewTask,
  onBatchDelete,
  onBatchStatusUpdate,
  onClearSelection
}) => {
  /**
   * 批量状态更新模态框的显示状态
   * @description 控制批量状态更新弹窗的显示和隐藏
   * @default false
   */
  const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
  
  /**
   * 用户选择的目标状态值
   * @description 在批量状态更新操作中，临时存储用户选择的新状态
   * @default undefined 表示尚未选择状态
   */
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();

  /**
   * 处理批量删除操作
   * 
   * @description 显示删除确认对话框，经用户确认后执行批量删除操作。
   * 包含以下业务流程：
   * 1. 显示包含任务数量的确认消息
   * 2. 用户确认后调用批量删除回调
   * 3. 清空当前选中状态
   * 4. 显示操作成功反馈
   * 
   * @function
   * @returns {void}
   * 
   * @example
   * // 用户点击批量删除按钮后的交互流程
   * handleBatchDelete();
   * // => 弹出确认对话框：“确定要删除选中的 3 个任务吗？”
   */
  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedTaskIds.length} 个任务吗？此操作无法撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        onBatchDelete(selectedTaskIds);
        onClearSelection();
        message.success('任务删除成功');
      }
    });
  };

  /**
   * 处理批量状态更新操作的初始化
   * 
   * @description 打开批量状态更新模态框，重置选中状态为未选择状态。
   * 为用户提供状态选择界面，准备执行批量状态更新操作。
   * 
   * @function
   * @returns {void}
   */
  const handleBatchStatusUpdate = () => {
    setBatchStatusModalVisible(true);
    setSelectedStatus(undefined);
  };

  /**
   * 确认执行批量状态更新操作
   * 
   * @description 验证用户选择的状态后，执行批量更新操作。
   * 包含以下业务流程：
   * 1. 校验是否已选择目标状态
   * 2. 调用批量状态更新回调函数
   * 3. 清空当前选中状态和模态框状态
   * 4. 重置状态选择器
   * 5. 显示操作成功反馈
   * 
   * @function
   * @returns {void}
   * 
   * @validation 如果未选择状态，显示警告消息并终止操作
   */
  const confirmBatchStatusUpdate = () => {
    if (!selectedStatus) {
      message.warning('请选择要更新的状态');
      return;
    }
    
    onBatchStatusUpdate(selectedTaskIds, selectedStatus);
    onClearSelection();
    setBatchStatusModalVisible(false);
    setSelectedStatus(undefined);
    message.success('任务状态更新成功');
  };

  /**
   * 获取快捷操作按钮配置
   * 
   * @description 根据当前选中任务数量动态生成操作按钮配置。
   * 实现上下文相关的用户界面，提供直观的操作反馈。
   * 
   * @function
   * @returns {Array<ActionConfig>} 操作按钮配置数组
   * 
   * @logic
   * - 当 selectedTaskIds.length > 0 时：
   *   • 显示批量状态更新按钮
   *   • 显示批量删除按钮（危险操作风格）
   *   • 显示取消选择按钮
   * - 当 selectedTaskIds.length === 0 时：
   *   • 显示操作引导提示按钮
   * 
   * @example
   * // 有选中任务时返回的配置
   * [
   *   { icon: <EditOutlined />, tooltip: '批量更新状态 (3个)', onClick: handleBatchStatusUpdate },
   *   { icon: <DeleteOutlined />, tooltip: '批量删除 (3个)', onClick: handleBatchDelete },
   *   { icon: <SettingOutlined />, tooltip: '取消选择', onClick: onClearSelection }
   * ]
   */
  const getQuickActions = () => {
    if (selectedTaskIds.length > 0) {
      // 有选中任务时的批量操作
      return [
        {
          icon: <EditOutlined />,
          tooltip: `批量更新状态 (${selectedTaskIds.length}个)`,
          onClick: handleBatchStatusUpdate,
          type: 'primary' as const
        },
        {
          icon: <DeleteOutlined />,
          tooltip: `批量删除 (${selectedTaskIds.length}个)`,
          onClick: handleBatchDelete,
          type: 'default' as const,
          danger: true
        },
        {
          icon: <SettingOutlined />,
          tooltip: '取消选择',
          onClick: onClearSelection,
          type: 'default' as const
        }
      ];
    } else {
      // 无选中任务时显示的操作引导提示
      return [
        {
          icon: <BulbOutlined />,
          tooltip: '快捷提示：选择任务后可进行批量操作',
          onClick: () => message.info('选择一个或多个任务来进行批量操作'),
          type: 'default' as const
        }
      ];
    }
  };

  return (
    <>
      {/* 浮动按钮组 - 主要操作入口 */}
      <FloatButton.Group
        trigger="hover" // 悬浮触发显示菜单
        type="primary"
        style={{ right: 24 }} // 固定在右侧位置
        icon={<SettingOutlined />}
        tooltip="操作菜单"
      >
        {/* 新建任务按钮 - 始终显示的核心功能 */}
        <FloatButton
          icon={<PlusOutlined />}
          tooltip="新建任务"
          onClick={onNewTask}
          type="primary"
        />
        
        {/* 动态快捷操作按钮 - 根据选中状态变化 */}
        {getQuickActions().map((action, index) => (
          <FloatButton
            key={index} // 使用索引作为key，因为数组每次都会重新生成
            icon={action.icon}
            tooltip={action.tooltip}
            onClick={action.onClick}
            type={action.type}
            {...(action.danger && { style: { backgroundColor: '#ff4d4f' } })} // 危险操作的视觉样式
          />
        ))}
      </FloatButton.Group>

      {/* 批量状态更新模态框 */}
      <Modal
        title="批量更新任务状态"
        open={batchStatusModalVisible}
        onOk={confirmBatchStatusUpdate}
        onCancel={() => {
          // 取消时重置模态框和选择状态
          setBatchStatusModalVisible(false);
          setSelectedStatus(undefined);
        }}
        okText="更新"
        cancelText="取消"
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 操作提示信息 */}
          <p>将为选中的 <strong>{selectedTaskIds.length}</strong> 个任务更新状态：</p>
          
          {/* 状态选择器 */}
          <Select
            placeholder="请选择新状态"
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: '100%' }}
            size="large"
          >
            {/* 状态选项列表 - 动态生成 */}
            {Object.values(TaskStatus).map(status => (
              <Option key={status} value={status}>
                <Space>
                  {/* 状态指示器 - 颜色编码的小圆点 */}
                  <span 
                    style={{ 
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      // 状态颜色映射逻辑
                      backgroundColor: STATUS_CONFIG[status].color === 'default' ? '#d9d9d9' :
                                     STATUS_CONFIG[status].color === 'processing' ? '#1890ff' :
                                     STATUS_CONFIG[status].color === 'success' ? '#52c41a' :
                                     STATUS_CONFIG[status].color === 'error' ? '#ff4d4f' : '#d9d9d9'
                    }} 
                  />
                  {STATUS_CONFIG[status].label}
                </Space>
              </Option>
            ))}
          </Select>
          
          {/* 状态描述信息 - 条件渲染 */}
          {selectedStatus && (
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: 4,
              fontSize: 12,
              color: '#389e0d'
            }}>
              {STATUS_CONFIG[selectedStatus].description}
            </div>
          )}
        </Space>
      </Modal>
    </>
  );
};

/**
 * 导出 FloatingButton 组件作为默认导出
 * @description 使其可以被其他模块导入和使用
 */
export default FloatingButton;