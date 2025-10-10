import React, { useState, useEffect } from 'react'
import { Card, Space, Button, Select, message } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, QrcodeOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import CodeEditor from '@/components/CodeEditor/CodeEditor'
import QRCodeGenerator from '@/components/QRCode/QRCodeGenerator'

const ProductCodePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [currentTab, setCurrentTab] = useState('config')
  const [productData, setProductData] = useState(null)
  const [configCode, setConfigCode] = useState('')
  const [scriptCode, setScriptCode] = useState('')
  const [styleCode, setStyleCode] = useState('')
  const [qrCodeText, setQrCodeText] = useState('')
  
  // 初始化代码内容
  const initializeCode = () => {
    setConfigCode(`{
  "productId": "${id}",
  "displayConfig": {
    "showPrice": true,
    "showStock": true,
    "showDescription": true,
    "theme": "default",
    "layout": "grid"
  },
  "businessRules": {
    "minOrderQuantity": 1,
    "maxOrderQuantity": 100,
    "allowBackorder": false,
    "autoRestock": true
  },
  "integrations": {
    "paymentMethods": ["wechat", "alipay", "unionpay"],
    "shippingMethods": ["express", "standard"],
    "analyticsEnabled": true
  }
}`)

    setScriptCode(`// 商品业务逻辑脚本
class ProductManager {
  constructor(productId) {
    this.productId = productId;
    this.config = this.loadConfig();
  }
  
  // 加载商品配置
  loadConfig() {
    // 从配置中心加载商品配置
    return JSON.parse(localStorage.getItem(\`product_config_\${this.productId}\`) || '{}');
  }
  
  // 保存商品配置
  saveConfig(config) {
    localStorage.setItem(\`product_config_\${this.productId}\`, JSON.stringify(config));
    this.config = config;
  }
  
  // 检查库存
  checkStock(quantity = 1) {
    const currentStock = this.getCurrentStock();
    return currentStock >= quantity;
  }
  
  // 获取当前库存
  getCurrentStock() {
    // 调用库存API
    return Math.floor(Math.random() * 1000);
  }
  
  // 计算价格
  calculatePrice(quantity = 1, discountCode = null) {
    const basePrice = this.config.basePrice || 0;
    let totalPrice = basePrice * quantity;
    
    // 应用折扣
    if (discountCode) {
      totalPrice = this.applyDiscount(totalPrice, discountCode);
    }
    
    return totalPrice;
  }
  
  // 应用折扣
  applyDiscount(price, discountCode) {
    const discounts = {
      'SAVE10': 0.9,
      'SAVE20': 0.8,
      'VIP': 0.85
    };
    
    return price * (discounts[discountCode] || 1);
  }
  
  // 生成商品二维码数据
  generateQRData() {
    return {
      productId: this.productId,
      name: this.config.name,
      price: this.config.basePrice,
      url: \`https://shop.example.com/product/\${this.productId}\`,
      timestamp: new Date().toISOString()
    };
  }
}

// 初始化商品管理器
const productManager = new ProductManager('${id}');

// 导出给其他模块使用
window.productManager = productManager;`)

    setStyleCode(`/* 商品展示样式定制 */
.product-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.product-header {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.product-image {
  width: 300px;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.product-description {
  font-size: 16px;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 20px;
}

.product-price {
  font-size: 36px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.product-stock {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 10px;
}

.product-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-primary {
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.btn-secondary {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: white;
  padding: 10px 22px;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.8);
}

.product-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.detail-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.detail-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.detail-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.detail-content {
  color: #666;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-header {
    flex-direction: column;
    text-align: center;
  }
  
  .product-image {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
  }
  
  .product-title {
    font-size: 24px;
  }
  
  .product-price {
    font-size: 28px;
  }
  
  .product-actions {
    justify-content: center;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.product-container * {
  animation: fadeInUp 0.6s ease-out;
}`)

    // 生成二维码数据
    const qrData = {
      productId: id,
      name: '商品名称',
      price: 99.99,
      url: `https://shop.example.com/product/${id}`,
      timestamp: new Date().toISOString()
    }
    setQrCodeText(JSON.stringify(qrData, null, 2))
  }
  
  // 保存代码
  const handleSave = (code, language) => {
    // 这里应该保存到服务器
    console.log('保存代码:', { code, language, tab: currentTab })
    message.success('代码保存成功')
  }
  
  // 生成二维码
  const handleGenerateQR = (data) => {
    console.log('生成二维码:', data)
    message.success('二维码生成成功')
  }
  
  // 返回列表
  const handleBack = () => {
    navigate('/products')
  }
  
  // 获取当前代码内容
  const getCurrentCode = () => {
    switch (currentTab) {
      case 'config':
        return configCode
      case 'script':
        return scriptCode
      case 'style':
        return styleCode
      default:
        return ''
    }
  }
  
  // 获取当前语言
  const getCurrentLanguage = () => {
    switch (currentTab) {
      case 'config':
        return 'json'
      case 'script':
        return 'javascript'
      case 'style':
        return 'css'
      default:
        return 'javascript'
    }
  }
  
  // 代码变化处理
  const handleCodeChange = (newCode) => {
    switch (currentTab) {
      case 'config':
        setConfigCode(newCode)
        break
      case 'script':
        setScriptCode(newCode)
        break
      case 'style':
        setStyleCode(newCode)
        break
      default:
        break
    }
  }
  
  // 初始化
  useEffect(() => {
    initializeCode()
    
    // 模拟加载商品数据
    setProductData({
      id,
      name: '示例商品',
      description: '这是一个示例商品的描述',
      price: 99.99,
    })
  }, [id])
  
  const tabOptions = [
    { label: '配置代码 (JSON)', value: 'config' },
    { label: '业务脚本 (JavaScript)', value: 'script' },
    { label: '样式代码 (CSS)', value: 'style' },
    { label: '二维码生成', value: 'qrcode' },
  ]
  
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
            商品代码配置 - {productData?.name || `商品 ${id}`}
          </Space>
        }
        extra={
          <Space>
            <Select
              value={currentTab}
              onChange={setCurrentTab}
              style={{ width: 200 }}
              options={tabOptions}
            />
            
            {currentTab !== 'qrcode' && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSave(getCurrentCode(), getCurrentLanguage())}
              >
                保存代码
              </Button>
            )}
            
            {currentTab === 'qrcode' && (
              <Button
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={() => handleGenerateQR({ text: qrCodeText })}
              >
                生成二维码
              </Button>
            )}
          </Space>
        }
        style={{ height: 'calc(100vh - 112px)' }}
        bodyStyle={{ height: 'calc(100% - 57px)', padding: '16px' }}
      >
        {currentTab === 'qrcode' ? (
          <QRCodeGenerator
            defaultText={qrCodeText}
            onGenerate={handleGenerateQR}
            showControls={true}
            showPreview={true}
          />
        ) : (
          <CodeEditor
            initialValue={getCurrentCode()}
            initialLanguage={getCurrentLanguage()}
            height="100%"
            onSave={handleSave}
            onValueChange={handleCodeChange}
            showToolbar={true}
            showMinimap={true}
          />
        )}
      </Card>
    </div>
  )
}

export default ProductCodePage