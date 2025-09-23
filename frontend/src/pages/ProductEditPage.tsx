import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ProductEditPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="product-edit-page">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/products')}>
          ← 返回列表
        </button>
        <h1>编辑商品</h1>
      </div>
      
      <div className="page-content">
        <p>商品编辑页面正在开发中...</p>
        <p>此页面将包含与创建页面类似的功能，但用于编辑现有商品。</p>
      </div>
    </div>
  );
};