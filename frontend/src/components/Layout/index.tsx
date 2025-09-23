import React from 'react';
import { useUIStore } from '@/store';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen, sidebarCollapsed, theme, toggleSidebar, toggleTheme } = useUIStore();

  return (
    <div className={`layout ${theme}`} data-sidebar-open={sidebarOpen} data-sidebar-collapsed={sidebarCollapsed}>
      {/* 头部导航 */}
      <header className="layout-header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <h1 className="app-title">OneCar 商品管理系统</h1>
        </div>
        
        <div className="header-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <div className="user-menu">
            <span className="user-name">管理员</span>
            <div className="user-avatar">👤</div>
          </div>
        </div>
      </header>

      {/* 侧边栏 */}
      {sidebarOpen && (
        <aside className="layout-sidebar">
          <nav className="sidebar-nav">
            <a href="/products" className="nav-item active">
              📦 商品管理
            </a>
            <a href="/products/create" className="nav-item">
              ➕ 新建商品
            </a>
            <a href="/products/batch" className="nav-item">
              🔧 批量操作
            </a>
          </nav>
        </aside>
      )}

      {/* 主内容区 */}
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
};