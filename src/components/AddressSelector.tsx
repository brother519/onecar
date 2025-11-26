import React, { useState } from 'react';
import { List, Button, Card, Typography, Modal, Form, Input, Checkbox, Radio, Empty, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useUser, Address } from '../contexts/UserContext';

import '../styles/AddressSelector.css';

const { Text, Title } = Typography;

interface AddressSelectorProps {
  onNext: () => void;
  onBack: () => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ onNext, onBack }) => {
  const { user, addAddress, updateAddress, removeAddress, setDefaultAddress } = useUser();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(
    user?.addresses.find(addr => addr.isDefault)?.id || null
  );
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form] = Form.useForm();

  // 检查用户是否已登录且有地址
  const hasAddresses = user && user.addresses.length > 0;

  // 显示添加地址模态框
  const showAddModal = () => {
    setEditingAddress(null);
    form.resetFields();
    setIsAddModalVisible(true);
  };

  // 显示编辑地址模态框
  const showEditModal = (address: Address) => {
    setEditingAddress(address);
    form.setFieldsValue({
      recipient: address.recipient,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detailAddress: address.detailAddress,
      zipCode: address.zipCode,
      isDefault: address.isDefault
    });
    setIsAddModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsAddModalVisible(false);
    setEditingAddress(null);
    form.resetFields();
  };

  // 保存地址
  const handleSaveAddress = (values: any) => {
    const addressData = {
      ...values,
      id: editingAddress ? editingAddress.id : Date.now().toString()
    };

    if (editingAddress) {
      updateAddress(editingAddress.id, addressData);
    } else {
      addAddress(addressData as Address);
    }

    if (values.isDefault) {
      setDefaultAddress(addressData.id);
      setSelectedAddress(addressData.id);
    }

    closeModal();
  };

  // 删除地址
  const handleDeleteAddress = (addressId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      onOk: () => {
        removeAddress(addressId);
        if (selectedAddress === addressId) {
          setSelectedAddress(null);
        }
      }
    });
  };

  // 选择地址
  const handleSelectAddress = (addressId: string) => {
    setSelectedAddress(addressId);
  };

  // 继续下一步
  const handleNext = () => {
    if (selectedAddress) {
      onNext();
    } else {
      Modal.warning({
        title: '请选择收货地址',
        content: '请选择或添加一个收货地址以继续'
      });
    }
  };

  // 渲染未登录状态
  const renderNotLoggedIn = () => (
    <div className="address-not-logged">
      <Title level={5}>请先登录以管理地址</Title>
      <Button onClick={onBack}>返回</Button>
    </div>
  );

  // 渲染地址表单
  const renderAddressForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSaveAddress}
    >
      <Form.Item
        name="recipient"
        label="收件人"
        rules={[{ required: true, message: '请输入收件人姓名!' }]}
      >
        <Input placeholder="请输入收件人姓名" />
      </Form.Item>
      <Form.Item
        name="phone"
        label="联系电话"
        rules={[{ required: true, message: '请输入联系电话!' }]}
      >
        <Input placeholder="请输入联系电话" />
      </Form.Item>
      <Form.Item
        name="province"
        label="省份"
        rules={[{ required: true, message: '请选择省份!' }]}
      >
        <Input placeholder="省份" />
      </Form.Item>
      <Form.Item
        name="city"
        label="城市"
        rules={[{ required: true, message: '请选择城市!' }]}
      >
        <Input placeholder="城市" />
      </Form.Item>
      <Form.Item
        name="district"
        label="区县"
        rules={[{ required: true, message: '请选择区县!' }]}
      >
        <Input placeholder="区县" />
      </Form.Item>
      <Form.Item
        name="detailAddress"
        label="详细地址"
        rules={[{ required: true, message: '请输入详细地址!' }]}
      >
        <Input.TextArea placeholder="街道、门牌号等" />
      </Form.Item>
      <Form.Item
        name="zipCode"
        label="邮政编码"
      >
        <Input placeholder="邮政编码" />
      </Form.Item>
      <Form.Item
        name="isDefault"
        valuePropName="checked"
      >
        <Checkbox>设为默认地址</Checkbox>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          保存地址
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="address-selector">
      {!user ? (
        renderNotLoggedIn()
      ) : (
        <>
          <div className="address-list-header">
            <Title level={5}>选择收货地址</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showAddModal}
            >
              添加新地址
            </Button>
          </div>

          {hasAddresses ? (
            <Radio.Group 
              className="address-radio-group"
              value={selectedAddress}
              onChange={e => handleSelectAddress(e.target.value)}
            >
              <List
                dataSource={user.addresses}
                renderItem={address => (
                  <List.Item
                    actions={[
                      <Button 
                        icon={<EditOutlined />} 
                        onClick={() => showEditModal(address)}
                        type="text"
                      />,
                      <Button 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleDeleteAddress(address.id)}
                        type="text"
                        danger
                      />
                    ]}
                  >
                    <Radio value={address.id}>
                      <Card className={`address-card ${address.isDefault ? 'default-address' : ''}`}>
                        <div className="address-info">
                          <div className="address-recipient">
                            <Text strong>{address.recipient}</Text>
                            <Text type="secondary">{address.phone}</Text>
                          </div>
                          <div className="address-detail">
                            <Text>
                              {address.province} {address.city} {address.district} {address.detailAddress}
                              {address.zipCode ? ` ${address.zipCode}` : ''}
                            </Text>
                          </div>
                          {address.isDefault && <div className="default-badge">默认</div>}
                        </div>
                      </Card>
                    </Radio>
                  </List.Item>
                )}
              />
            </Radio.Group>
          ) : (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无收货地址，请添加" 
            />
          )}

          <Divider />

          <div className="address-actions">
            <Button onClick={onBack}>返回</Button>
            <Button 
              type="primary" 
              onClick={handleNext}
              disabled={!selectedAddress}
            >
              确认使用
            </Button>
          </div>
        </>
      )}

      <Modal
        title={editingAddress ? "编辑地址" : "新增地址"}
        open={isAddModalVisible}
        onCancel={closeModal}
        footer={null}
      >
        {renderAddressForm()}
      </Modal>
    </div>
  );
};

export default AddressSelector;