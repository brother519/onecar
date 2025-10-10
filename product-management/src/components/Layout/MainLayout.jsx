import React, { useState, useEffect } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Badge, notification } from 'antd'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  ShopOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toggleSider, setScreenSize } from '@/store/slices/uiSlice'
import { logout } from '@/store/slices/userSlice'

const { Header, Sider, Content } = Layout

const MainLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  
  const { siderCollapsed, screenSize } = useSelector(state => state.ui.layout)
  const { userInfo, isAuthenticated } = useSelector(state => state.user)
  
  // 菜单项配置
  const menuItems = [
    {
      key: '/products',
      icon: <ShopOutlined />,
      label: '商品管理',
      children: [
        {
          key: '/products',
          label: '商品列表',
        },
        {
          key: '/products/add',
          label: '新增商品',
        },
        {
          key: '/products/batch',
          label: '批量操作',
        },
      ],
    },
    {
      key: '/categories',
      icon: <DatabaseOutlined />,
      label: '分类管理',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '数据报表',
    },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
  ]
  
  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]
  
  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      let size = 'desktop'
      
      if (width < 768) {
        size = 'mobile'
      } else if (width < 1200) {
        size = 'tablet'
      }
      
      dispatch(setScreenSize(size))
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [dispatch])
  
  // 处理菜单点击
  const handleMenuClick = ({ key }) => {
    navigate(key)
  }
  
  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }) => {
    switch (key) {
      case 'profile':
        navigate('/profile')
        break
      case 'settings':
        navigate('/settings')
        break
      case 'logout':
        dispatch(logout())
        notification.success({
          message: '退出成功',
          description: '您已成功退出系统',
        })
        navigate('/login')
        break
      default:
        break
    }
  }
  
  // 切换侧边栏
  const handleToggleSider = () => {
    dispatch(toggleSider())
  }
  
  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/products')) {
      return [path]
    }
    return [path]
  }
  
  // 获取展开的菜单项
  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/products')) {
      return ['/products']
    }
    return []
  }
  
  // 移动端自动收起侧边栏
  const siderWidth = screenSize === 'mobile' ? 0 : siderCollapsed ? 80 : 200
  const shouldShowSider = screenSize !== 'mobile'
  
  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f0f2f5' 
      }}>
        <div>请先登录</div>
      </div>
    )
  }
  
  return (
    <Layout style={{ height: '100vh' }}>
      {shouldShowSider && (
        <Sider
          trigger={null}
          collapsible
          collapsed={siderCollapsed}
          width={200}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              height: 32,
              margin: 16,
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {siderCollapsed ? '商品' : '商品管理系统'}
          </div>
          
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={getSelectedKeys()}
            defaultOpenKeys={getOpenKeys()}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
      )}
      
      <Layout style={{ marginLeft: shouldShowSider ? siderWidth : 0 }}>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={handleToggleSider}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            
            <h1 style={{ margin: 0, marginLeft: 16, fontSize: 18, color: '#333' }}>
              商品后台管理系统
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 16 }} />}
                style={{ fontSize: '16px' }}
              />
            </Badge>
            
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                }}
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  src={userInfo.avatar}
                  style={{ marginRight: 8 }}
                />
                <span style={{ color: '#333', fontWeight: 500 }}>
                  {userInfo.name || '用户'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content
          style={{
            margin: 0,
            overflow: 'auto',
            background: '#f0f2f5',
            position: 'relative',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout