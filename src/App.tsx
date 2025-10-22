/**
 * 应用程序根组件
 * 作为整个应用的入口点，负责渲染主页面组件
 */
import React from 'react';
import BaiduHomePage from './components/baidu/BaiduHomePage';
import './index.css';

/**
 * App 组件
 * @returns {React.ReactElement} 返回百度首页组件
 */
const App: React.FC = () => {
  return <BaiduHomePage />;
};

export default App;