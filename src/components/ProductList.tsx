import React from 'react';
import { Row, Col, Card, Typography, Rate, Button, notification } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Product } from '../pages/HomePage';
import { useCart } from '../contexts/CartContext';
import ShoppingCart from './ShoppingCart';
import CommentList from './CommentList';

import '../styles/ProductList.css';

const { Meta } = Card;
const { Title, Text } = Typography;

interface ProductListProps {
  products: Product[];
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  const { addItem } = useCart();

  // 添加商品到购物车
  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1
    });
    notification.success({
      message: '添加成功',
      description: `已将 ${product.name} 添加到购物车`,
      placement: 'bottomRight',
    });
  };

  // 查看产品详情
  const handleViewProduct = (product: Product) => {
    // 实际项目中，这里可能会跳转到产品详情页
    // 在此示例中，我们使用模态框来展示产品详情
    Modal.info({
      title: product.name,
      content: (
        <div className="product-detail">
          <img src={product.image} alt={product.name} className="product-detail-image" />
          <div className="product-info">
            <Title level={4}>{product.name}</Title>
            <Text type="danger" strong>¥{product.price.toFixed(2)}</Text>
            <Rate allowHalf disabled defaultValue={product.rating} />
            <Text>{product.description}</Text>
          </div>
          <Divider />
          <CommentList productId={product.id} />
        </div>
      ),
      width: 800,
      okText: '关闭',
    });
  };

  return (
    <div className="product-list">
      <Title level={2}>推荐商品</Title>
      <Row gutter={[16, 16]}>
        {products.map(product => (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} key={product.id}>
            <Card
              hoverable
              cover={<img alt={product.name} src={product.image} />}
              actions={[
                <Button 
                  type="link" 
                  onClick={() => handleViewProduct(product)}
                >
                  查看详情
                </Button>,
                <Button 
                  type="primary" 
                  icon={<ShoppingCartOutlined />}
                  onClick={() => handleAddToCart(product)}
                >
                  加入购物车
                </Button>
              ]}
              className="product-card"
            >
              <Meta
                title={product.name}
                description={
                  <div>
                    <Text type="danger" strong>¥{product.price.toFixed(2)}</Text>
                    <br />
                    <Rate allowHalf disabled defaultValue={product.rating} />
                    <br />
                    <Text ellipsis={{ tooltip: product.description }}>
                      {product.description}
                    </Text>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* 购物车悬浮按钮 */}
      <ShoppingCart />
    </div>
  );
};

// 导入在组件定义之后添加，以解决循环依赖问题
import { Modal, Divider } from 'antd';

export default ProductList;