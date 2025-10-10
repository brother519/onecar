import React from 'react'
import { Card } from 'antd'
import ProductList from '@/components/ProductList/ProductList'

const ProductListPage = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title="商品管理" 
        style={{ height: 'calc(100vh - 112px)' }}
        bodyStyle={{ height: 'calc(100% - 57px)', padding: 0 }}
      >
        <ProductList />
      </Card>
    </div>
  )
}

export default ProductListPage