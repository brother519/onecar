import React, { useState, useEffect, useCallback } from 'react';
import { useProductStore, useNotifications } from '@/store';
import { productApi } from '@/services/api';
import { DragDropManager, useDragDropManager } from '@/components/DragDropManager';
import { VirtualScrollContainer, useVirtualScroll } from '@/components/VirtualScrollContainer';
import { InfiniteScrollLoader, useInfiniteScroll } from '@/components/InfiniteScrollLoader';
import { Product } from '@/types';

export const ProductListPage: React.FC = () => {
  const {
    products,
    selectedProducts,
    loading,
    setProducts,
    setSelectedProducts,
    toggleProductSelection,
    clearSelection,
    startLoading,
    stopLoading,
    setError,
  } = useProductStore();

  const { showSuccess, showError } = useNotifications();
  
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
  });

  // 无限滚动
  const {
    items: infiniteItems,
    loadingState: infiniteLoading,
    loadNextPage,
    refresh,
  } = useInfiniteScroll((page) => 
    productApi.getProducts({ 
      page, 
      size: 20,
      ...filters,
    })
  );

  // 拖拽排序
  const {
    items: dragItems,
    handleReorder,
  } = useDragDropManager(products);

  // 虚拟滚动
  const {
    scrollRef,
    visibleRange,
    scrollToTop,
  } = useVirtualScroll(products);

  // 加载产品列表
  const loadProducts = useCallback(async () => {
    startLoading();
    try {
      const response = await productApi.getProducts({
        page: 1,
        size: 50,
        ...filters,
      });
      
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      setError('加载产品列表失败');
      showError('错误', '加载产品列表失败');
    } finally {
      stopLoading();
    }
  }, [filters, startLoading, stopLoading, setError, setProducts, showError]);

  // 删除产品
  const handleDeleteProduct = useCallback(async (id: string) => {
    try {
      const response = await productApi.deleteProduct(id);
      if (response.success) {
        showSuccess('成功', '产品删除成功');
        loadProducts();
      }
    } catch (error) {
      showError('错误', '删除产品失败');
    }
  }, [showSuccess, showError, loadProducts]);

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (selectedProducts.length === 0) return;

    try {
      const response = await productApi.batchOperation({
        action: 'delete',
        productIds: selectedProducts,
      });
      
      if (response.success) {
        showSuccess('成功', `已删除 ${selectedProducts.length} 个产品`);
        clearSelection();
        loadProducts();
      }
    } catch (error) {
      showError('错误', '批量删除失败');
    }
  }, [selectedProducts, showSuccess, showError, clearSelection, loadProducts]);

  // 处理拖拽排序
  const handleDragReorder = useCallback(async (newOrder: Product[]) => {
    try {
      const sortOrder = newOrder.map(item => item.id);
      const response = await productApi.updateProductSort(sortOrder);
      
      if (response.success) {
        handleReorder(newOrder);
        showSuccess('成功', '产品排序已更新');
      }
    } catch (error) {
      showError('错误', '更新排序失败');
    }
  }, [handleReorder, showSuccess, showError]);

  // 渲染产品项
  const renderProductItem = useCallback((product: Product, index: number) => (
    <div className="product-item" key={product.id}>
      <div className="product-content">
        <div className="product-image">
          <img 
            src={product.images[0] || '/placeholder.jpg'} 
            alt={product.name}
            loading="lazy"
          />
        </div>
        
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-description">{product.description}</p>
          <div className="product-meta">
            <span className="product-price">¥{product.price}</span>
            <span className="product-category">{product.category}</span>
            <span className={`product-status status-${product.status}`}>
              {product.status}
            </span>
          </div>
        </div>
        
        <div className="product-actions">
          <button
            className="btn btn-secondary"
            onClick={() => window.open(`/products/${product.id}/edit`, '_blank')}
          >
            编辑
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleDeleteProduct(product.id)}
          >
            删除
          </button>
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={selectedProducts.includes(product.id)}
              onChange={() => toggleProductSelection(product.id)}
            />
            <span className="checkmark"></span>
          </label>
        </div>
      </div>
    </div>
  ), [selectedProducts, toggleProductSelection, handleDeleteProduct]);

  // 初始化加载
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="product-list-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <h1>商品管理</h1>
          <div className="page-stats">
            共 {products.length} 个商品
            {selectedProducts.length > 0 && (
              <span className="selected-count">
                已选择 {selectedProducts.length} 个
              </span>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => window.open('/products/create', '_blank')}
          >
            新建商品
          </button>
          
          {selectedProducts.length > 0 && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => window.open('/products/batch', '_blank')}
              >
                批量操作
              </button>
              <button
                className="btn btn-danger"
                onClick={handleBatchDelete}
              >
                批量删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* 筛选条件 */}
      <div className="filters">
        <div className="filter-group">
          <label>分类</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">全部分类</option>
            <option value="电子产品">电子产品</option>
            <option value="服装配饰">服装配饰</option>
            <option value="家居用品">家居用品</option>
            <option value="体育用品">体育用品</option>
            <option value="图书音像">图书音像</option>
          </select>
        </div>

        <div className="filter-group">
          <label>状态</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">全部状态</option>
            <option value="active">已上架</option>
            <option value="inactive">已下架</option>
            <option value="draft">草稿</option>
          </select>
        </div>

        <div className="filter-group">
          <label>搜索</label>
          <input
            type="text"
            placeholder="搜索商品名称、描述或SKU"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <button className="btn btn-primary" onClick={loadProducts}>
          搜索
        </button>
      </div>

      {/* 工具栏 */}
      <div className="toolbar">
        <div className="view-controls">
          <button
            className="btn btn-secondary"
            onClick={scrollToTop}
            title="返回顶部"
          >
            ⬆️ 顶部
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => clearSelection()}
            disabled={selectedProducts.length === 0}
          >
            清除选择
          </button>
        </div>

        <div className="display-info">
          显示范围: {visibleRange.start + 1} - {visibleRange.end + 1}
        </div>
      </div>

      {/* 产品列表 */}
      <div className="product-list-container">
        {loading.isLoading && products.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>加载中...</span>
          </div>
        ) : loading.error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{loading.error}</div>
            <button className="btn btn-primary" onClick={loadProducts}>
              重试
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-message">暂无商品</div>
            <div className="empty-description">
              点击"新建商品"按钮创建第一个商品
            </div>
          </div>
        ) : (
          <DragDropManager
            items={products}
            onReorder={handleDragReorder}
            renderItem={renderProductItem}
            className="product-drag-list"
          />
        )}
      </div>

      {/* 分页信息 */}
      {products.length > 0 && (
        <div className="pagination-info">
          <span>当前显示 {products.length} 个商品</span>
          {loading.hasMore && (
            <button
              className="btn btn-secondary"
              onClick={loadNextPage}
              disabled={loading.isLoading}
            >
              {loading.isLoading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};