/**
 * Tom cat
 * 
 * 任务管理系统 - 浮动操作按钮组件
 * 
 * 功能说明：
 * - 提供快捷操作入口（新建任务、批量操作）
 * - 根据选中状态动态显示不同操作按钮
 * - 支持批量删除并提供确认对话框
 * - 支持批量更新任务状态
 * - 提供取消选择功能
 * 
 * 依赖组件：
 * - FloatButton: Ant Design浮动按钮组件
 * - Modal: 用于确认对话框
 * - Select: 用于选择任务状态
 * 
 * 交互特点：
 * - 悬浮触发（hover）显示操作菜单
 * - 批量操作前显示确认对话框，防止误操作
 * - 显示当前选中任务数量
 * 
 * @module FloatingButton
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
 * 浮动操作按钮组件属性接口
 */
interface FloatingButtonProps {
  /** 当前选中的任务ID列表，用于批量操作 */
  selectedTaskIds: string[];
  
  /** 
   * 新建任务回调函数
   * 点击"新建任务"按钮时触发
   */
  onNewTask: () => void;
  
  /** 
   * 批量删除回调函数
   * @param taskIds - 要删除的任务ID数组
   */
  onBatchDelete: (taskIds: string[]) => void;
  
  /** 
   * 批量状态更新回调函数
   * @param taskIds - 要更新的任务ID数组
   * @param status - 目标状态
   */
  onBatchStatusUpdate: (taskIds: string[], status: TaskStatus) => void;
  
  /** 
   * 清空选择回调函数
   * 取消所有任务的选中状态
   */
  onClearSelection: () => void;
}

/**
 * 浮动操作按钮组件
 * 
 * 主要功能：
 * - 提供快捷方式新建任务
 * - 根据选中状态动态显示批量操作按钮
 * - 支持批量删除和批量状态更新
 * - 显示当前选中任务数量
 * 
 * 状态管理：
 * - batchStatusModalVisible: 批量状态更新弹窗显示状态
 * - selectedStatus: 当前选中的目标状态
 * 
 * 交互特点：
 * - 悬浮触发显示操作菜单
 * - 批量操作前显示确认对话框
 * - 根据是否有选中任务动态调整菜单项
 * 
 * @param {FloatingButtonProps} props - 组件属性
 * @returns {JSX.Element} 浮动操作按钮组
 */
const FloatingButton: React.FC<FloatingButtonProps> = ({
  selectedTaskIds,
  onNewTask,
  onBatchDelete,
  onBatchStatusUpdate,
  onClearSelection
}) => {
  /** 批量状态更新弹窗的显示状态 */
  const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
  
  /** 当前选中的目标状态，用于批量更新 */
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();

  /**
   * 处理批量删除操作
   * 
   * 执行流程：
   * 1. 显示确认对话框，显示待删除任务数量
   * 2. 用户确认后调用onBatchDelete回调
   * 3. 清空选中状态
   * 4. 显示成功消息
   * 
   * @returns {void} 无返回值，通过Modal组件处理用户交互
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
   * 处理批量状态更新操作
   * 
   * 执行流程：
   * 1. 打开状态选择弹窗
   * 2. 重置已选状态
   * 
   * @returns {void} 无返回值
   */
  const handleBatchStatusUpdate = () => {
    setBatchStatusModalVisible(true);
    setSelectedStatus(undefined);
  };

  /**
   * 确认批量状态更新
   * 
   * 执行流程：
   * 1. 验证是否已选择目标状态
   * 2. 调用onBatchStatusUpdate回调更新任务状态
   * 3. 清空选中状态
   * 4. 关闭弹窗并重置状态
   * 5. 显示成功消息
   * 
   * @returns {void} 无返回值
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
   * 根据是否有选中任务动态返回不同的操作按钮：
   * - 有选中任务：显示批量更新、批量删除、取消选择
   * - 无选中任务：显示快捷提示按钮
   * 
   * @returns {Array} 按钮配置数组，包含图标、提示、回调等信息
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
      // 无选中任务时的常规操作
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
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 24 }}
        icon={<SettingOutlined />}
        tooltip="操作菜单"
      >
        {/* 新建任务按钮 - 始终显示 */}
        <FloatButton
          icon={<PlusOutlined />}
          tooltip="新建任务"
          onClick={onNewTask}
          type="primary"
        />
        
        {/* 动态快捷操作按钮 */}
        {getQuickActions().map((action, index) => (
          <FloatButton
            key={index}
            icon={action.icon}
            tooltip={action.tooltip}
            onClick={action.onClick}
            type={action.type}
            {...(action.danger && { style: { backgroundColor: '#ff4d4f' } })}
          />
        ))}
      </FloatButton.Group>

      {/* 批量状态更新弹窗 */}
      <Modal
        title="批量更新任务状态"
        open={batchStatusModalVisible}
        onOk={confirmBatchStatusUpdate}
        onCancel={() => {
          setBatchStatusModalVisible(false);
          setSelectedStatus(undefined);
        }}
        okText="更新"
        cancelText="取消"
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>将为选中的 <strong>{selectedTaskIds.length}</strong> 个任务更新状态：</p>
          
          <Select
            placeholder="请选择新状态"
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: '100%' }}
            size="large"
          >
            {Object.values(TaskStatus).map(status => (
              <Option key={status} value={status}>
                <Space>
                  <span 
                    style={{ 
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
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

export default FloatingButton;