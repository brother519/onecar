import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Table, Button, Input, Select, Space, Tag, Dropdown, message, Popconfirm, Checkbox } from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  QrcodeOutlined,
  CodeOutlined,
  MoreOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { useDrag, useDrop } from 'react-dnd'
import { FixedSizeList as List } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import {
  fetchProducts,
  setFilter,
  setSelectedItems,
  toggleSelectedItem,
  toggleSelectAll,
  reorderItemsLocally,
  setPage,
} from '@/store/slices/productSlice'
import { showModal } from '@/store/slices/uiSlice'

// 拖拽项目类型
const DND_ITEM_TYPE = 'PRODUCT_ROW'

// 可拖拽的表格行组件
const DraggableRow = ({ index, style, data, ...props }) => {
  const { products, onReorder, selectedItems, onToggleSelect } = data
  const product = products[index]
  const dispatch = useDispatch()
  
  const [{ isDragging }, drag] = useDrag({
    type: DND_ITEM_TYPE,
    item: { index, product },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })
  
  const [{ isOver }, drop] = useDrop({
    accept: DND_ITEM_TYPE,
    drop: (draggedItem) => {
      if (draggedItem.index !== index) {
        onReorder(draggedItem.index, index)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })
  
  const ref = useRef(null)
  drag(drop(ref))
  
  if (!product) {
    return (
      <div style={style} className="loading-container">
        <div>加载中...</div>
      </div>
    )
  }
  
  // 处理商品操作菜单
  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'edit':
        dispatch(showModal({ type: 'productEdit', data: product }))
        break
      case 'view':
        // 查看详情
        break
      case 'code':
        dispatch(showModal({ type: 'codeEditor', data: product }))
        break
      case 'qrcode':
        dispatch(showModal({ type: 'qrCode', data: product }))
        break
      case 'delete':
        // 删除确认
        break
      default:
        break
    }
  }
  
  const menuItems = [
    { key: 'view', icon: <EyeOutlined />, label: '查看详情' },
    { key: 'edit', icon: <EditOutlined />, label: '编辑商品' },
    { key: 'code', icon: <CodeOutlined />, label: '代码配置' },
    { key: 'qrcode', icon: <QrcodeOutlined />, label: '生成二维码' },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: '删除商品', danger: true },
  ]
  
  const statusColor = {
    active: 'green',
    inactive: 'red',
    draft: 'orange',
    discontinued: 'default',
  }
  
  const statusText = {
    active: '上架',
    inactive: '下架',
    draft: '草稿',
    discontinued: '停产',
  }
  
  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isOver ? '#f0f8ff' : selectedItems.includes(product.id) ? '#e6f7ff' : '#fff',
        border: isOver ? '2px dashed #1890ff' : '1px solid #f0f0f0',
        borderRadius: '4px',
        margin: '2px 0',
        padding: '12px 16px',
        cursor: 'move',
        transition: 'all 0.2s ease',
      }}
      className={isDragging ? 'dragging' : ''}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Checkbox
          checked={selectedItems.includes(product.id)}
          onChange={() => onToggleSelect(product.id)}
          onClick={(e) => e.stopPropagation()}
        />
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60 }}>
            <img
              src={product.images?.[0] || 'https://via.placeholder.com/60'}
              alt={product.name}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                borderRadius: '4px',
                border: '1px solid #f0f0f0',
              }}
            />
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {product.name}
            </div>
            <div style={{ 
              color: '#666', 
              fontSize: '12px', 
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {product.description}
            </div>
          </div>
          
          <div style={{ width: 80, textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
              ¥{product.price.toFixed(2)}
            </div>
          </div>
          
          <div style={{ width: 80, textAlign: 'center' }}>
            <Tag color={product.stock > 10 ? 'green' : product.stock > 0 ? 'orange' : 'red'}>
              {product.stock}
            </Tag>
          </div>
          
          <div style={{ width: 80, textAlign: 'center' }}>
            <Tag color={statusColor[product.status]}>
              {statusText[product.status]}
            </Tag>
          </div>
          
          <div style={{ width: 100, textAlign: 'center' }}>
            <span style={{ color: '#666', fontSize: '12px' }}>
              {product.category}
            </span>
          </div>
          
          <div style={{ width: 120 }}>
            <Space>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  dispatch(showModal({ type: 'productEdit', data: product }))
                }}
              />
              
              <Dropdown
                menu={{ items: menuItems, onClick: handleMenuClick }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </Space>
          </div>
        </div>
      </div>
    </div>
  )
}

// 虚拟列表组件
const VirtualizedProductList = ({ 
  products, 
  hasNextPage, 
  isNextPageLoading, 
  loadNextPage,
  onReorder,
  selectedItems,
  onToggleSelect,
}) => {
  const listRef = useRef(null)
  
  // 检查项目是否已加载
  const isItemLoaded = useCallback((index) => {
    return !!products[index]
  }, [products])
  
  // 项目总数（包括加载中的项目）
  const itemCount = hasNextPage ? products.length + 1 : products.length
  
  // 渲染项目数据
  const itemData = useMemo(() => ({
    products,
    onReorder,
    selectedItems,
    onToggleSelect,
  }), [products, onReorder, selectedItems, onToggleSelect])
  
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadNextPage}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={(list) => {
              listRef.current = list
              ref(list)
            }}
            height={600}
            itemCount={itemCount}
            itemSize={88} // 每行高度
            itemData={itemData}
            onItemsRendered={onItemsRendered}
            overscanCount={5}
          >
            {DraggableRow}
          </List>
        )}
      </InfiniteLoader>
    </div>
  )
}

