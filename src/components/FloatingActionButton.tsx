import React, { useState } from 'react';
import { FloatButton, Modal } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InboxOutlined,
  RollbackOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';

interface FloatingActionButtonProps {
  selectedTask: any | null;
  onCreateTask: () => void;
  onDeleteTask: () => void;
  onArchiveTask: () => void;
  onUnarchiveTask: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  selectedTask,
  onCreateTask,
  onDeleteTask,
  onArchiveTask,
  onUnarchiveTask
}) => {
  const handleDelete = () => {
    if (!selectedTask) {
      Modal.warning({
        title: '提示',
        content: '请先选择一个任务',
      });
      return;
    }

    Modal.confirm({
      title: '确认删除',
      icon: <QuestionCircleOutlined />,
      content: '确定删除该任务吗？删除后无法恢复',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: onDeleteTask,
    });
  };

  const handleArchive = () => {
    if (!selectedTask) {
      Modal.warning({
        title: '提示',
        content: '请先选择一个任务',
      });
      return;
    }

    Modal.confirm({
      title: '确认归档',
      icon: <QuestionCircleOutlined />,
      content: '确定归档该任务吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: onArchiveTask,
    });
  };

  const handleUnarchive = () => {
    if (!selectedTask) {
      Modal.warning({
        title: '提示',
        content: '请先选择一个任务',
      });
      return;
    }

    Modal.confirm({
      title: '确认取消归档',
      icon: <QuestionCircleOutlined />,
      content: '确定取消归档该任务吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: onUnarchiveTask,
    });
  };

  return (
    <FloatButton.Group
      trigger="hover"
      type="primary"
      style={{ right: 24, bottom: 24 }}
      icon={<PlusOutlined />}
    >
      <FloatButton
        icon={<PlusOutlined />}
        tooltip="创建任务"
        onClick={onCreateTask}
      />
      <FloatButton
        icon={<DeleteOutlined />}
        tooltip="删除任务"
        onClick={handleDelete}
      />
      <FloatButton
        icon={<InboxOutlined />}
        tooltip="归档任务"
        onClick={handleArchive}
      />
      <FloatButton
        icon={<RollbackOutlined />}
        tooltip="取消归档"
        onClick={handleUnarchive}
      />
    </FloatButton.Group>
  );
};

export default FloatingActionButton;
