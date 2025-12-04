

/**
 * Author: onecar Maintainers
 * Email: maintainers@example.com
 * Since: 2025-12-04
 * File: FloatingButton.tsx
 * Purpose: Provide task actions (creation, batch status update, batch delete, clear selection) with user feedback.
 * Notes: English comments are used as per design doc exception for this file.
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


// Props contract for FloatingButton: controlled by parent; callbacks perform side effects in parent scope
interface FloatingButtonProps {

  // IDs of tasks currently selected; when empty, quick actions become guidance only
  selectedTaskIds: string[];
  

  // Trigger creating a new task; should not assume any selection
  onNewTask: () => void;
  

  // Execute batch deletion for given task IDs; confirmation handled here before invoking
  onBatchDelete: (taskIds: string[]) => void;
  

  // Execute batch status update to the selected status; requires a chosen status value
  onBatchStatusUpdate: (taskIds: string[], status: TaskStatus) => void;
  

  // Clear current selection to keep UI consistent after batch operations
  onClearSelection: () => void;
}


// Component: provides task quick actions and batch operations via floating buttons and modal dialogs
const FloatingButton: React.FC<FloatingButtonProps> = ({
  selectedTaskIds,
  onNewTask,
  onBatchDelete,
  onBatchStatusUpdate,
  onClearSelection
}) => {

  // Local UI state: controls visibility of the batch status update modal
  const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
  

  // Local UI state: the target status chosen for batch update; reset on open/close
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();


  // Handler: confirm prompt before performing batch deletion; ensures selection is cleared after success
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


  // Handler: open the batch status modal and reset any previous selection to avoid stale values
  const handleBatchStatusUpdate = () => {
    setBatchStatusModalVisible(true);
    setSelectedStatus(undefined);
  };


  // Handler: validate a status is chosen, then perform update, clear selection, close modal, and notify
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


  // Derive quick actions depending on whether there are selected tasks
  const getQuickActions = () => {
    if (selectedTaskIds.length > 0) {

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
      {/* Action menu group: hover-triggered entry to task operations (new, batch, clear) */}
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 24 }}
        icon={<SettingOutlined />}
        tooltip="操作菜单"
      >

        {/* Primary action: always available to create a new task */}
        <FloatButton
          icon={<PlusOutlined />}
          tooltip="新建任务"
          onClick={onNewTask}
          type="primary"
        />
        

        {/* Render action buttons based on current selection */}
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


      {/* Modal for batch status update: requires choosing a target status */}
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
            {/* Render status options with color indicators per STATUS_CONFIG */}
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