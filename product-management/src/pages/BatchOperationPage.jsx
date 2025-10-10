import React, { useState } from 'react'
import { Card, Button, Select, Checkbox, Table, Space, Popconfirm, message, Progress, Modal } from 'antd'
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { batchOperateProducts } from '@/store/slices/productSlice'

const BatchOperationPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const { items: products, selectedItems } = useSelector(state => state.products)
  const selectedProducts = products.filter(product => selectedItems.includes(product.id))
  
  const [operation, setOperation] = useState('delete')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processedItems, setProcessedItems] = useState([])
  const [showProgress, setShowProgress] = useState(false)
  
  // 批量操作选项
  const operationOptions = [
    { label: '批量删除', value: 'delete', icon: <DeleteOutlined />, color: '#ff4d4f' },
    { label: '批量上架', value: 'activate', icon: <CheckCircleOutlined />, color: '#52c41a' },
    { label: '批量下架', value: 'deactivate', icon: <CloseCircleOutlined />, color: '#faad14' },
    { label: '批量修改分类', value: 'updateCategory', icon: <EditOutlined />, color: '#1890ff' },
    { label: '批量导出', value: 'export', icon: <ExportOutlined />, color: '#722ed1' },
    { label: '批量导入', value: 'import', icon: <UploadOutlined />, color: '#13c2c2' },
  ]
  
  const currentOperation = operationOptions.find(op => op.value === operation)
  
  // 表格列定义
  const columns = [
    {
      title: '商品图片',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images) => (
        <img
          src={images?.[0] || 'https://via.placeholder.com/60'}
          alt="商品图片"
          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => `¥${price.toFixed(2)}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (stock) => (
        <span style={{ color: stock > 10 ? '#52c41a' : stock > 0 ? '#faad14' : '#ff4d4f' }}>
          {stock}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const statusMap = {
          active: { text: '上架', color: '#52c41a' },
          inactive: { text: '下架', color: '#ff4d4f' },
          draft: { text: '草稿', color: '#faad14' },
          discontinued: { text: '停产', color: '#8c8c8c' },
        }
        const statusInfo = statusMap[status] || { text: status, color: '#8c8c8c' }
        return <span style={{ color: statusInfo.color }}>{statusInfo.text}</span>
      },
    },
    {
      title: '处理状态',
      key: 'processStatus',
      width: 100,
      render: (_, record) => {
        const processed = processedItems.find(item => item.id === record.id)
        if (!processed) return '-'
        
        return processed.success ? (
          <span style={{ color: '#52c41a' }}>
            <CheckCircleOutlined /> 成功
          </span>
        ) : (
          <span style={{ color: '#ff4d4f' }}>
            <CloseCircleOutlined /> 失败
          </span>
        )
      },
    },
  ]
  
  // 执行批量操作
  const handleExecute = async () => {
    if (selectedProducts.length === 0) {
      message.warning('没有选中的商品')
      return
    }
    
    setIsProcessing(true)
    setShowProgress(true)
    setProgress(0)
    setProcessedItems([])
    
    try {
      // 模拟批量处理过程
      const total = selectedProducts.length
      const results = []
      
      for (let i = 0; i < total; i++) {
        const product = selectedProducts[i]
        
        // 模拟处理延迟
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // 模拟处理结果（90%成功率）
        const success = Math.random() > 0.1
        const result = {
          id: product.id,
          name: product.name,
          success,
          error: success ? null : '处理失败',
        }
        
        results.push(result)
        setProcessedItems(prev => [...prev, result])
        setProgress(((i + 1) / total) * 100)
      }
      
      // 调用实际的批量操作API
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      if (successCount > 0) {
        await dispatch(batchOperateProducts({
          operation,
          productIds: results.filter(r => r.success).map(r => r.id)
        })).unwrap()
      }
      
      message.success(`批量操作完成：成功 ${successCount} 项，失败 ${failCount} 项`)
      
      if (successCount === total) {
        // 全部成功，返回列表页
        setTimeout(() => {
          navigate('/products')
        }, 2000)
      }
    } catch (error) {
      message.error('批量操作失败')
    } finally {
      setIsProcessing(false)
    }
  }
  
  // 返回列表
  const handleBack = () => {
    navigate('/products')
  }
  
  // 获取操作描述
  const getOperationDescription = () => {
    const count = selectedProducts.length
    switch (operation) {
      case 'delete':
        return `将删除 ${count} 个商品，此操作不可恢复`
      case 'activate':
        return `将上架 ${count} 个商品，商品将在前台显示`
      case 'deactivate':
        return `将下架 ${count} 个商品，商品将在前台隐藏`
      case 'updateCategory':
        return `将修改 ${count} 个商品的分类`
      case 'export':
        return `将导出 ${count} 个商品的数据到Excel文件`
      case 'import':
        return `批量导入商品数据`
      default:
        return `将对 ${count} 个商品执行操作`
    }
  }
  
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              type="text"
            />
            批量操作管理
          </Space>
        }
        extra={
          <Space>
            <Select
              value={operation}
              onChange={setOperation}
              style={{ width: 150 }}
              options={operationOptions.map(op => ({
                ...op,
                label: (
                  <span style={{ color: op.color }}>
                    {op.icon} {op.label}
                  </span>
                ),
              }))}
            />
            
            <Popconfirm
              title="确认执行批量操作"
              description={getOperationDescription()}
              onConfirm={handleExecute}
              okText="确认"
              cancelText="取消"
              disabled={selectedProducts.length === 0 || isProcessing}
            >
              <Button
                type="primary"
                icon={currentOperation?.icon}
                loading={isProcessing}
                disabled={selectedProducts.length === 0}
                style={{ backgroundColor: currentOperation?.color, borderColor: currentOperation?.color }}
              >
                执行操作 ({selectedProducts.length})
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        {/* 操作说明 */}
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: '6px',
          marginBottom: '16px' 
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            {currentOperation?.icon} {currentOperation?.label}
          </div>
          <div style={{ color: '#666' }}>
            {getOperationDescription()}
          </div>
        </div>
        
        {/* 进度显示 */}
        {showProgress && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              处理进度: {processedItems.length} / {selectedProducts.length}
            </div>
            <Progress 
              percent={Math.round(progress)} 
              status={isProcessing ? 'active' : 'success'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        )}
        
        {/* 商品列表 */}
        <Table
          dataSource={selectedProducts}
          columns={columns}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 项`,
          }}
          scroll={{ x: 800 }}
          size="middle"
        />
        
        {/* 操作结果汇总 */}
        {processedItems.length > 0 && (
          <div style={{ 
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#f0f0f0',
            borderRadius: '6px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              操作结果汇总
            </div>
            <Space>
              <span style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> 成功: {processedItems.filter(item => item.success).length}
              </span>
              <span style={{ color: '#ff4d4f' }}>
                <CloseCircleOutlined /> 失败: {processedItems.filter(item => !item.success).length}
              </span>
            </Space>
          </div>
        )}
      </Card>
    </div>
  )
}

export default BatchOperationPage