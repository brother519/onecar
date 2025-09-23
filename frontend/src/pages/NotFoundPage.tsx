import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <div className="error-message">页面未找到</div>
        <div className="error-description">
          抱歉，您访问的页面不存在或已被移除
        </div>
        
        <div className="error-actions">
          <button className="btn btn-primary" onClick={() => navigate('/products')}>
            返回首页
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            返回上页
          </button>
        </div>
      </div>
    </div>
  );
};