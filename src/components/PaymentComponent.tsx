import React, { useState } from 'react';
import { Radio, Card, Form, Input, Button, Typography, Divider, notification, Spin } from 'antd';
import {
  CreditCardOutlined,
  BankOutlined,
  WechatOutlined,
  AlipayOutlined,
  LockOutlined
} from '@ant-design/icons';

import '../styles/PaymentComponent.css';

const { Title, Text } = Typography;

interface PaymentComponentProps {
  amount: number;
  onSuccess: () => void;
  onBack: () => void;
}

type PaymentMethod = 'credit_card' | 'debit_card' | 'wechat' | 'alipay';

const PaymentComponent: React.FC<PaymentComponentProps> = ({ 
  amount, 
  onSuccess,
  onBack
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [form] = Form.useForm();

  // 选择支付方式
  const handlePaymentMethodChange = (e: any) => {
    setPaymentMethod(e.target.value);
    form.resetFields();
  };

  // 处理支付
  const handlePayment = (values: any) => {
    setIsProcessing(true);
    
    // 模拟支付处理
    setTimeout(() => {
      setIsProcessing(false);
      notification.success({
        message: '支付成功',
        description: `您已成功支付 ¥${amount.toFixed(2)}`,
      });
      onSuccess();
    }, 2000);
  };

  // 渲染信用卡表单
  const renderCreditCardForm = () => (
    <Form layout="vertical">
      <Form.Item
        label="卡号"
        name="cardNumber"
        rules={[{ required: true, message: '请输入卡号' }]}
      >
        <Input placeholder="1234 5678 9012 3456" />
      </Form.Item>
      <Form.Item
        label="持卡人姓名"
        name="cardHolder"
        rules={[{ required: true, message: '请输入持卡人姓名' }]}
      >
        <Input placeholder="持卡人姓名" />
      </Form.Item>
      <div className="card-expiry-cvv">
        <Form.Item
          label="有效期"
          name="expiry"
          rules={[{ required: true, message: '请输入有效期' }]}
        >
          <Input placeholder="MM/YY" />
        </Form.Item>
        <Form.Item
          label="CVV"
          name="cvv"
          rules={[{ required: true, message: '请输入CVV' }]}
        >
          <Input placeholder="CVV" />
        </Form.Item>
      </div>
    </Form>
  );

  // 渲染借记卡表单
  const renderDebitCardForm = () => (
    <Form layout="vertical">
      <Form.Item
        label="卡号"
        name="cardNumber"
        rules={[{ required: true, message: '请输入卡号' }]}
      >
        <Input placeholder="1234 5678 9012 3456" />
      </Form.Item>
      <Form.Item
        label="持卡人姓名"
        name="cardHolder"
        rules={[{ required: true, message: '请输入持卡人姓名' }]}
      >
        <Input placeholder="持卡人姓名" />
      </Form.Item>
      <Form.Item
        label="银行"
        name="bank"
        rules={[{ required: true, message: '请输入银行名称' }]}
      >
        <Input placeholder="银行名称" />
      </Form.Item>
    </Form>
  );

  // 渲染微信支付
  const renderWeChatPay = () => (
    <div className="qr-payment">
      <div className="qr-code-placeholder">
        <WechatOutlined style={{ fontSize: 48, color: '#2aae67' }} />
        <Text type="secondary">请使用微信扫描二维码</Text>
      </div>
    </div>
  );

  // 渲染支付宝
  const renderAlipay = () => (
    <div className="qr-payment">
      <div className="qr-code-placeholder">
        <AlipayOutlined style={{ fontSize: 48, color: '#1677ff' }} />
        <Text type="secondary">请使用支付宝扫描二维码</Text>
      </div>
    </div>
  );

  // 根据所选支付方式渲染对应表单
  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return renderCreditCardForm();
      case 'debit_card':
        return renderDebitCardForm();
      case 'wechat':
        return renderWeChatPay();
      case 'alipay':
        return renderAlipay();
      default:
        return null;
    }
  };

  return (
    <div className="payment-component">
      <Card className="payment-summary">
        <Title level={5}>订单金额</Title>
        <Text className="payment-amount">¥{amount.toFixed(2)}</Text>
      </Card>
      
      <Title level={5} className="payment-method-title">选择支付方式</Title>
      
      <Radio.Group
        onChange={handlePaymentMethodChange}
        value={paymentMethod}
        className="payment-method-group"
      >
        <Radio.Button value="credit_card">
          <CreditCardOutlined /> 信用卡
        </Radio.Button>
        <Radio.Button value="debit_card">
          <BankOutlined /> 借记卡
        </Radio.Button>
        <Radio.Button value="wechat">
          <WechatOutlined /> 微信支付
        </Radio.Button>
        <Radio.Button value="alipay">
          <AlipayOutlined /> 支付宝
        </Radio.Button>
      </Radio.Group>
      
      <Card className="payment-form-card">
        <Form
          form={form}
          onFinish={handlePayment}
        >
          {renderPaymentForm()}
          
          <Divider />
          
          <div className="payment-security">
            <LockOutlined />
            <Text type="secondary">付款信息已加密并安全传输</Text>
          </div>
          
          <div className="payment-actions">
            <Button onClick={onBack}>返回</Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={isProcessing}
              disabled={isProcessing}
            >
              {isProcessing ? '处理中...' : `支付 ¥${amount.toFixed(2)}`}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PaymentComponent;