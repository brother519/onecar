import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProductListPage } from './pages/ProductListPage';
import { ProductCreatePage } from './pages/ProductCreatePage';
import { ProductEditPage } from './pages/ProductEditPage';
import { BatchOperationPage } from './pages/BatchOperationPage';
import { NotFoundPage } from './pages/NotFoundPage';
import BaiduClonePageView from './pages/BaiduClonePageView';
import './styles/index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* 首页重定向到产品列表 */}
          <Route path="/" element={<Navigate to="/products" replace />} />
          
          {/* 产品管理路由 */}
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/create" element={<ProductCreatePage />} />
          <Route path="/products/:id/edit" element={<ProductEditPage />} />
          <Route path="/products/batch" element={<BatchOperationPage />} />
          
          {/* 百度克隆功能 */}
          <Route path="/baidu-clone" element={<BaiduClonePageView />} />
          
          {/* 404 页面 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;