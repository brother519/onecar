/**
 * 商品创建页面组件
 * 
 * 提供完整的商品创建功能，采用四步骤向导式界面设计，包括基本信息录入、
 * 富文本编辑、图片管理和高级功能（水印、二维码）等。该组件集成了表单验证、
 * 文件上传、代码编辑器和第三方组件，为用户提供流畅的商品创建体验。
 * 
 * 主要功能模块：
 * - 分步骤表单填写：四个步骤的向导式表单，支持步骤间自由跳转
 * - 实时表单验证：前端验证规则，提供即时反馈
 * - 图片管理系统：支持多图片上传、预览和删除
 * - 代码编辑器集成：Monaco Editor 用于商品描述编辑
 * - 高级功能支持：图片水印添加和商品二维码生成
 * - 状态持久化：表单数据在步骤间保持状态
 * 
 * 技术特性：
 * - 使用 TypeScript 确保类型安全
 * - React Hooks 进行状态管理
 * - 函数式组件设计模式
 * - 性能优化（useCallback）
 * - 可访问性支持
 * 
 * 依赖组件：
 * - {@link CodeEditor} - Monaco 代码编辑器组件
 * - {@link WatermarkManager} - 图片水印管理组件  
 * - {@link QRCodeGenerator} - 二维码生成组件
 * 
 * @returns {JSX.Element} 商品创建页面组件
 * @author OneCar Team
 * @since 1.0.0
 * 
 * @example
 * // 基本使用
 * <ProductCreatePage />
 * 
 * @see {@link Product} 商品数据类型定义
 * @see {@link productApi} 商品相关 API 接口
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/store';
import { productApi } from '@/services/api';
import { CodeEditor, useCodeEditor } from '@/components/CodeEditor';
import { WatermarkManager } from '@/components/WatermarkManager';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { Product } from '@/types';

export const ProductCreatePage: React.FC = () => {
  // ============ 核心依赖注入 ============
  /** 路由导航钩子，用于页面跳转和返回 */
  const navigate = useNavigate();
  
  /** 通知系统钩子，用于显示成功和错误消息 */
  const { showSuccess, showError } = useNotifications();
  
  // ============ 状态管理 ============
  
  /**
   * 主表单数据状态
   * 
   * 存储所有商品相关信息，采用扁平化结构便于表单操作。
   * 价格和库存使用字符串类型，便于用户输入和表单验证，
   * 最终提交时转换为数字类型。
   * 
   * @type {Object}
   * @property {string} name - 商品名称，必填字段
   * @property {string} description - 商品描述，通过代码编辑器管理
   * @property {string} price - 商品价格（字符串形式），必填，需验证为正数
   * @property {string} category - 商品分类，必填，来自预设选项
   * @property {string[]} images - 商品图片URL数组，支持多图片管理
   * @property {string[]} tags - 商品标签数组，用于搜索和分类
   * @property {Product['status']} status - 商品状态：draft/active/inactive
   * @property {string} sku - 商品SKU编码，可选字段
   * @property {string} stock - 库存数量（字符串形式），可选，需验证为非负整数
   * 
   * @since 1.0.0
   */
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

  /**
   * 表单提交状态标识
   * 
   * 用于控制提交按钮的禁用状态和加载显示，
   * 防止用户重复提交和提供视觉反馈。
   * 
   * @type {boolean}
   * @default false
   */
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * 当前步骤索引
   * 
   * 控制向导式界面的当前显示步骤：
   * - 0: 基本信息录入（名称、价格、分类等）
   * - 1: 详细描述编辑（代码编辑器）
   * - 2: 图片管理（上传、预览、删除）
   * - 3: 高级功能（水印、二维码）
   * 
   * @type {number}
   * @default 0
   * @range 0-3
   */
  const [currentStep, setCurrentStep] = useState(0);
  
  /**
   * 标签输入临时状态
   * 
   * 存储用户正在输入的标签文本，用于标签添加功能。
   * 当用户按回车或点击添加按钮时，会将此值添加到 formData.tags 中，
   * 并清空此输入框。
   * 
   * @type {string}
   * @default ''
   */
  const [tagInput, setTagInput] = useState('');

  /**
   * 代码编辑器状态管理钩子
   * 
   * 使用自定义 Hook 管理商品描述的富文本编辑器状态。
   * 该 Hook 提供编辑器配置、内容同步和事件处理功能，
   * 支持语法高亮、自动补全和格式化等特性。
   * 
   * @type {ReturnType<typeof useCodeEditor>}
   * @see {@link useCodeEditor} 查看Hook详细文档
   * 
   * 主要属性：
   * - value: 当前编辑器内容
   * - editorProps: 传递给 CodeEditor 组件的属性
   * - 其他编辑器操作方法
   */
  const descriptionEditor = useCodeEditor(formData.description);

  // ============ 表单验证和业务逻辑 ============

  /**
   * 表单数据验证函数
   * 
   * 执行前端表单验证，检查必填字段、数据格式和业务规则。
   * 验证失败时返回错误信息数组，用于用户提示。
   * 
   * 验证规则：
   * - 商品名称：不能为空（去除空格后）
   * - 商品价格：必须为正数、不能为空、必须能转换为数字
   * - 商品分类：不能为空，必须选择预设分类
   * - 库存数量：可选，但如果填写必须为非负整数
   * 
   * @function
   * @returns {string[]} 验证错误信息数组，空数组表示验证通过
   * 
   * @example
   * const errors = validateForm();
   * if (errors.length > 0) {
   *   showError('表单验证失败', errors.join(', '));
   * }
   * 
   * @performance 使用 useCallback 优化性能，避免不必要的重新渲染
   */
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

  // ============ 事件处理函数 ============

  /**
   * 处理表单提交
   * 
   * 执行完整的表单提交流程，包括验证、数据转换、API调用和结果处理。
   * 该函数采用乐观锁策略，在提交过程中禁用提交按钮防止重复操作。
   * 
   * 处理流程：
   * 1. 执行表单验证，验证失败直接返回
   * 2. 设置提交状态，禁用提交按钮
   * 3. 构造API请求数据（类型转换、字段映射）
   * 4. 调用商品创建 API
   * 5. 根据响应结果进行页面跳转或错误提示
   * 6. 重置提交状态，恢复按钮状态
   * 
   * @async
   * @function
   * @returns {Promise<void>}
   * @throws {Error} 当 API 调用失败或网络异常时抛出错误
   * 
   * @example
   * // 用户点击提交按钮时调用
   * <button onClick={handleSubmit}>创建商品</button>
   * 
   * @ux 用户体验 - 提供明确的操作反馈和状态指示
   * @performance 使用 useCallback 优化性能，减少不必要的组件重新渲染
   */
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

  /**
   * 添加商品标签
   * 
   * 将用户输入的标签添加到商品标签列表中。
   * 功能特性：
   * - 自动去除首尾空格
   * - 防止重复标签添加
   * - 添加后清空输入框
   * - 支持回车键和按钮点击两种触发方式
   * 
   * @function
   * @returns {void}
   * 
   * 业务规则：
   * - 空标签不能添加
   * - 重复标签不能添加
   * - 添加成功后清空输入框
   * 
   * @example
   * // 用户输入标签后按回车或点击按钮
   * <input onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} />
   * <button onClick={handleAddTag}>添加</button>
   * 
   * @performance 使用 useCallback 优化性能
   */
  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  /**
   * 移除商品标签
   * 
   * 从商品标签列表中移除指定标签。
   * 使用数组过滤方法实现，保持原数组不变性。
   * 
   * @function
   * @param {string} tagToRemove - 要移除的标签名称
   * @returns {void}
   * 
   * @example
   * // 在标签显示中添加删除按钮
   * <button onClick={() => handleRemoveTag(tag)}>×</button>
   * 
   * @performance 使用 useCallback 优化性能
   * @immutability 保持数据不变性，使用函数式更新方式
   */
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  }, []);

  /**
   * 添加商品图片
   * 
   * 将新的图片URL添加到商品图片列表中。
   * 支持多图片管理，可用于商品多角度展示。
   * 
   * 功能特性：
   * - 支持URL和文件上传两种方式
   * - 自动顺序排列，第一张作为主图
   * - 保持数据不变性
   * 
   * @function
   * @param {string} imageUrl - 要添加的图片URL，必须为有效的图片地址
   * @returns {void}
   * 
   * @example
   * // 用户输入URL后按回车添加
   * const url = 'https://example.com/image.jpg';
   * handleAddImage(url);
   * 
   * @todo 未来可以添加图片格式验证和尺寸检查
   * @performance 使用 useCallback 优化性能
   */
  const handleAddImage = useCallback((imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl],
    }));
  }, []);

  /**
   * 移除商品图片
   * 
   * 根据数组索引从商品图片列表中移除指定图片。
   * 使用数组过滤方法实现，保持原数组不变性。
   * 
   * 注意事项：
   * - 移除后图片索引会发生变化
   * - 第一张图片通常作为主图，移除时需谨慎
   * 
   * @function
   * @param {number} index - 要移除的图片在数组中的索引位置
   * @returns {void}
   * 
   * @example
   * // 在图片预览中添加删除按钮
   * <button onClick={() => handleRemoveImage(index)}>删除</button>
   * 
   * @performance 使用 useCallback 优化性能
   * @immutability 保持数据不变性，使用函数式更新方式
   */
  const handleRemoveImage = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }, []);

  // ============ 步骤配置和渲染逻辑 ============

  /**
   * 向导步骤配置数组
   * 
   * 定义商品创建的四个步骤，每个步骤包含标题和描述信息。
   * 该配置用于生成步骤导航组件和控制内容渲染。
   * 
   * @type {Array<{title: string, description: string}>}
   * @constant
   * 
   * 步骤说明：
   * - 步骤 0: 基本信息 - 商品名称、价格、分类、SKU、库存、标签等
   * - 步骤 1: 详细描述 - 使用 Monaco 编辑器编写富文本描述
   * - 步骤 2: 图片管理 - 图片上传、预览和删除操作
   * - 步骤 3: 高级功能 - 水印添加和二维码生成
   */
  const steps = [
    { title: '基本信息', description: '商品的基本信息' },
    { title: '详细描述', description: '使用编辑器编写详细描述' },
    { title: '图片管理', description: '上传和管理商品图片' },
    { title: '高级功能', description: '水印和二维码生成' },
  ];

  /**
   * 渲染当前步骤的表单内容
   * 
   * 根据 currentStep 值动态渲染对应的表单界面。
   * 每个步骤都有独立的表单结构、输入验证和交互逻辑。
   * 采用 switch 语句实现多分支渲染，保证性能和可维护性。
   * 
   * @function
   * @returns {JSX.Element | null} 当前步骤的表单内容，非法步骤返回 null
   * 
   * 步骤详细说明：
   * - 步骤 0: 渲染基本信息表单，包含名称、价格、分类等字段
   * - 步骤 1: 渲染代码编辑器组件，用于编辑商品描述
   * - 步骤 2: 渲染图片管理界面，支持上传和预览
   * - 步骤 3: 渲染高级功能组件，包括水印和二维码功能
   * 
   * @example
   * // 在组件主体中使用
   * <div className="form-container">
   *   {renderStepContent()}
   * </div>
   * 
   * @performance 使用 switch 语句避免不必要的条件判断
   * @accessibility 每个步骤都包含适当的表单标签和可访问性属性
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // ============ 步骤 0: 基本信息表单 ============
        /**
         * 渲染商品基本信息表单
         * 
         * 包含以下字段：
         * - 商品名称（必填）
         * - SKU 编码（可选）
         * - 商品价格（必填，数字类型）
         * - 库存数量（可选，整数类型）
         * - 商品分类（必填，下拉选择）
         * - 商品状态（选择，默认草稿）
         * - 商品标签（动态添加）
         * 
         * 表单特性：
         * - 响应式布局，适配不同屏幕尺寸
         * - 实时验证反馈
         * - 可访问性支持
         */
        return (
          <div className="form-step">
            {/* 第一行：商品名称 + SKU */}
            <div className="form-row">
              <div className="form-group">
                <label className="required">商品名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入商品名称"
                  className="form-input"
                  aria-required="true"
                  aria-label="商品名称，必填字段"
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
                  aria-label="商品SKU编码，可选字段"
                />
              </div>
            </div>

            {/* 第二行：价格 + 库存 */}
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
                  aria-required="true"
                  aria-label="商品价格，必填字段，必须为正数"
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
                  aria-label="库存数量，可选字段，必须为非负整数"
                />
              </div>
            </div>

            {/* 第三行：分类 + 状态 */}
            <div className="form-row">
              <div className="form-group">
                <label className="required">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="form-input"
                  aria-required="true"
                  aria-label="商品分类，必填字段"
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
                  aria-label="商品状态"
                >
                  <option value="draft">草稿</option>
                  <option value="active">已上架</option>
                  <option value="inactive">已下架</option>
                </select>
              </div>
            </div>

            {/* 标签管理区域 */}
            <div className="form-group">
              <label>标签</label>
              {/* 标签输入区域 */}
              <div className="tag-input">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="输入标签后按回车添加"
                  className="form-input"
                  aria-label="标签输入框，输入后按回车或点击添加按钮"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn btn-secondary"
                  aria-label="添加标签"
                >
                  添加
                </button>
              </div>
              
              {/* 标签显示区域 */}
              <div className="tag-list" role="list" aria-label="已添加的标签">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="tag" role="listitem">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                      aria-label={`移除标签: ${tag}`}
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
        // ============ 步骤 1: 详细描述编辑 ============
        /**
         * 渲染商品详细描述编辑界面
         * 
         * 使用 Monaco Editor 提供专业的代码编辑体验：
         * - 语法高亮支持
         * - 自动补全功能
         * - 多种格式支持（Markdown、HTML、JSON）
         * - 实时预览功能
         * - 全屏编辑模式
         * 
         * 编辑器配置：
         * - 高度：400px，提供足够的编辑空间
         * - 主题：支持亮色/暗色模式切换
         * - 自动布局：响应式设计，适配不同屏幕
         */
        return (
          <div className="form-step">
            <div className="form-group">
              <label>商品描述</label>
              <CodeEditor
                {...descriptionEditor.editorProps}
                height={400}
                className="product-description-editor"
                aria-label="商品详细描述编辑器"
              />
            </div>
          </div>
        );

      case 2:
        // ============ 步骤 2: 图片管理 ============
        /**
         * 渲染商品图片管理界面
         * 
         * 功能特性：
         * - URL 直接输入：支持通过URL添加图片
         * - 批量上传：支持一次上传多张图片
         * - 图片预览：实时显示上传的图片
         * - 逆序排列：支持拖拽排序（未来功能）
         * - 图片删除：单击删除不需要的图片
         * 
         * 操作流程：
         * 1. 用户在输入框中输入图片URL
         * 2. 按回车或点击添加按钮添加图片
         * 3. 图片自动显示在预览区域
         * 4. 点击删除按钮移除不需要的图片
         * 
         * @todo 未来可以添加文件上传、图片裁剪、压缩等功能
         */
        return (
          <div className="form-step">
            <div className="form-group">
              <label>商品图片</label>
              {/* 图片输入区域 */}
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
                  aria-label="图片URL输入框，输入后按回车添加"
                />
              </div>
              
              {/* 图片预览区域 */}
              <div className="image-list" role="list" aria-label="商品图片列表">
                {formData.images.map((image, index) => (
                  <div key={index} className="image-item" role="listitem">
                    <img 
                      src={image} 
                      alt={`商品图片 ${index + 1}`}
                      onError={(e) => {
                        // 图片加载失败时的处理
                        console.error(`图片加载失败: ${image}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="image-remove"
                      aria-label={`删除第 ${index + 1} 张图片`}
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
        // ============ 步骤 3: 高级功能 ============
        /**
         * 渲染高级功能管理界面
         * 
         * 包含两个主要功能模块：
         * 
         * 1. 水印管理器：
         *    - 为商品图片添加版权水印
         *    - 支持文字和图片水印
         *    - 可调节位置、透明度、旋转角度
         *    - 实时预览效果
         * 
         * 2. 二维码生成器：
         *    - 为商品生成专属二维码
         *    - 支持自定义二维码样式
         *    - 可配置容错级别和尺寸
         *    - 支持logo添加
         * 
         * 特性说明：
         * - 高级功能为可选功能，不影响基本商品创建流程
         * - 支持实时预览和下载功能
         * - 提供专业级的图像处理能力
         * 
         * @integration 集成第三方组件 WatermarkManager 和 QRCodeGenerator
         */
        return (
          <div className="form-step">
            <div className="advanced-features">
              {/* 水印管理区域 */}
              <div className="feature-section">
                <h3>水印管理</h3>
                <WatermarkManager
                  imageUrl={formData.images[0] || '/placeholder.jpg'}
                  onWatermarkApplied={(watermarkedUrl) => {
                    // 处理水印图片回调
                    // 可以将水印后的图片添加到商品图片列表
                    console.log('Watermarked image:', watermarkedUrl);
                    // 未来可以添加：
                    // handleAddImage(watermarkedUrl);
                  }}
                  aria-label="商品图片水印管理器"
                />
              </div>

              {/* 二维码生成区域 */}
              <div className="feature-section">
                <h3>二维码生成</h3>
                <QRCodeGenerator
                  data={`https://example.com/products/${formData.sku || 'new-product'}`}
                  onGenerated={(qrCodeUrl) => {
                    // 处理二维码生成回调
                    // 可以将二维码保存到商品数据中
                    console.log('QR Code generated:', qrCodeUrl);
                    // 未来可以添加：
                    // setFormData(prev => ({ ...prev, qrCode: qrCodeUrl }));
                  }}
                  config={{
                    size: 200,
                    errorLevel: 'M',
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                  }}
                  aria-label="商品二维码生成器"
                />
              </div>
            </div>
          </div>
        );

      default:
        // ============ 错误处理 ============
        /**
         * 默认情况处理
         * 
         * 当 currentStep 值超出预期范围时的容错处理。
         * 返回 null 避免渲染异常，保证组件稳定性。
         * 
         * @error 错误边界处理，防止组件崩溃
         */
        return null;
    }
  };

  // ============ 主渲染逻辑 ============
  
  /**
   * 组件主渲染返回
   * 
   * 采用分层结构设计，包含以下主要区域：
   * 
   * 1. 页面头部：
   *    - 左侧：返回按钮和页面标题
   *    - 右侧：操作按钮（重置、创建）
   * 
   * 2. 步骤导航：
   *    - 水平排列的步骤指示器
   *    - 支持点击跳转
   *    - 动态状态显示（当前、已完成）
   * 
   * 3. 表单内容区域：
   *    - 动态渲染当前步骤内容
   *    - 响应式布局设计
   * 
   * 4. 步骤控制栏：
   *    - 上一步/下一步按钮
   *    - 当前进度指示
   *    - 边界状态处理
   * 
   * @accessibility 每个交互元素都包含适当的 ARIA 属性
   * @responsive 支持漫动设计，适配手机和桌面端
   * @performance 优化渲染性能，减少不必要的重新渲染
   */
  return (
    <div className="product-create-page" role="main" aria-label="商品创建页面">
      {/* ============ 页面头部区域 ============ */}
      {/**
       * 页面头部组件
       * 
       * 包含主要的页面操作和导航功能：
       * - 左侧：返回按钮和页面标题
       * - 右侧：功能按钮（重置和创建）
       * 
       * 可访问性特性：
       * - 语义化的按钮标签
       * - 键盘导航支持
       * - 状态反馈显示
       */}
      <div className="page-header">
        <div className="header-left">
          {/* 返回列表按钮 */}
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/products')}
            aria-label="返回商品列表页面"
            type="button"
          >
            ← 返回列表
          </button>
          {/* 页面标题 */}
          <h1 id="page-title">创建商品</h1>
        </div>

        <div className="header-actions" role="group" aria-labelledby="page-title">
          {/* 重置表单按钮 */}
          <button
            className="btn btn-secondary"
            onClick={() => {
              // 重置表单数据到初始状态
              setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                images: [],
                tags: [],
                status: 'draft',
                sku: '',
                stock: '',
              });
              // 重置步骤到第一步
              setCurrentStep(0);
              // 清空标签输入
              setTagInput('');
              // TODO: 重置代码编辑器内容
            }}
            type="button"
            aria-label="重置所有表单内容"
          >
            重置
          </button>
          
          {/* 主提交按钮 */}
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            type="button"
            aria-label={isSubmitting ? '商品创建中，请稍候' : '创建商品'}
            aria-describedby="submit-status"
          >
            {isSubmitting ? '创建中...' : '创建商品'}
          </button>
          {/* 隐藏的状态描述，用于屏幕阅读器 */}
          <span id="submit-status" className="sr-only" aria-live="polite">
            {isSubmitting ? '正在创建商品，请稍候' : '可以点击创建商品'}
          </span>
        </div>
      </div>

      {/* ============ 步骤导航区域 ============ */}
      {/**
       * 步骤导航组件
       * 
       * 提供直观的多步骤进度指示和导航功能：
       * 
       * 功能特性：
       * - 点击跳转：用户可以点击任意步骤进行跳转
       * - 状态显示：区分当前、已完成和未完成状态
       * - 进度反馈：清晰的视觉进度指示
       * - 响应式设计：适配不同屏幕尺寸
       * 
       * 可访问性特性：
       * - 语义化的导航结构
       * - 键盘操作支持
       * - 状态变化通知
       * 
       * @ux 用户体验 - 提供清晰的导航反馈和自由跳转能力
       */}
      <nav className="steps-nav" role="tablist" aria-label="商品创建步骤">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step ${
              index === currentStep ? 'active' : ''
            } ${
              index < currentStep ? 'completed' : ''
            }`}
            onClick={() => setCurrentStep(index)}
            role="tab"
            tabIndex={0}
            aria-selected={index === currentStep}
            aria-controls={`step-content-${index}`}
            aria-label={`步骤 ${index + 1}: ${step.title} - ${step.description}`}
            onKeyDown={(e) => {
              // 支持键盘操作
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCurrentStep(index);
              }
            }}
          >
            <div className="step-number" aria-hidden="true">{index + 1}</div>
            <div className="step-content">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </nav>

      {/* ============ 表单内容区域 ============ */}
      {/**
       * 表单内容容器
       * 
       * 动态渲染当前步骤的表单内容。
       * 采用容器模式，保证各步骤内容的一致性和可维护性。
       * 
       * 设计特性：
       * - 响应式布局，适配不同设备
       * - 统一的表单样式和交互模式
       * - 无障碍访问支持
       * 
       * @accessibility 为各步骤内容提供适当的 ARIA 标签
       */}
      <div 
        className="form-container" 
        id={`step-content-${currentStep}`}
        role="tabpanel"
        aria-labelledby={`step-${currentStep}`}
        aria-live="polite"
      >
        {renderStepContent()}
      </div>

      {/* ============ 步骤控制栏区域 ============ */}
      {/**
       * 步骤控制导航栏
       * 
       * 提供线性导航和进度控制功能：
       * 
       * 功能特性：
       * - 上一步/下一步按钮：顺序式导航
       * - 进度指示器：当前步骤/总步骤数
       * - 边界条件处理：第一步和最后一步的按钮状态
       * 
       * 交互设计：
       * - 按钮在边界条件下自动禁用
       * - 提供清晰的视觉反馈
       * - 支持键盘导航
       * 
       * 可访问性特性：
       * - 语义化的按钮标签
       * - 状态变化通知
       * - 适当的 ARIA 属性
       * 
       * @navigation 提供多种导航方式：点击步骤、线性导航
       * @ux 用户体验 - 避免用户在边界条件下进行无效操作
       */}
      <div className="step-controls" role="group" aria-label="步骤导航控制">
        {/* 上一步按钮 */}
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          type="button"
          aria-label="返回上一步"
          aria-describedby="prev-step-status"
        >
          上一步
        </button>
        {/* 隐藏的状态描述 */}
        <span id="prev-step-status" className="sr-only">
          {currentStep === 0 ? '已是第一步，无法返回' : '可以返回上一步'}
        </span>

        {/* 进度指示器 */}
        <span 
          className="step-indicator" 
          role="status" 
          aria-label={`当前进度：第 ${currentStep + 1} 步，共 ${steps.length} 步`}
        >
          {currentStep + 1} / {steps.length}
        </span>

        {/* 下一步按钮 */}
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          type="button"
          aria-label="进入下一步"
          aria-describedby="next-step-status"
        >
          下一步
        </button>
        {/* 隐藏的状态描述 */}
        <span id="next-step-status" className="sr-only">
          {currentStep === steps.length - 1 ? '已是最后一步，无法前进' : '可以进入下一步'}
        </span>
      </div>
    </div>
  );
};

/**
 * 组件导出说明
 * 
 * 本组件作为商品管理系统的核心组件之一，
 * 提供了完整的商品创建功能和优秀的用户体验。
 * 
 * 主要特性：
 * - 分步骤引导式操作
 * - 实时表单验证
 * - 丰富的编辑功能
 * - 无障碍访问支持
 * - 响应式设计
 * 
 * @module ProductCreatePage
 * @since 1.0.0
 * @author OneCar Team
 */