// 主商品列表组件
const ProductList = () => {
  const dispatch = useDispatch()
  const { 
    items: products, 
    loading, 
    total, 
    currentPage, 
    pageSize, 
    filter,
    selectedItems,
  } = useSelector(state => state.products)
  
  const [searchText, setSearchText] = useState('')
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isNextPageLoading, setIsNextPageLoading] = useState(false)
  
  // 加载商品数据
  const loadProducts = useCallback((page = 1, reset = false) => {
    dispatch(fetchProducts({ 
      page, 
      size: pageSize, 
      filter: { ...filter, keyword: searchText } 
    }))
  }, [dispatch, pageSize, filter, searchText])
  
  // 加载下一页
  const loadNextPage = useCallback(async (startIndex, stopIndex) => {
    if (isNextPageLoading) return
    
    setIsNextPageLoading(true)
    try {
      const nextPage = Math.ceil((stopIndex + 1) / pageSize)
      await dispatch(fetchProducts({
        page: nextPage,
        size: pageSize,
        filter: { ...filter, keyword: searchText }
      })).unwrap()
      
      // 检查是否还有更多数据
      if (products.length >= total) {
        setHasNextPage(false)
      }
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setIsNextPageLoading(false)
    }
  }, [dispatch, pageSize, filter, searchText, products.length, total, isNextPageLoading])
  
  // 处理搜索
  const handleSearch = useCallback(() => {
    dispatch(setFilter({ keyword: searchText }))
    loadProducts(1, true)
  }, [dispatch, searchText, loadProducts])
  
  // 处理拖拽排序
  const handleReorder = useCallback((sourceIndex, targetIndex) => {
    dispatch(reorderItemsLocally({ sourceIndex, targetIndex }))
    message.success('排序已更新')
  }, [dispatch])
  
  // 处理选择
  const handleToggleSelect = useCallback((productId) => {
    dispatch(toggleSelectedItem(productId))
  }, [dispatch])
  
  // 处理全选
  const handleToggleSelectAll = useCallback(() => {
    dispatch(toggleSelectAll())
  }, [dispatch])
  
  // 批量操作
  const handleBatchOperation = useCallback((operation) => {
    if (selectedItems.length === 0) {
      message.warning('请先选择商品')
      return
    }
    
    dispatch(showModal({ 
      type: 'batchOperation', 
      data: { operation, productIds: selectedItems } 
    }))
  }, [dispatch, selectedItems])
  
  // 初始加载
  useEffect(() => {
    loadProducts()
  }, [loadProducts])
  
  // 更新hasNextPage状态
  useEffect(() => {
    setHasNextPage(products.length < total)
  }, [products.length, total])
  
  return (
    <div className="product-list-container">
      {/* 头部工具栏 */}
      <div className="product-list-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Input.Search
              placeholder="搜索商品名称、描述或分类"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 300 }}
              enterButton={<SearchOutlined />}
            />
            
            <Select
              placeholder="选择分类"
              style={{ width: 120 }}
              allowClear
              onChange={(value) => dispatch(setFilter({ category: value }))}
              options={[
                { label: '电子产品', value: '电子产品' },
                { label: '服装', value: '服装' },
                { label: '家居用品', value: '家居用品' },
                { label: '食品', value: '食品' },
                { label: '图书', value: '图书' },
                { label: '运动器材', value: '运动器材' },
              ]}
            />
            
            <Select
              placeholder="选择状态"
              style={{ width: 100 }}
              allowClear
              onChange={(value) => dispatch(setFilter({ status: value }))}
              options={[
                { label: '上架', value: 'active' },
                { label: '下架', value: 'inactive' },
                { label: '草稿', value: 'draft' },
                { label: '停产', value: 'discontinued' },
              ]}
            />
            
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                dispatch(setFilter({}))
                setSearchText('')
                loadProducts(1, true)
              }}
            >
              清空筛选
            </Button>
          </Space>
          
          <Space>
            <span style={{ color: '#666', fontSize: '14px' }}>
              已选择 {selectedItems.length} 项，共 {total} 项
            </span>
            
            {selectedItems.length > 0 && (
              <>
                <Button
                  size="small"
                  onClick={() => handleBatchOperation('delete')}
                  danger
                >
                  批量删除
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBatchOperation('activate')}
                >
                  批量上架
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBatchOperation('export')}
                  icon={<ExportOutlined />}
                >
                  批量导出
                </Button>
              </>
            )}
            
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => dispatch(showModal({ type: 'productEdit', data: null }))}
            >
              新增商品
            </Button>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadProducts(1, true)}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>
        
        {/* 列表头部 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
          marginTop: '16px',
          borderRadius: '4px 4px 0 0',
        }}>
          <Checkbox
            checked={selectedItems.length === products.length && products.length > 0}
            indeterminate={selectedItems.length > 0 && selectedItems.length < products.length}
            onChange={handleToggleSelectAll}
          />
          
          <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <div style={{ width: 60, textAlign: 'center', fontWeight: 'bold' }}>
              图片
            </div>
            <div style={{ flex: 1, fontWeight: 'bold' }}>
              商品信息
            </div>
            <div style={{ width: 80, textAlign: 'center', fontWeight: 'bold' }}>
              价格
            </div>
            <div style={{ width: 80, textAlign: 'center', fontWeight: 'bold' }}>
              库存
            </div>
            <div style={{ width: 80, textAlign: 'center', fontWeight: 'bold' }}>
              状态
            </div>
            <div style={{ width: 100, textAlign: 'center', fontWeight: 'bold' }}>
              分类
            </div>
            <div style={{ width: 120, textAlign: 'center', fontWeight: 'bold' }}>
              操作
            </div>
          </div>
        </div>
      </div>
      
      {/* 虚拟化商品列表 */}
      <div className="product-list-content">
        <VirtualizedProductList
          products={products}
          hasNextPage={hasNextPage}
          isNextPageLoading={isNextPageLoading}
          loadNextPage={loadNextPage}
          onReorder={handleReorder}
          selectedItems={selectedItems}
          onToggleSelect={handleToggleSelect}
        />
      </div>
    </div>
  )
}

export default ProductList