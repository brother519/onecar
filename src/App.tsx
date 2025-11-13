/**
 * Task Management System - Application Root Component
 *
 * Features:
 * - Set Ant Design internationalization to Chinese
 * - Configure dayjs Chinese localization
 * - Render root page component TaskManager
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