import React, { useState } from 'react';
import { Card, Avatar, Typography, Button, Modal, Form, Input } from 'antd';
import { UserOutlined, EditOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import { useUser } from '../contexts/UserContext';

import '../styles/UserCard.css';

const { Meta } = Card;
const { Title, Text } = Typography;

const UserCard: React.FC = () => {
  const { user, isLoggedIn, login, logout, updateUser } = useUser();
  const [isLoginModalVisible, setIsLoginModalVisible] = useState<boolean>(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  
  // 模拟登录表单提交
  const handleLogin = (values: any) => {
    // 实际项目中，这里应该发送API请求验证用户
    login({
      id: '1',
      username: values.username,
      avatar: 'https://via.placeholder.com/100',
      bio: '这是一个简短的个人简介',
      addresses: []
    });
    setIsLoginModalVisible(false);
  };

  // 编辑用户信息
  const handleEditProfile = (values: any) => {
    if (user) {
      updateUser({
        username: values.username,
        bio: values.bio
      });
    }
    setIsEditModalVisible(false);
  };

  // 显示登录模态框
  const showLoginModal = () => {
    setIsLoginModalVisible(true);
  };

  // 显示编辑模态框
  const showEditModal = () => {
    setIsEditModalVisible(true);
  };

  // 渲染未登录状态
  const renderNotLoggedIn = () => (
    <Card className="user-card">
      <div className="user-card-not-logged">
        <Avatar size={64} icon={<UserOutlined />} />
        <Title level={4}>访客用户</Title>
        <Text type="secondary">登录以享受更多功能</Text>
        <Button 
          type="primary" 
          icon={<LoginOutlined />} 
          onClick={showLoginModal}
          className="login-button"
        >
          登录
        </Button>
      </div>
    </Card>
  );

  // 渲染已登录状态
  const renderLoggedIn = () => (
    <Card
      className="user-card"
      actions={[
        <Button 
          type="text" 
          icon={<EditOutlined />} 
          onClick={showEditModal}
        >
          编辑资料
        </Button>,
        <Button 
          type="text" 
          danger 
          icon={<LogoutOutlined />} 
          onClick={logout}
        >
          退出登录
        </Button>
      ]}
    >
      <Meta
        avatar={<Avatar src={user?.avatar} size={64} />}
        title={user?.username}
        description={user?.bio}
      />
    </Card>
  );

  // 登录模态框
  const loginModal = (
    <Modal
      title="用户登录"
      open={isLoginModalVisible}
      onCancel={() => setIsLoginModalVisible(false)}
      footer={null}
    >
      <Form onFinish={handleLogin} layout="vertical">
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: '请输入用户名!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: '请输入密码!' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );

  // 编辑资料模态框
  const editModal = (
    <Modal
      title="编辑个人资料"
      open={isEditModalVisible}
      onCancel={() => setIsEditModalVisible(false)}
      footer={null}
    >
      <Form 
        onFinish={handleEditProfile} 
        layout="vertical"
        initialValues={{ username: user?.username, bio: user?.bio }}
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: '请输入用户名!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="个人简介"
          name="bio"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            保存
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <>
      {isLoggedIn ? renderLoggedIn() : renderNotLoggedIn()}
      {loginModal}
      {editModal}
    </>
  );
};

export default UserCard;