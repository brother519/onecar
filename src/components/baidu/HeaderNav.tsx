import React, { useState } from 'react';
import { NavItem } from '../../types/baidu';
import './HeaderNav.css';

const HeaderNav: React.FC = () => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const mainNavItems: NavItem[] = [
    { name: '新闻', url: 'https://news.baidu.com', displayCondition: true, requireAuth: false },
    { name: 'hao123', url: 'https://www.hao123.com', displayCondition: true, requireAuth: false },
    { name: '地图', url: 'https://map.baidu.com', displayCondition: true, requireAuth: false },
    { name: '贴吧', url: 'https://tieba.baidu.com', displayCondition: true, requireAuth: false },
    { name: '视频', url: 'https://v.baidu.com', displayCondition: true, requireAuth: false },
    { name: '图片', url: 'https://image.baidu.com', displayCondition: true, requireAuth: false },
    { name: '网盘', url: 'https://pan.baidu.com', displayCondition: true, requireAuth: false },
  ];

  const moreNavItems: NavItem[] = [
    { name: '学术', url: 'https://xueshu.baidu.com', displayCondition: true, requireAuth: false },
    { name: '翻译', url: 'https://fanyi.baidu.com', displayCondition: true, requireAuth: false },
    { name: '文库', url: 'https://wenku.baidu.com', displayCondition: true, requireAuth: false },
    { name: '百科', url: 'https://baike.baidu.com', displayCondition: true, requireAuth: false },
  ];

  return (
    <header className="header-nav">
      <div className="header-nav-container">
        {/* 左侧导航 */}
        <nav className="nav-left" aria-label="主导航">
          <ul className="nav-list">
            {mainNavItems.map((item) => (
              <li key={item.name} className="nav-item">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="nav-link"
                >
                  {item.name}
                </a>
              </li>
            ))}
            
            {/* 更多菜单 */}
            <li 
              className="nav-item nav-more"
              onMouseEnter={() => setShowMoreMenu(true)}
              onMouseLeave={() => setShowMoreMenu(false)}
            >
              <span className="nav-link">
                更多 ▼
              </span>
              
              {showMoreMenu && (
                <div className="dropdown-menu">
                  {moreNavItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dropdown-item"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </li>
          </ul>
        </nav>

        {/* 右侧用户区 */}
        <div className="nav-right">
          <div 
            className="user-entry"
            onMouseEnter={() => setShowUserMenu(true)}
            onMouseLeave={() => setShowUserMenu(false)}
          >
            <span className="user-link">登录</span>
            
            {showUserMenu && (
              <div className="dropdown-menu user-menu">
                <a href="#" className="dropdown-item">登录</a>
                <a href="#" className="dropdown-item">注册</a>
              </div>
            )}
          </div>
          
          <a href="#" className="nav-link settings-link">设置</a>
        </div>
      </div>
    </header>
  );
};

export default HeaderNav;
