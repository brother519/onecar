import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CaptchaInput, useCaptcha } from '@/components/CaptchaInput';
import { captchaApi } from '@/services/api';

export const BatchOperationPage: React.FC = () => {
  const navigate = useNavigate();
  
  const { isVerified, captchaProps } = useCaptcha(async (token, value) => {
    try {
      const response = await captchaApi.verifyCaptcha(token, value);
      return response.success;
    } catch {
      return false;
    }
  });

  return (
    <div className="batch-operation-page">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/products')}>
          ← 返回列表
        </button>
        <h1>批量操作</h1>
      </div>
      
      <div className="page-content">
        <div className="security-verification">
          <h3>安全验证</h3>
          <p>批量操作需要验证码验证以确保操作安全性</p>
          
          <CaptchaInput {...captchaProps} />
          
          {isVerified && (
            <div className="verification-success">
              ✅ 验证成功，可以进行批量操作
            </div>
          )}
        </div>
        
        <div className="batch-operations">
          <h3>可用操作</h3>
          <div className="operation-list">
            <button className="operation-item" disabled={!isVerified}>
              批量更新价格
            </button>
            <button className="operation-item" disabled={!isVerified}>
              批量修改分类
            </button>
            <button className="operation-item" disabled={!isVerified}>
              批量上下架
            </button>
            <button className="operation-item" disabled={!isVerified}>
              批量删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};