/**
 * FloatingButton 组件
 * 
 * 功能描述：
 * 任务管理系统中的浮动操作按钮组件，提供快捷操作入口。
 * 
 * 主要职责：
 * - 提供新建任务的快捷入口
 * - 支持批量更新任务状态
 * - 支持批量删除任务
 * - 管理任务选择状态
 * 
 * 主要特性：
 * - 动态菜单：根据是否有选中任务显示不同的操作按钮
 * - 二次确认：批量删除操作需要用户确认
 * - 状态可视化：批量状态更新时显示状态颜色和描述信息
 * - 用户反馈：操作成功后提供消息提示
 * 
 * 依赖关系：
 * - UI 组件：Ant Design (FloatButton, Modal, Select, Space, message)
 * - 图标库：@ant-design/icons
 * - 类型定义：TaskStatus, STATUS_CONFIG (来自 types/task.ts)
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
 * FloatingButton 组件属性接口
 * 
 * @interface FloatingButtonProps
 * @property {string[]} selectedTaskIds - 当前已选中的任务 ID 列表，由父组件维护
 * @property {() => void} onNewTask - 新建任务回调函数，点击新建按钮时触发
 * @property {(taskIds: string[]) => void} onBatchDelete - 批量删除回调函数，用户确认删除后调用，传入待删除的任务 ID 列表
 * @property {(taskIds: string[], status: TaskStatus) => void} onBatchStatusUpdate - 批量状态更新回调函数，用户选择目标状态并确认后调用
 * @property {() => void} onClearSelection - 清除选择回调函数，批量操作完成后或用户主动取消选择时调用
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
   * - true: 弹窗显示
   * - false: 弹窗隐藏
   * 变更时机：点击批量更新按钮打开，点击取消/确定按钮关闭
   */
  const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
  
  /**
   * 弹窗中用户选择的目标状态
   * - undefined: 未选择任何状态（初始状态）
   * - TaskStatus: 用户选择的目标状态值
   * 变更时机：打开弹窗时重置为 undefined，用户在下拉框中选择时更新
   * UI 影响：选择状态后会显示对应的状态描述信息
   */
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();

  /**
   * 处理批量删除操作
   * 
   * 功能说明：
   * 触发批量删除确认流程，使用 Modal.confirm 进行二次确认以防止误操作。
   * 
   * 执行流程：
   * 1. 显示确认对话框，展示待删除任务数量
   * 2. 用户点击确认后执行删除回调
   * 3. 调用 onBatchDelete 通知父组件执行删除
   * 4. 调用 onClearSelection 清除选择状态
   * 5. 显示删除成功提示消息
   * 
   * 用户交互：
   * - 对话框类型：danger (危险操作)
   * - 确认按钮文案："删除"
   * - 取消按钮文案："取消"
   * - 操作不可撤销警告提示
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
   * 功能说明：
   * 显示批量状态更新弹窗，并重置状态选择器为初始状态。
   * 
   * 执行行为：
   * - 设置弹窗可见状态为 true
   * - 重置 selectedStatus 为 undefined，清除之前的选择
   */
  const handleBatchStatusUpdate = () => {
    setBatchStatusModalVisible(true);
    setSelectedStatus(undefined);
  };

  /**
   * 确认并执行批量状态更新
   * 
   * 功能说明：
   * 验证用户是否选择了目标状态，并执行批量状态更新操作。
   * 
   * 执行流程：
   * 1. 验证检查：确认用户已选择目标状态
   *    - 未选择：显示警告提示并终止操作
   *    - 已选择：继续执行
   * 2. 调用 onBatchStatusUpdate 通知父组件执行状态更新
   * 3. 调用 onClearSelection 清除选择状态
   * 4. 关闭弹窗并重置状态选择器
   * 5. 显示更新成功提示消息
   * 
   * 数据流向：
   * selectedTaskIds + selectedStatus → 父组件 → 后端 API
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
   * 获取快捷操作菜单配置
   * 
   * 功能说明：
   * 根据当前是否有选中任务，动态生成不同的快捷操作按钮配置。
   * 
   * 业务逻辑：
   * - 有选中任务 (selectedTaskIds.length > 0):
   *   返回批量操作按钮组：批量更新状态、批量删除、取消选择
   *   按钮提示文案中包含选中任务数量
   * 
   * - 无选中任务 (selectedTaskIds.length === 0):
   *   返回快捷提示按钮，引导用户选择任务进行批量操作
   * 
   * @returns {Array} 按钮配置对象数组，每个对象包含：
   *   - icon: 按钮图标 (React 元素)
   *   - tooltip: 悬停提示文案
   *   - onClick: 点击事件处理函数
   *   - type: 按钮类型 ('primary' | 'default')
   *   - danger: (可选) 是否为危险操作按钮
   */
  const getQuickActions = () => {
    if (selectedTaskIds.length > 0) {
      // 有选中任务时的批量操作按钮组
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
      // 无选中任务时的快捷提示按钮
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
      {/* 
        浮动按钮组容器
        配置说明：
        - trigger="hover": 鼠标悬停时展开子按钮
        - type="primary": 主按钮样式
        - right: 24: 距离页面右侧 24px
        - icon: 主按钮图标（设置图标）
       */}
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 24 }}
        icon={<SettingOutlined />}
        tooltip="操作菜单"
      >
        {/* 
          新建任务按钮 - 始终显示
          无论是否有选中任务，此按钮始终可用
         */}
        <FloatButton
          icon={<PlusOutlined />}
          tooltip="新建任务"
          onClick={onNewTask}
          type="primary"
        />
        
        {/* 
          动态快捷操作按钮组
          根据 getQuickActions() 的返回值动态渲染：
          - 有选中任务：显示批量更新、批量删除、取消选择按钮
          - 无选中任务：显示快捷提示按钮
          
          条件渲染逻辑：
          - action.danger 为 true 时，应用红色背景样式（#ff4d4f）表示危险操作
         */}
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

      {/* 
        批量状态更新弹窗
        
        弹窗结构：
        1. 标题区：显示操作名称
        2. 内容区：
           - 提示信息：显示选中任务数量
           - 状态选择器：下拉框选择目标状态
           - 状态描述：选择状态后显示该状态的详细说明
        3. 操作区：更新按钮 + 取消按钮
        
        交互流程：
        - 取消操作：关闭弹窗并重置状态选择
        - 确认操作：调用 confirmBatchStatusUpdate 执行更新
       */}
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
          {/* 选中任务数量提示 */}
          <p>将为选中的 <strong>{selectedTaskIds.length}</strong> 个任务更新状态：</p>
          
          {/* 
            状态选择器
            遍历 TaskStatus 枚举值生成下拉选项
            每个选项包含：
            - 状态颜色指示器（圆点）
            - 状态标签文本
           */}
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
                  {/* 
                    状态颜色指示器
                    根据 STATUS_CONFIG 中的 color 值映射实际颜色代码：
                    - default: #d9d9d9 (灰色)
                    - processing: #1890ff (蓝色)
                    - success: #52c41a (绿色)
                    - error: #ff4d4f (红色)
                   */}
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
          
          {/* 
            状态描述信息区域
            条件渲染：仅在用户选择了状态后显示
            
            样式规格：
            - 背景色：#f6ffed (浅绿色)
            - 边框：1px solid #b7eb8f (绿色边框)
            - 圆角：4px
            - 字体大小：12px
            - 文字颜色：#389e0d (深绿色)
            - 内边距：8px 12px
            
            显示内容：当前选中状态的详细描述信息（来自 STATUS_CONFIG）
           */}
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