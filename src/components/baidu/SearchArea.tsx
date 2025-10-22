import React from 'react';
import BaiduLogo from './BaiduLogo';
import SearchBox from './SearchBox';
import HotWordTags from './HotWordTags';
import './SearchArea.css';

interface SearchAreaProps {
  onSearch?: (keyword: string) => void;
}

const SearchArea: React.FC<SearchAreaProps> = ({ onSearch }) => {
  const handleLogoClick = () => {
    // 点击Logo刷新页面或回到首页
    window.location.reload();
  };

  return (
    <section className="search-area" role="search">
      <div className="search-area-container">
        {/* 百度Logo */}
        <div className="search-area-logo">
          <BaiduLogo onClick={handleLogoClick} />
        </div>

        {/* 搜索框 */}
        <div className="search-area-input">
          <SearchBox onSearch={onSearch} />
        </div>

        {/* 热词标签 */}
        <div className="search-area-hotwords">
          <HotWordTags displayCount={8} enableAutoRotate={false} />
        </div>
      </div>
    </section>
  );
};

export default SearchArea;
