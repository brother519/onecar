import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button, Select, Input, Space, Card, message, Modal, Upload, ColorPicker } from 'antd'
import {
  QrcodeOutlined,
  DownloadOutlined,
  CopyOutlined,
  EyeOutlined,
  UploadOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons'

// 模拟 QRCode 库，实际使用时需要安装 qrcode
const generateQRCode = (text, options = {}) => {
  // 这里应该使用真正的 QRCode 库
  // 目前返回一个模拟的 Data URL
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const size = options.width || 200
  
  canvas.width = size
  canvas.height = size
  
  // 简单的模拟二维码绘制
  ctx.fillStyle = options.color?.dark || '#000000'
  ctx.fillRect(0, 0, size, size)
  
  ctx.fillStyle = options.color?.light || '#FFFFFF'
  const cellSize = size / 25
  
  // 绘制简单的模拟图案
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      if ((i + j) % 3 === 0) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
      }
    }
  }
  
  // 添加文本标识
  ctx.fillStyle = options.color?.dark || '#000000'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('QR', size / 2, size / 2)
  
  return canvas.toDataURL('image/png')
}

const QRCodeGenerator = ({
  defaultText = '',
  onGenerate,
  showControls = true,
  showPreview = true,
}) => {
  const [text, setText] = useState(defaultText)
  const [qrCodeData, setQrCodeData] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [options, setOptions] = useState({
    size: 200,
    margin: 4,
    errorCorrectionLevel: 'M',
    type: 'image/png',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const canvasRef = useRef(null)
  
  // 二维码数据类型预设
  const dataTypes = [
    {
      label: '商品信息',
      value: 'product',
      template: '{"id": "product_001", "name": "商品名称", "price": 99.99, "url": "https://example.com/product/001"}',
    },
    {
      label: '网址链接',
      value: 'url',
      template: 'https://example.com',
    },
    {
      label: '联系信息',
      value: 'contact',
      template: 'BEGIN:VCARD\nVERSION:3.0\nFN:张三\nTEL:13800138000\nEMAIL:zhangsan@example.com\nEND:VCARD',
    },
    {
      label: 'WiFi信息',
      value: 'wifi',
      template: 'WIFI:T:WPA;S:网络名称;P:密码;H:false;;',
    },
    {
      label: '文本信息',
      value: 'text',
      template: '自定义文本内容',
    },
  ]
  
  // 错误纠正级别
  const errorLevels = [
    { label: '低 (L)', value: 'L', description: '约可纠正7%错误' },
    { label: '中 (M)', value: 'M', description: '约可纠正15%错误' },
    { label: '四分位 (Q)', value: 'Q', description: '约可纠正25%错误' },
    { label: '高 (H)', value: 'H', description: '约可纠正30%错误' },
  ]
  
  // 生成二维码
  const generateQR = useCallback(async () => {
    if (!text.trim()) {
      message.warning('请输入要生成二维码的内容')
      return
    }
    
    setIsGenerating(true)
    
    try {
      // 模拟生成延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const qrOptions = {
        width: options.size,
        margin: options.margin,
        errorCorrectionLevel: options.errorCorrectionLevel,
        color: options.color,
        type: options.type,
      }
      
      const dataUrl = generateQRCode(text, qrOptions)
      setQrCodeData(dataUrl)
      
      onGenerate && onGenerate({
        text,
        dataUrl,
        options: qrOptions,
      })
      
      message.success('二维码生成成功')
    } catch (error) {
      message.error('二维码生成失败: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }, [text, options, onGenerate])
  
  // 下载二维码
  const downloadQR = useCallback(() => {
    if (!qrCodeData) {
      message.warning('请先生成二维码')
      return
    }
    
    const link = document.createElement('a')
    link.download = `qrcode_${Date.now()}.png`
    link.href = qrCodeData
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    message.success('二维码下载成功')
  }, [qrCodeData])
  
  // 复制二维码
  const copyQR = useCallback(async () => {
    if (!qrCodeData) {
      message.warning('请先生成二维码')
      return
    }
    
    try {
      // 将 Data URL 转换为 Blob
      const response = await fetch(qrCodeData)
      const blob = await response.blob()
      
      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ])
      
      message.success('二维码已复制到剪贴板')
    } catch (error) {
      // 降级方案：复制文本内容
      try {
        await navigator.clipboard.writeText(text)
        message.success('二维码内容已复制到剪贴板')
      } catch (fallbackError) {
        message.error('复制失败')
      }
    }
  }, [qrCodeData, text])
  
  // 应用数据类型模板
  const applyTemplate = useCallback((type) => {
    const template = dataTypes.find(dt => dt.value === type)
    if (template) {
      setText(template.template)
    }
  }, [dataTypes])
  
  // 解析上传的二维码
  const parseQRCode = useCallback((file) => {
    // 这里应该使用真正的二维码解析库
    message.info('二维码解析功能开发中...')
    return false // 阻止默认上传
  }, [])
  
  // 自动生成（当文本变化时）
  useEffect(() => {
    if (text && text.trim().length > 0) {
      const timer = setTimeout(() => {
        generateQR()
      }, 1000) // 防抖
      
      return () => clearTimeout(timer)
    }
  }, [text, generateQR])
  
  // 渲染控制面板
  const renderControls = () => {
    if (!showControls) return null
    
    return (
      <Card title="二维码生成器" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>数据类型:</label>
            <Select
              style={{ width: '100%' }}
              placeholder="选择数据类型模板"
              onChange={applyTemplate}
              options={dataTypes}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>内容:</label>
            <Input.TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请输入要生成二维码的内容"
              rows={4}
              showCount
              maxLength={2048}
            />
          </div>
          
          <Space wrap>
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={generateQR}
              loading={isGenerating}
              disabled={!text.trim()}
            >
              生成二维码
            </Button>
            
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadQR}
              disabled={!qrCodeData}
            >
              下载
            </Button>
            
            <Button
              icon={<CopyOutlined />}
              onClick={copyQR}
              disabled={!qrCodeData}
            >
              复制
            </Button>
            
            <Button
              icon={<EyeOutlined />}
              onClick={() => setPreviewVisible(true)}
              disabled={!qrCodeData}
            >
              预览
            </Button>
            
            <Upload
              accept="image/*"
              beforeUpload={parseQRCode}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                解析二维码
              </Button>
            </Upload>
            
            <Button
              icon={<SettingOutlined />}
              onClick={() => setIsSettingsVisible(true)}
            >
              设置
            </Button>
          </Space>
        </Space>
      </Card>
    )
  }
  
  // 渲染预览
  const renderPreview = () => {
    if (!showPreview || !qrCodeData) return null
    
    return (
      <Card title="二维码预览" style={{ textAlign: 'center' }}>
        <div className="qr-code-container">
          <img
            src={qrCodeData}
            alt="QR Code"
            style={{
              maxWidth: '100%',
              border: '1px solid #f0f0f0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <div style={{ marginTop: 16, color: '#666', fontSize: '12px' }}>
            尺寸: {options.size}x{options.size} | 纠错级别: {options.errorCorrectionLevel}
          </div>
          <div style={{ marginTop: 8, color: '#999', fontSize: '12px', wordBreak: 'break-all' }}>
            内容: {text.length > 50 ? text.substring(0, 50) + '...' : text}
          </div>
        </div>
      </Card>
    )
  }
  
  return (
    <div className="qr-code-generator">
      {renderControls()}
      {renderPreview()}
      
      {/* 设置弹窗 */}
      <Modal
        title="二维码设置"
        visible={isSettingsVisible}
        onCancel={() => setIsSettingsVisible(false)}
        onOk={() => setIsSettingsVisible(false)}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>尺寸大小:</label>
            <Select
              value={options.size}
              onChange={(value) => setOptions(prev => ({ ...prev, size: value }))}
              style={{ width: '100%' }}
              options={[
                { label: '100x100', value: 100 },
                { label: '150x150', value: 150 },
                { label: '200x200', value: 200 },
                { label: '300x300', value: 300 },
                { label: '400x400', value: 400 },
                { label: '500x500', value: 500 },
              ]}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>边距大小:</label>
            <Select
              value={options.margin}
              onChange={(value) => setOptions(prev => ({ ...prev, margin: value }))}
              style={{ width: '100%' }}
              options={[
                { label: '0', value: 0 },
                { label: '2', value: 2 },
                { label: '4', value: 4 },
                { label: '6', value: 6 },
                { label: '8', value: 8 },
                { label: '10', value: 10 },
              ]}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>错误纠正级别:</label>
            <Select
              value={options.errorCorrectionLevel}
              onChange={(value) => setOptions(prev => ({ ...prev, errorCorrectionLevel: value }))}
              style={{ width: '100%' }}
              options={errorLevels}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>前景色:</label>
              <Input
                value={options.color.dark}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  color: { ...prev.color, dark: e.target.value }
                }))}
                placeholder="#000000"
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>背景色:</label>
              <Input
                value={options.color.light}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  color: { ...prev.color, light: e.target.value }
                }))}
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </Space>
      </Modal>
      
      {/* 预览弹窗 */}
      <Modal
        title="二维码预览"
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={downloadQR}>
            下载
          </Button>,
          <Button key="copy" icon={<CopyOutlined />} onClick={copyQR}>
            复制
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {qrCodeData && (
            <img
              src={qrCodeData}
              alt="QR Code Preview"
              style={{
                maxWidth: '100%',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  )
}

export default QRCodeGenerator