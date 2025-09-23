import React, { useState } from 'react';
import { Card, Button, List, InputNumber, Typography, Badge, Modal, Row, Col, Divider } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useCart, CartItem } from '../contexts/CartContext';
import AddressSelector from './AddressSelector';
import PaymentComponent from './PaymentComponent';

import '../styles/ShoppingCart.css';

const { Title, Text } = Typography;

const ShoppingCart: React.FC = () => {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [isCartVisible, setIsCartVisible] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<number>(0);

  // 打开购物车弹窗
  const showCart = () => {
    setIsCartVisible(true);
  };

  // 关闭购物车弹窗
  const closeCart = () => {
    setIsCartVisible(false);
    setCheckoutStep(0); // 重置结账步骤
  };

  // 进入结账流程
  const proceedToCheckout = () => {
    setCheckoutStep(1);
  };

  // 处理数量变化
  const handleQuantityChange = (itemId: string, value: number | null) => {
    updateQuantity(itemId, value || 1);
  };

  // 渲染购物车内容
  const renderCartContent = () => {
    if (items.length === 0) {
      return (
        <div className="empty-cart">
          <ShoppingOutlined style={{ fontSize: 48 }} />
          <Text>购物车为空</Text>
          <Button type="primary" onClick={closeCart}>继续购物</Button>
        </div>
      );
    }

    return (
      <List
        itemLayout="horizontal"
        dataSource={items}
        renderItem={item => (
          <List.Item
            actions={[
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => removeItem(item.id)} 
              />
            ]}
          >
            <List.Item.Meta
              avatar={<img src={item.image} alt={item.name} className="cart-item-image" />}
              title={item.name}
              description={
                <Row>
                  <Col span={12}>
                    <Text type="secondary">¥{item.price.toFixed(2)}</Text>
                  </Col>
                  <Col span={12}>
                    <InputNumber 
                      min={1} 
                      max={99}
                      value={item.quantity} 
                      onChange={(value) => handleQuantityChange(item.id, value)} 
                    />
                  </Col>
                </Row>
              }
            />
            <div>
              <Text>¥{(item.price * item.quantity).toFixed(2)}</Text>
            </div>
          </List.Item>
        )}
      />
    );
  };

  // 渲染结账步骤
  const renderCheckoutSteps = () => {
    switch (checkoutStep) {
      case 0: // 购物车
        return (
          <>
            <div className="cart-content">{renderCartContent()}</div>
            {items.length > 0 && (
              <div className="cart-footer">
                <div className="cart-actions">
                  <Button onClick={clearCart}>清空购物车</Button>
                  <Button onClick={closeCart}>继续购物</Button>
                </div>
                <Divider />
                <div className="cart-summary">
                  <div>
                    <Text>商品总数: </Text>
                    <Text strong>{totalItems}</Text>
                  </div>
                  <div>
                    <Text>总金额: </Text>
                    <Text strong type="danger">¥{totalPrice.toFixed(2)}</Text>
                  </div>
                  <Button type="primary" onClick={proceedToCheckout}>去结算</Button>
                </div>
              </div>
            )}
          </>
        );
      case 1: // 选择地址
        return (
          <>
            <Title level={4}>选择收货地址</Title>
            <AddressSelector onNext={() => setCheckoutStep(2)} onBack={() => setCheckoutStep(0)} />
          </>
        );
      case 2: // 支付
        return (
          <>
            <Title level={4}>支付</Title>
            <PaymentComponent 
              amount={totalPrice} 
              onSuccess={() => {
                // 支付成功后，清空购物车并关闭弹窗
                clearCart();
                closeCart();
                // 这里可以添加支付成功的提示
              }}
              onBack={() => setCheckoutStep(1)}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Badge count={totalItems}>
        <Button
          type="primary"
          shape="circle"
          icon={<ShoppingCartOutlined />}
          size="large"
          onClick={showCart}
          className="cart-button"
        />
      </Badge>

      <Modal
        title={checkoutStep === 0 ? "购物车" : checkoutStep === 1 ? "选择收货地址" : "支付"}
        open={isCartVisible}
        onCancel={closeCart}
        footer={null}
        width={700}
      >
        {renderCheckoutSteps()}
      </Modal>
    </>
  );
};

export default ShoppingCart;