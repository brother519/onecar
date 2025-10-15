/**
 * FloatingButton - 浮动操作按钮组件
 * 
 * 功能概述:
 * - 提供快捷的任务创建入口
 * - 支持批量删除选中的任务
 * - 支持批量更新任务状态
 * - 根据选中状态动态调整可用操作
 * 
 * 组件特点:
 * - 悬浮展开式设计，节省页面空间
 * - 根据 selectedTaskIds 数量动态显示批量操作按钮
 * - 集成确认对话框，防止误操作
 * - 提供状态更新弹窗，支持可视化状态选择
 * 
 * 依赖组件:
 * - antd: FloatButton, Modal, Select, Space, message
 * - @ant-design/icons: 各类图标组件
 * 
 * 状态管理:
 * - batchStatusModalVisible: 控制批量状态更新弹窗
 * - selectedStatus: 用户选择的目标状态
 * 
 * 使用示例:
 * <FloatingButton
 *   selectedTaskIds={selectedIds}
 *   onNewTask={handleNewTask}
 *   onBatchDelete={handleBatchDelete}
 *   onBatchStatusUpdate={handleBatchStatusUpdate}
 *   onClearSelection={handleClearSelection}
 * />
 * 
 * @version 1.0.0
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
 * FloatingButton 组件的属性接口定义
 * 
 * 属性说明:
 * @property {string[]} selectedTaskIds - 当前选中的任务ID数组
 *   - 必填: 是
 *   - 用途: 控制批量操作按钮的显示状态和操作对象
 *   - 数据来源: 父组件（TaskManager）维护的选中状态
 * 
 * @property {() => void} onNewTask - 新建任务回调函数
 *   - 必填: 是
 *   - 触发时机: 用户点击"新建任务"按钮时
 *   - 期望行为: 父组件打开任务创建表单
 * 
 * @property {(taskIds: string[]) => void} onBatchDelete - 批量删除回调函数
 *   - 必填: 是
 *   - 参数: taskIds - 待删除的任务ID数组
 *   - 触发时机: 用户确认批量删除操作后
 *   - 期望行为: 父组件调用 API 删除指定任务
 * 
 * @property {(taskIds: string[], status: TaskStatus) => void} onBatchStatusUpdate - 批量状态更新回调函数
 *   - 必填: 是
 *   - 参数: 
 *     - taskIds: 待更新的任务ID数组
 *     - status: 目标状态值
 *   - 触发时机: 用户在弹窗中选择状态并确认后
 *   - 期望行为: 父组件调用 API 更新任务状态
 * 
 * @property {() => void} onClearSelection - 清空选中状态回调函数
 *   - 必填: 是
 *   - 触发时机: 用户点击"取消选择"按钮或批量操作完成后
 *   - 期望行为: 父组件清空 selectedTaskIds 数组
 */
