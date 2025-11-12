/**
 * 任务管理系统 - 应用根组件
 *
 * 功能说明：
 * - 设置 Ant Design 国际化为中文
 * - 配置 dayjs 中文本地化
 * - 渲染根页面组件 TaskManager
 *
 * @module App
 */
import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import TaskManager from './pages/TaskManager';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';

dayjs.locale('zh-cn');

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <TaskManager />
    </ConfigProvider>
  );
};

export default App;