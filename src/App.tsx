import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import TaskManagementPage from './components/TaskManagementPage';
import './index.css';

// 配置 dayjs
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// dayjs 全局配置
dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          // 自定义主题色彩
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <TaskManagementPage />
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;