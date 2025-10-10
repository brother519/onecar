import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Select, InputNumber, Upload, Button, message, Row, Col, Space } from 'antd'
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { createProduct, updateProduct } from '@/store/slices/productSlice'
import CaptchaInput from '@/components/Captcha/CaptchaInput'

const { TextArea } = Input
const { Option } = Select

const ProductEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  
  const [loading, setLoading] = useState(false)
  const [imageList, setImageList] = useState([])
  const [captchaVerified, setCaptchaVerified] = useState(false)
  
  const isEdit = Boolean(id)
  
  // 表单提交
  const handleSubmit = async (values) => {
    if (!captchaVerified) {
      message.warning('请先完成验证码验证')
      return
    }
    
    setLoading(true)
    
    try {
      const productData = {
        ...values,
        images: imageList.map(img => img.url || img.response?.url || img.thumbUrl),
      }
      
      if (isEdit) {
        await dispatch(updateProduct({ id, data: productData })).unwrap()
        message.success('商品更新成功')
      } else {
        await dispatch(createProduct(productData)).unwrap()
        message.success('商品创建成功')
      }
      
      navigate('/products')
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 处理验证码验证结果
  const handleCaptchaVerify = (isValid) => {
    setCaptchaVerified(isValid)
  }
  
  // 上传图片处理
  const handleUploadChange = ({ fileList }) => {
    setImageList(fileList)
  }
  
  // 返回列表
  const handleBack = () => {
    navigate('/products')
  }
  
  // 加载商品数据（编辑模式）
  useEffect(() => {
    if (isEdit && id) {
      // 这里应该从API获取商品数据
      // 暂时使用模拟数据
      const mockProduct = {
        name: '示例商品',
        description: '这是一个示例商品描述',
        price: 99.99,
        category: '电子产品',
        stock: 100,
        status: 'active',
        attributes: {
          brand: '示例品牌',
          model: '示例型号',
          weight: '1.5kg',
        },
      }
      
      form.setFieldsValue(mockProduct)
    }
  }, [isEdit, id, form])
  
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
            {isEdit ? '编辑商品' : '新增商品'}
          </Space>
        }
        extra={
          <Space>
            <Button onClick={handleBack}>
              取消
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={() => form.submit()}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'active',
            stock: 0,
            price: 0,
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="商品名称"
                name="name"
                rules={[
                  { required: true, message: '请输入商品名称' },
                  { max: 100, message: '商品名称不能超过100个字符' },
                ]}
              >
                <Input placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="商品分类"
                name="category"
                rules={[{ required: true, message: '请选择商品分类' }]}
              >
                <Select placeholder="请选择商品分类">
                  <Option value="电子产品">电子产品</Option>
                  <Option value="服装">服装</Option>
                  <Option value="家居用品">家居用品</Option>
                  <Option value="食品">食品</Option>
                  <Option value="图书">图书</Option>
                  <Option value="运动器材">运动器材</Option>
                  <Option value="美妆">美妆</Option>
                  <Option value="汽车用品">汽车用品</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="商品描述"
            name="description"
            rules={[
              { required: true, message: '请输入商品描述' },
              { max: 500, message: '商品描述不能超过500个字符' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请输入商品描述"
              showCount
              maxLength={500}
            />
          </Form.Item>
          
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="商品价格"
                name="price"
                rules={[
                  { required: true, message: '请输入商品价格' },
                  { type: 'number', min: 0, message: '价格不能为负数' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入商品价格"
                  min={0}
                  precision={2}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                label="库存数量"
                name="stock"
                rules={[
                  { required: true, message: '请输入库存数量' },
                  { type: 'number', min: 0, message: '库存数量不能为负数' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入库存数量"
                  min={0}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                label="商品状态"
                name="status"
                rules={[{ required: true, message: '请选择商品状态' }]}
              >
                <Select placeholder="请选择商品状态">
                  <Option value="active">上架</Option>
                  <Option value="inactive">下架</Option>
                  <Option value="draft">草稿</Option>
                  <Option value="discontinued">停产</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="商品图片">
            <Upload
              listType="picture-card"
              fileList={imageList}
              onChange={handleUploadChange}
              beforeUpload={() => false} // 阻止自动上传
              maxCount={5}
            >
              {imageList.length < 5 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
            <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
              最多上传5张图片，支持 jpg、png、gif 格式，单张图片不超过 2MB
            </div>
          </Form.Item>
          
          <Card title="商品属性" size="small" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="品牌"
                  name={['attributes', 'brand']}
                >
                  <Input placeholder="请输入品牌" />
                </Form.Item>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  label="型号"
                  name={['attributes', 'model']}
                >
                  <Input placeholder="请输入型号" />
                </Form.Item>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  label="重量"
                  name={['attributes', 'weight']}
                >
                  <Input placeholder="请输入重量" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              label="尺寸"
              name={['attributes', 'dimensions']}
            >
              <Input placeholder="请输入尺寸，如：长x宽x高" />
            </Form.Item>
          </Card>
          
          <Card title="安全验证" size="small">
            <div style={{ marginBottom: 16 }}>
              <CaptchaInput
                onVerify={handleCaptchaVerify}
                type="image"
                difficulty="medium"
              />
            </div>
            {captchaVerified && (
              <div style={{ color: '#52c41a', fontSize: '14px' }}>
                ✓ 验证通过
              </div>
            )}
          </Card>
        </Form>
      </Card>
    </div>
  )
}

export default ProductEditPage