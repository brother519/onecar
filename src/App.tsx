import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import 'antd/dist/reset.css';
import './styles/App.css';

// 导入页面组件
import HomePage from './pages/HomePage';

// 导入全局上下文提供者
import { CartProvider } from './contexts/CartContext';
import { UserProvider } from './contexts/UserContext';

const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
  return (
    <UserProvider>
      <CartProvider>
        <Router>
          <Layout className="app-layout">
            <Header className="app-header">
              <div className="logo">OneCar商城</div>
            </Header>
            <Content className="app-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
              </Routes>
            </Content>
            <Footer className="app-footer">
              OneCar &copy; {new Date().getFullYear()} - 高品质汽车配件销售平台
            </Footer>
          </Layout>
        </Router>
      </CartProvider>
    </UserProvider>
  );
};

export default App;