import React, { useEffect } from 'react';
import HeaderNav from './HeaderNav';
import SearchArea from './SearchArea';
import FooterInfo from './FooterInfo';
import { initSearchHistory } from '../../store/baiduStore';
import './BaiduHomePage.css';

const BaiduHomePage: React.FC = () => {
  // 初始化搜索历史
  useEffect(() => {
    initSearchHistory();
  }, []);

  // 搜索处理
  const handleSearch = (keyword: string) => {
    console.log('Searching for:', keyword);
    // 这里可以添加自定义搜索逻辑
    // 默认在SearchBox组件中已处理跳转
  };

  return (
    <div className="baidu-homepage">
      {/* 头部导航 */}
      <HeaderNav />

      {/* 主要内容区 - 搜索区域 */}
      <main className="main-content">
        <SearchArea onSearch={handleSearch} />
      </main>

      {/* 底部信息 */}
      <FooterInfo />
    </div>
  );
};

export default BaiduHomePage;
