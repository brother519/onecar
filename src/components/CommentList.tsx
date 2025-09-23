import React, { useState } from 'react';
import { List, Avatar, Rate, Typography, Divider, Button, Input, Form, Radio, Empty } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useUser } from '../contexts/UserContext';

import '../styles/CommentList.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 评论接口
interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  productId: string;
  rating: number;
  content: string;
  images: string[];
  createdAt: string;
}

// 模拟评论数据
const mockComments: Comment[] = [
  {
    id: '1',
    userId: '101',
    username: '张先生',
    avatar: 'https://via.placeholder.com/50',
    productId: '1',
    rating: 5,
    content: '非常好用的轮胎，抓地力强，静音效果好，安装后明显感觉到行驶更加平稳。',
    images: ['https://via.placeholder.com/100'],
    createdAt: '2025-09-20T10:30:00Z'
  },
  {
    id: '2',
    userId: '102',
    username: '李女士',
    avatar: 'https://via.placeholder.com/50',
    productId: '1',
    rating: 4,
    content: '轮胎质量不错，但是价格稍贵。总体来说性价比可以接受。',
    images: [],
    createdAt: '2025-09-18T14:20:00Z'
  },
  {
    id: '3',
    userId: '103',
    username: '王先生',
    avatar: 'https://via.placeholder.com/50',
    productId: '2',
    rating: 5,
    content: '机油质量非常好，发动机运行更加顺畅，油耗也有所降低。',
    images: ['https://via.placeholder.com/100', 'https://via.placeholder.com/100'],
    createdAt: '2025-09-19T09:15:00Z'
  },
  {
    id: '4',
    userId: '104',
    username: '赵女士',
    avatar: 'https://via.placeholder.com/50',
    productId: '3',
    rating: 3,
    content: '滤清器安装简单，但过滤效果一般，希望厂家能提升品质。',
    images: [],
    createdAt: '2025-09-17T16:40:00Z'
  }
];

interface CommentListProps {
  productId: string;
}

const CommentList: React.FC<CommentListProps> = ({ productId }) => {
  const { user, isLoggedIn } = useUser();
  const [comments, setComments] = useState<Comment[]>(
    mockComments.filter(comment => comment.productId === productId)
  );
  const [sortType, setSortType] = useState<string>('latest');
  const [form] = Form.useForm();

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 排序评论
  const sortComments = () => {
    let sortedComments = [...comments];
    
    if (sortType === 'latest') {
      sortedComments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortType === 'rating_high') {
      sortedComments.sort((a, b) => b.rating - a.rating);
    } else if (sortType === 'rating_low') {
      sortedComments.sort((a, b) => a.rating - b.rating);
    }
    
    return sortedComments;
  };

  // 提交评论
  const handleSubmitComment = (values: any) => {
    if (!isLoggedIn || !user) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      productId,
      rating: values.rating,
      content: values.content,
      images: [],
      createdAt: new Date().toISOString()
    };

    setComments([newComment, ...comments]);
    form.resetFields();
  };

  // 渲染评论表单
  const renderCommentForm = () => {
    if (!isLoggedIn) {
      return (
        <div className="login-prompt">
          <Text>请登录后发表评论</Text>
        </div>
      );
    }

    return (
      <Form form={form} onFinish={handleSubmitComment} className="comment-form">
        <Form.Item
          name="rating"
          rules={[{ required: true, message: '请给出您的评分' }]}
        >
          <Rate allowHalf />
        </Form.Item>
        <Form.Item
          name="content"
          rules={[{ required: true, message: '请输入评论内容' }]}
        >
          <TextArea rows={4} placeholder="请分享您的使用体验..." />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            提交评论
          </Button>
        </Form.Item>
      </Form>
    );
  };

  return (
    <div className="comment-list">
      <div className="comment-header">
        <Title level={4}>用户评价</Title>
        <Radio.Group 
          value={sortType} 
          onChange={(e) => setSortType(e.target.value)}
        >
          <Radio.Button value="latest">最新</Radio.Button>
          <Radio.Button value="rating_high">好评优先</Radio.Button>
          <Radio.Button value="rating_low">差评优先</Radio.Button>
        </Radio.Group>
      </div>

      <Divider />

      {/* 评论列表 */}
      {comments.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={sortComments()}
          renderItem={comment => (
            <List.Item
              key={comment.id}
              extra={
                comment.images.length > 0 && (
                  <div className="comment-images">
                    {comment.images.map((image, index) => (
                      <img key={index} src={image} alt={`评论图片 ${index + 1}`} />
                    ))}
                  </div>
                )
              }
            >
              <List.Item.Meta
                avatar={<Avatar src={comment.avatar} icon={<UserOutlined />} />}
                title={
                  <div className="comment-title">
                    <Text strong>{comment.username}</Text>
                    <Rate disabled allowHalf defaultValue={comment.rating} />
                  </div>
                }
                description={formatDate(comment.createdAt)}
              />
              <div className="comment-content">{comment.content}</div>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无评论" />
      )}

      <Divider />

      {/* 评论表单 */}
      <Title level={5}>发表评论</Title>
      {renderCommentForm()}
    </div>
  );
};

export default CommentList;