interface FloatingButtonProps {
  selectedTaskIds: string[];
  onNewTask: () => void;
  onBatchDelete: (taskIds: string[]) => void;
  onBatchStatusUpdate: (taskIds: string[], status: TaskStatus) => void;
  onClearSelection: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  selectedTaskIds,
  onNewTask,
  onBatchDelete,
  onBatchStatusUpdate,
  onClearSelection
}) => {
  /**
   * 批量状态更新弹窗的显示状态
   * 
   * @type {boolean}
   * @default false (隐藏)
   * 
   * 更新时机:
   * - 设置为 true: 用户点击"批量更新状态"按钮
   * - 设置为 false: 用户点击"确定"按钮、"取消"按钮或关闭弹窗
   * 
   * 关联组件: Modal 组件的 open 属性
   * 影响范围: 控制批量状态更新弹窗的显示/隐藏
   */
  const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
  
  /**
   * 用户在批量状态更新弹窗中选择的目标状态
   * 
   * @type {TaskStatus | undefined}
   * @default undefined (未选择)
   * 
   * 更新时机:
   * - 用户在 Select 组件中选择状态时更新
   * - 弹窗打开或关闭时重置为 undefined
   * 
   * 使用场景:
   * - 作为 Select 组件的 value 属性，实现受控组件
   * - 在确认更新时作为参数传递给父组件
   * - 用于条件渲染状态描述提示
   * 
   * 验证规则:
   * - 确认更新时必须有值，否则显示警告提示
   */
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();

  /**
   * 处理批量删除操作
   * 
   * 功能描述:
   * 显示确认对话框，用户确认后执行批量删除操作。
   * 为防止误操作，对话框会明确显示待删除的任务数量。
   * 
   * 执行流程:
   * 1. 调用 Modal.confirm 显示确认对话框
   * 2. 对话框显示删除数量和警告信息
   * 3. 用户点击"删除"按钮后:
   *    a. 调用父组件的 onBatchDelete 回调
   *    b. 调用 onClearSelection 清空选中状态
   *    c. 显示成功提示消息
   * 4. 用户点击"取消"按钮: 关闭对话框，不执行任何操作
   * 
   * @returns {void}
   * 
   * 副作用:
   * - 显示模态对话框
   * - 触发父组件的批量删除回调
   * - 清空选中状态
   * - 显示消息提示
   * 
   * 注意事项:
   * - 此操作不可撤销，需通过确认对话框防止误操作
   * - 删除成功后会自动清空选中状态
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
   * 打开批量状态更新弹窗
   * 
   * 功能描述:
   * 打开批量状态更新弹窗，允许用户为选中的任务批量更新状态。
   * 
   * 执行流程:
   * 1. 设置弹窗可见状态为 true
   * 2. 重置状态选择器的值为 undefined
   * 
   * @returns {void}
   * 
   * 副作用:
   * - 更新组件内部状态 batchStatusModalVisible
   * - 重置 selectedStatus 为初始值
   */
  const handleBatchStatusUpdate = () => {
    setBatchStatusModalVisible(true);
    setSelectedStatus(undefined);
  };

  /**
   * 确认并执行批量状态更新操作
   * 
   * 功能描述:
   * 验证用户选择后，执行批量状态更新操作并清理状态。
   * 
   * 执行流程:
   * 1. 验证用户是否选择了目标状态
   * 2. 未选择时显示警告提示并中断执行
   * 3. 调用父组件的 onBatchStatusUpdate 回调，传入任务ID数组和目标状态
   * 4. 调用 onClearSelection 清空选中状态
   * 5. 关闭弹窗并重置状态选择器
   * 6. 显示成功提示
   * 
   * @returns {void}
   * 
   * 副作用:
   * - 触发父组件的批量状态更新回调
   * - 更新多个组件内部状态
   * - 清空选中状态
   * - 显示消息提示
   * 
   * 数据验证:
   * - 必须选择目标状态，否则显示警告并中断操作
   */
  const confirmBatchStatusUpdate = () => {
    // 验证用户是否选择了目标状态
    if (!selectedStatus) {
      message.warning('请选择要更新的状态');
      return;
    }
    
    // 调用父组件回调，执行批量状态更新
    onBatchStatusUpdate(selectedTaskIds, selectedStatus);
    // 清空选中状态
    onClearSelection();
    // 关闭弹窗并重置状态
    setBatchStatusModalVisible(false);
    setSelectedStatus(undefined);
    // 显示成功提示
    message.success('任务状态更新成功');
  };

  /**
   * 根据是否有选中任务动态生成快捷操作按钮配置
   * 
   * 功能描述:
   * 根据 selectedTaskIds 的长度，动态返回不同的按钮配置数组。
   * 实现了 UI 随数据状态的动态调整。
   * 
   * 逻辑分支:
   * - 有选中任务 (selectedTaskIds.length > 0): 
   *   返回批量操作按钮（更新状态、删除、取消选择）
   * - 无选中任务 (selectedTaskIds.length === 0): 
   *   返回提示按钮，引导用户使用批量操作功能
   * 
   * @returns {Array} 按钮配置对象数组
   * 
   * 返回对象结构:
   * @property {React.ReactNode} icon - 按钮图标组件
   * @property {string} tooltip - 按钮提示文本
   * @property {() => void} onClick - 点击事件处理函数
   * @property {string} type - 按钮类型 ('primary' | 'default')
   * @property {boolean} [danger] - 是否为危险操作（可选，仅删除按钮设置）
   * 
   * 设计意图:
   * - 根据用户是否选中任务，动态调整可用操作
   * - 无选中任务时提供使用提示，优化用户体验
   * - 有选中任务时提供批量操作快捷入口
   */
  const getQuickActions = () => {
    // 判断是否有选中的任务
    if (selectedTaskIds.length > 0) {
      // 有选中任务时，返回批量操作按钮配置
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
      // 无选中任务时，返回提示按钮配置，引导用户使用批量操作功能
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
      {/* 浮动按钮组 - 采用悬浮展开式设计，节省页面空间 */}
      <FloatButton.Group
        trigger="hover"  // 鼠标悬停时展开按钮组
        type="primary"   // 主按钮样式
        style={{ right: 24 }}  // 距离右侧 24px
        icon={<SettingOutlined />}  // 按钮组图标
        tooltip="操作菜单"  // 提示文本
      >
        {/* 新建任务按钮 - 始终显示，提供快捷的任务创建入口 */}
        <FloatButton
          icon={<PlusOutlined />}
          tooltip="新建任务"
          onClick={onNewTask}
          type="primary"
        />
        
        {/* 动态快捷操作按钮 - 通过 getQuickActions 方法动态生成 */}
        {/* 根据 selectedTaskIds 长度自动调整显示的按钮 */}
        {getQuickActions().map((action, index) => (
          <FloatButton
            key={index}
            icon={action.icon}
            tooltip={action.tooltip}
            onClick={action.onClick}
            type={action.type}
            {...(action.danger && { style: { backgroundColor: '#ff4d4f' } })}  // 危险操作按钮应用红色背景
          />
        ))}
      </FloatButton.Group>

      {/* 批量状态更新弹窗 - 提供可视化的状态选择界面 */}
      <Modal
        title="批量更新任务状态"
        open={batchStatusModalVisible}  // 控制弹窗显示状态
        onOk={confirmBatchStatusUpdate}  // 点击确定按钮时的回调
        onCancel={() => {
          // 关闭弹窗并重置状态选择器
          setBatchStatusModalVisible(false);
          setSelectedStatus(undefined);
        }}
        okText="更新"
        cancelText="取消"
        width={400}  // 弹窗宽度
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 显示将要更新的任务数量 */}
          <p>将为选中的 <strong>{selectedTaskIds.length}</strong> 个任务更新状态：</p>
          
          {/* 状态选择器 - 受控组件，提供所有可用的任务状态选项 */}
          <Select
            placeholder="请选择新状态"
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: '100%' }}
            size="large"
          >
            {/* 遍历所有任务状态，生成选项 */}
            {Object.values(TaskStatus).map(status => (
              <Option key={status} value={status}>
                <Space>
                  {/* 状态颜色指示器 - 通过颜色映射将语义化颜色转换为实际颜色值 */}
                  <span 
                    style={{ 
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      // 颜色映射逻辑：将 STATUS_CONFIG 中的语义化颜色转换为实际的十六进制颜色代码
                      // default -> #d9d9d9 (灰色，表示待处理)
                      // processing -> #1890ff (蓝色，表示进行中)
                      // success -> #52c41a (绿色，表示已完成)
                      // error -> #ff4d4f (红色，表示已取消)
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
          
          {/* 状态描述提示 - 根据选中的状态动态显示描述信息 */}
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