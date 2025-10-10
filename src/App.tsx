import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import TaskManagementPage from './components/TaskManagementPage';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// 配置 dayjs
dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <TaskManagementPage />
    </ConfigProvider>
  );
};

export default App;