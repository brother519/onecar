import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/store';
import { productApi } from '@/services/api';
import { CodeEditor, useCodeEditor } from '@/components/CodeEditor';
import { WatermarkManager } from '@/components/WatermarkManager';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { Product } from '@/types';

export const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotifications();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    images: [] as string[],
    tags: [] as string[],
    status: 'draft' as Product['status'],
    sku: '',
    stock: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tagInput, setTagInput] = useState('');

  // 代码编辑器用于商品描述
  const descriptionEditor = useCodeEditor(formData.description);

  // 表单验证
  const validateForm = useCallback(() => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('商品名称不能为空');
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errors.push('请输入有效的商品价格');
    }

    if (!formData.category) {
      errors.push('请选择商品分类');
    }

    if (formData.stock && isNaN(Number(formData.stock))) {
      errors.push('库存数量必须为数字');
    }

    return errors;
  }, [formData]);

  // 处理表单提交
  const handleSubmit = useCallback(async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      showError('表单验证失败', errors.join(', '));
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        ...formData,
        description: descriptionEditor.value,
        price: Number(formData.price),
        stock: Number(formData.stock) || 0,
      };

      const response = await productApi.createProduct(productData);

      if (response.success) {
        showSuccess('成功', '商品创建成功');
        navigate('/products');
      }
    } catch (error) {
      showError('错误', '创建商品失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, descriptionEditor.value, validateForm, showSuccess, showError, navigate]);

  // 添加标签
  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  // 移除标签
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  }, []);

  // 添加图片
  const handleAddImage = useCallback((imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl],
    }));
  }, []);

  // 移除图片
  const handleRemoveImage = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }, []);

  // 步骤配置
  const steps = [
    { title: '基本信息', description: '商品的基本信息' },
    { title: '详细描述', description: '使用编辑器编写详细描述' },
    { title: '图片管理', description: '上传和管理商品图片' },
    { title: '高级功能', description: '水印和二维码生成' },
  ];

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="form-step">
            <div className="form-row">
              <div className="form-group">
                <label className="required">商品名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入商品名称"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="商品SKU（可选）"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="required">价格</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>库存</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="库存数量"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="required">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="form-input"
                >
                  <option value="">请选择分类</option>
                  <option value="电子产品">电子产品</option>
                  <option value="服装配饰">服装配饰</option>
                  <option value="家居用品">家居用品</option>
                  <option value="体育用品">体育用品</option>
                  <option value="图书音像">图书音像</option>
                </select>
              </div>

              <div className="form-group">
                <label>状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Product['status'] }))}
                  className="form-input"
                >
                  <option value="draft">草稿</option>
                  <option value="active">已上架</option>
                  <option value="inactive">已下架</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>标签</label>
              <div className="tag-input">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="输入标签后按回车添加"
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn btn-secondary"
                >
                  添加
                </button>
              </div>
              
              <div className="tag-list">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="form-step">
            <div className="form-group">
              <label>商品描述</label>
              <CodeEditor
                {...descriptionEditor.editorProps}
                height={400}
                className="product-description-editor"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <div className="form-group">
              <label>商品图片</label>
              <div className="image-upload">
                <input
                  type="url"
                  placeholder="输入图片URL或上传图片"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const url = (e.target as HTMLInputElement).value.trim();
                      if (url) {
                        handleAddImage(url);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  className="form-input"
                />
              </div>
              
              <div className="image-list">
                {formData.images.map((image, index) => (
                  <div key={index} className="image-item">
                    <img src={image} alt={`商品图片 ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="image-remove"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <div className="advanced-features">
              <div className="feature-section">
                <h3>水印管理</h3>
                <WatermarkManager
                  imageUrl={formData.images[0] || '/placeholder.jpg'}
                  onWatermarkApplied={(watermarkedUrl) => {
                    // 处理水印图片
                    console.log('Watermarked image:', watermarkedUrl);
                  }}
                />
              </div>

              <div className="feature-section">
                <h3>二维码生成</h3>
                <QRCodeGenerator
                  data={`https://example.com/products/${formData.sku || 'new-product'}`}
                  onGenerated={(qrCodeUrl) => {
                    // 处理二维码
                    console.log('QR Code generated:', qrCodeUrl);
                  }}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="product-create-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/products')}
          >
            ← 返回列表
          </button>
          <h1>创建商品</h1>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setFormData({
              name: '',
              description: '',
              price: '',
              category: '',
              images: [],
              tags: [],
              status: 'draft',
              sku: '',
              stock: '',
            })}
          >
            重置
          </button>
          
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '创建中...' : '创建商品'}
          </button>
        </div>
      </div>

      {/* 步骤导航 */}
      <div className="steps-nav">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            onClick={() => setCurrentStep(index)}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-content">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 表单内容 */}
      <div className="form-container">
        {renderStepContent()}
      </div>

      {/* 步骤控制 */}
      <div className="step-controls">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          上一步
        </button>

        <span className="step-indicator">
          {currentStep + 1} / {steps.length}
        </span>

        <button
          className="btn btn-secondary"
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
        >
          下一步
        </button>
      </div>
    </div>
  );
};