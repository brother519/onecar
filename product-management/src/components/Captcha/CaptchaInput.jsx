import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Input, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

const CaptchaInput = ({ 
  onVerify, 
  type = 'image', // 'image', 'slide', 'number'
  width = 120,
  height = 40,
  length = 4,
  difficulty = 'medium' // 'easy', 'medium', 'hard'
}) => {
  const [captchaCode, setCaptchaCode] = useState('')
  const [userInput, setUserInput] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const canvasRef = useRef(null)
  
  // 生成随机字符
  const generateRandomCode = useCallback((len = length) => {
    const chars = difficulty === 'easy' 
      ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      : difficulty === 'medium'
      ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    
    let result = ''
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }, [length, difficulty])
  
  // 生成干扰线
  const generateInterferenceLines = useCallback((ctx, width, height) => {
    const lineCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 8
    
    for (let i = 0; i < lineCount; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.3)`
      ctx.lineWidth = Math.random() * 2 + 1
      ctx.beginPath()
      ctx.moveTo(Math.random() * width, Math.random() * height)
      ctx.lineTo(Math.random() * width, Math.random() * height)
      ctx.stroke()
    }
  }, [difficulty])
  
  // 生成干扰点
  const generateInterferencePoints = useCallback((ctx, width, height) => {
    const pointCount = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100
    
    for (let i = 0; i < pointCount; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.4)`
      ctx.beginPath()
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 2 + 1,
        0,
        2 * Math.PI
      )
      ctx.fill()
    }
  }, [difficulty])
  
  // 绘制图形验证码
  const drawImageCaptcha = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const code = generateRandomCode()
    
    // 设置画布尺寸
    canvas.width = width
    canvas.height = height
    
    // 清除画布
    ctx.clearRect(0, 0, width, height)
    
    // 设置背景渐变
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f0f2f5')
    gradient.addColorStop(1, '#e6f7ff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    // 添加边框
    ctx.strokeStyle = '#d9d9d9'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, width, height)
    
    // 绘制干扰线
    generateInterferenceLines(ctx, width, height)
    
    // 绘制验证码文字
    const fontSize = Math.min(width / code.length * 0.8, height * 0.6)
    ctx.font = `bold ${fontSize}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const charWidth = width / code.length
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i]
      const x = charWidth * i + charWidth / 2
      const y = height / 2 + (Math.random() - 0.5) * 10 // 随机Y偏移
      
      // 随机颜色
      const colors = ['#1890ff', '#52c41a', '#fa541c', '#eb2f96', '#722ed1', '#13c2c2']
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
      
      // 随机旋转
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((Math.random() - 0.5) * 0.5) // 随机旋转角度
      ctx.fillText(char, 0, 0)
      ctx.restore()
    }
    
    // 绘制干扰点
    generateInterferencePoints(ctx, width, height)
    
    setCaptchaCode(code)
    setCaptchaImage(canvas.toDataURL())
  }, [width, height, generateRandomCode, generateInterferenceLines, generateInterferencePoints])
  
  // 刷新验证码
  const refreshCaptcha = useCallback(() => {
    if (isLocked) {
      message.warning('请等待解锁后再试')
      return
    }
    
    setUserInput('')
    
    switch (type) {
      case 'image':
        drawImageCaptcha()
        break
      case 'number':
        setCaptchaCode(generateRandomCode(6))
        break
      default:
        drawImageCaptcha()
    }
  }, [type, drawImageCaptcha, generateRandomCode, isLocked])
  
  // 验证验证码
  const verifyCaptcha = useCallback(async () => {
    if (isLocked) {
      message.warning('验证码已锁定，请稍后再试')
      return
    }
    
    if (!userInput.trim()) {
      message.warning('请输入验证码')
      return
    }
    
    setIsVerifying(true)
    
    try {
      // 模拟验证延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const isValid = userInput.toLowerCase() === captchaCode.toLowerCase()
      
      if (isValid) {
        message.success('验证成功')
        setAttempts(0)
        onVerify && onVerify(true, userInput)
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        
        if (newAttempts >= 3) {
          setIsLocked(true)
          message.error('验证失败次数过多，已锁定5分钟')
          
          // 5分钟后解锁
          setTimeout(() => {
            setIsLocked(false)
            setAttempts(0)
            refreshCaptcha()
            message.info('验证码已解锁')
          }, 5 * 60 * 1000)
        } else {
          message.error(`验证失败，还可尝试 ${3 - newAttempts} 次`)
        }
        
        refreshCaptcha()
        onVerify && onVerify(false, userInput)
      }
    } catch (error) {
      message.error('验证过程中发生错误')
      onVerify && onVerify(false, userInput, error)
    } finally {
      setIsVerifying(false)
    }
  }, [userInput, captchaCode, attempts, isLocked, onVerify, refreshCaptcha])
  
  // 处理输入变化
  const handleInputChange = (e) => {
    if (isLocked) return
    setUserInput(e.target.value)
  }
  
  // 处理回车键
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      verifyCaptcha()
    }
  }
  
  // 初始化
  useEffect(() => {
    refreshCaptcha()
  }, [refreshCaptcha])
  
  // 渲染不同类型的验证码
  const renderCaptcha = () => {
    switch (type) {
      case 'image':
        return (
          <div className="captcha-container">
            <canvas
              ref={canvasRef}
              style={{
                cursor: 'pointer',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                backgroundColor: '#fff',
              }}
              onClick={refreshCaptcha}
              title="点击刷新验证码"
            />
          </div>
        )
      
      case 'number':
        return (
          <div
            style={{
              width,
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f2f5',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1890ff',
              userSelect: 'none',
            }}
            onClick={refreshCaptcha}
            title="点击刷新验证码"
          >
            {captchaCode}
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Input
        value={userInput}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="请输入验证码"
        disabled={isLocked || isVerifying}
        style={{ width: 120 }}
        maxLength={length}
      />
      
      {renderCaptcha()}
      
      <Button
        icon={<ReloadOutlined />}
        onClick={refreshCaptcha}
        disabled={isLocked || isVerifying}
        title="刷新验证码"
        size="small"
      />
      
      <Button
        type="primary"
        onClick={verifyCaptcha}
        loading={isVerifying}
        disabled={isLocked || !userInput.trim()}
        size="small"
      >
        验证
      </Button>
      
      {isLocked && (
        <span style={{ color: '#ff4d4f', fontSize: '12px', marginLeft: 8 }}>
          已锁定
        </span>
      )}
      
      {attempts > 0 && !isLocked && (
        <span style={{ color: '#faad14', fontSize: '12px', marginLeft: 8 }}>
          剩余 {3 - attempts} 次
        </span>
      )}
    </div>
  )
}

export default CaptchaInput