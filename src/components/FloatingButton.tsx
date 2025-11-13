/**
 * Tom cat
 * 
 * Task Management System - Floating Action Button Component
 * 
 * Features:
 * - Provides quick action entry (create task, batch operations)
 * - Dynamically displays different action buttons based on selection state
 * - Supports batch deletion with confirmation dialog
 * - Supports batch task status updates
 * - Provides clear selection functionality
 * 
 * Dependencies:
 * - FloatButton: Ant Design floating button component
 * - Modal: Used for confirmation dialogs
 * - Select: Used for selecting task status
 * 
 * Interaction Features:
 * - Hover trigger to display action menu
 * - Shows confirmation dialog before batch operations to prevent misoperations
 * - Displays current selected task count
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
 * Floating action button component props interface
 */
interface FloatingButtonProps {
  /** List of currently selected task IDs for batch operations */
  selectedTaskIds: string[];
  
  /** 
   * Create new task callback function
   * Triggered when "Create Task" button is clicked
   */
  onNewTask: () => void;
  
  /** 
   * Batch delete callback function
   * @param taskIds - Array of task IDs to delete
   */
  onBatchDelete: (taskIds: string[]) => void;
  
  /** 
   * Batch status update callback function
   * @param taskIds - Array of task IDs to update
   * @param status - Target status
   */
  onBatchStatusUpdate: (taskIds: string[], status: TaskStatus) => void;
  
  /** 
   * Clear selection callback function
   * Cancels selection state of all tasks
   */
  onClearSelection: () => void;
}

/**
 * Floating Action Button Component
 * 
 * Main Features:
 * - Provides quick access to create new task
 * - Dynamically displays batch operation buttons based on selection state
 * - Supports batch deletion and batch status updates
 * - Displays current selected task count
 * 
 * State Management:
 * - batchStatusModalVisible: Batch status update modal visibility state
 * - selectedStatus: Currently selected target status
 * 
 * Interaction Features:
 * - Hover trigger to display action menu
 * - Shows confirmation dialog before batch operations
 * - Dynamically adjusts menu items based on whether tasks are selected
 * 
 * @param {FloatingButtonProps} props - Component props
 * @returns {JSX.Element} Floating action button group
 */
const FloatingButton: React.FC<FloatingButtonProps> = ({
  selectedTaskIds,
  onNewTask,
  onBatchDelete,
  onBatchStatusUpdate,
  onClearSelection
}) => {
  /** Visibility state of batch status update modal */
  const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
  
  /** Currently selected target status for batch update */
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();

  /**
   * Handle batch delete operation
   * 
   * Execution flow:
   * 1. Display confirmation dialog showing number of tasks to delete
   * 2. Call onBatchDelete callback after user confirmation
   * 3. Clear selection state
   * 4. Show success message
   * 
   * @returns {void} No return value, user interaction handled by Modal component
   */
  const handleBatchDelete = () => {
    Modal.confirm({
      title: 'Confirm Batch Delete',
      content: `Are you sure you want to delete the selected ${selectedTaskIds.length} task(s)? This operation cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        onBatchDelete(selectedTaskIds);
        onClearSelection();
        message.success('Tasks deleted successfully');
      }
    });
  };

  /**
   * Handle batch status update operation
   * 
   * Execution flow:
   * 1. Open status selection modal
   * 2. Reset selected status
   * 
   * @returns {void} No return value
   */
  const handleBatchStatusUpdate = () => {
    setBatchStatusModalVisible(true);
    setSelectedStatus(undefined);
  };

  /**
   * Confirm batch status update
   * 
   * Execution flow:
   * 1. Validate whether target status is selected
   * 2. Call onBatchStatusUpdate callback to update task status
   * 3. Clear selection state
   * 4. Close modal and reset status
   * 5. Show success message
   * 
   * @returns {void} No return value
   */
  const confirmBatchStatusUpdate = () => {
    if (!selectedStatus) {
      message.warning('Please select a status to update');
      return;
    }
    
    onBatchStatusUpdate(selectedTaskIds, selectedStatus);
    onClearSelection();
    setBatchStatusModalVisible(false);
    setSelectedStatus(undefined);
    message.success('Task status updated successfully');
  };

  /**
   * Get quick action button configuration
   * 
   * Returns different action buttons based on whether tasks are selected:
   * - Tasks selected: Show batch update, batch delete, cancel selection
   * - No tasks selected: Show quick tip button
   * 
   * @returns {Array} Button configuration array containing icon, tooltip, callback, etc.
   */
  const getQuickActions = () => {
    if (selectedTaskIds.length > 0) {
      // Batch operations when tasks are selected
      return [
        {
          icon: <EditOutlined />,
          tooltip: `Batch Update Status (${selectedTaskIds.length})`,
          onClick: handleBatchStatusUpdate,
          type: 'primary' as const
        },
        {
          icon: <DeleteOutlined />,
          tooltip: `Batch Delete (${selectedTaskIds.length})`,
          onClick: handleBatchDelete,
          type: 'default' as const,
          danger: true
        },
        {
          icon: <SettingOutlined />,
          tooltip: 'Cancel Selection',
          onClick: onClearSelection,
          type: 'default' as const
        }
      ];
    } else {
      // Regular operations when no tasks are selected
      return [
        {
          icon: <BulbOutlined />,
          tooltip: 'Quick Tip: Select tasks for batch operations',
          onClick: () => message.info('Select one or more tasks for batch operations'),
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
        tooltip="Actions Menu"
      >
        {/* Create Task Button - Always visible */}
        <FloatButton
          icon={<PlusOutlined />}
          tooltip="Create Task"
          onClick={onNewTask}
          type="primary"
        />
        
        {/* Dynamic quick action buttons */
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

      {/* Batch status update modal */}
      <Modal
        title="Batch Update Task Status"
        open={batchStatusModalVisible}
        onOk={confirmBatchStatusUpdate}
        onCancel={() => {
          setBatchStatusModalVisible(false);
          setSelectedStatus(undefined);
        }}
        okText="Update"
        cancelText="Cancel"
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>Update status for <strong>{selectedTaskIds.length}</strong> selected task(s):</p>
          
          <Select
            placeholder="Please select new status"
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