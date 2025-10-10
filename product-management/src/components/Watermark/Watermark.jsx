import React, { useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'

const Watermark = ({ 
  children, 
  text = '商品管理系统',
  fontSize = 16,
  color = 'rgba(0,0,0,0.1)',
  angle = -30,
  spacing = { x: 200, y: 150 },
  zIndex = 9999 
}) => {
  const containerRef = useRef(null)
  const watermarkRef = useRef(null)
  const observerRef = useRef(null)
  
  const watermarkConfig = useSelector(state => state.ui.watermark)
  
  // 合并配置
  const config = {
    text: text || watermarkConfig.text,
    fontSize: fontSize || watermarkConfig.fontSize,
    color: color || watermarkConfig.color,
    angle: angle || watermarkConfig.angle,
    spacing: spacing || watermarkConfig.spacing,
    zIndex,
  }
  
  // 创建水印内容
  const createWatermarkContent = useCallback(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // 设置画布尺寸
    canvas.width = config.spacing.x
    canvas.height = config.spacing.y
    
    // 设置字体样式
    ctx.font = `${config.fontSize}px Arial, sans-serif`
    ctx.fillStyle = config.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 保存当前状态
    ctx.save()
    
    // 移动到画布中心并旋转
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((config.angle * Math.PI) / 180)
    
    // 绘制文本
    ctx.fillText(config.text, 0, 0)
    
    // 恢复状态
    ctx.restore()
    
    return canvas.toDataURL()
  }, [config])
  
  // 创建水印元素
  const createWatermarkElement = useCallback(() => {
    const watermarkData = createWatermarkContent()
    
    const watermarkElement = document.createElement('div')
    watermarkElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background-image: url(${watermarkData});
      background-repeat: repeat;
      z-index: ${config.zIndex};
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    `
    
    // 设置属性标识
    watermarkElement.setAttribute('data-watermark', 'true')
    watermarkElement.setAttribute('data-watermark-text', config.text)
    
    return watermarkElement
  }, [createWatermarkContent, config])
  
  // 更新水印
  const updateWatermark = useCallback(() => {
    if (!containerRef.current) return
    
    // 移除旧的水印
    const oldWatermark = containerRef.current.querySelector('[data-watermark="true"]')
    if (oldWatermark) {
      oldWatermark.remove()
    }
    
    // 创建新的水印
    const newWatermark = createWatermarkElement()
    containerRef.current.appendChild(newWatermark)
    watermarkRef.current = newWatermark
  }, [createWatermarkElement])
  
  // 防删除监听器
  const setupMutationObserver = useCallback(() => {
    if (!containerRef.current || !window.MutationObserver) return
    
    // 断开之前的观察器
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // 检查水印是否被删除
        if (mutation.type === 'childList') {
          const watermarkExists = containerRef.current?.querySelector('[data-watermark="true"]')
          if (!watermarkExists && containerRef.current) {
            console.warn('水印被非法删除，正在重新创建...')
            updateWatermark()
          }
        }
        
        // 检查水印样式是否被修改
        if (mutation.type === 'attributes' && mutation.target.getAttribute('data-watermark')) {
          const target = mutation.target
          if (
            target.style.display === 'none' ||
            target.style.visibility === 'hidden' ||
            target.style.opacity === '0' ||
            !target.style.backgroundImage
          ) {
            console.warn('水印样式被非法修改，正在恢复...')
            updateWatermark()
          }
        }
      })
    })
    
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    })
    
    observerRef.current = observer
  }, [updateWatermark])
  
  // 防止开发者工具删除
  const setupDevToolsProtection = useCallback(() => {
    // 检测开发者工具
    let devtools = {
      open: false,
      orientation: null
    }
    
    const threshold = 160
    
    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true
          console.warn('检测到开发者工具，水印保护已激活')
        }
      } else {
        devtools.open = false
      }
    }, 500)
    
    // 禁用右键菜单
    const handleContextMenu = (e) => {
      if (e.target.getAttribute('data-watermark')) {
        e.preventDefault()
        return false
      }
    }
    
    document.addEventListener('contextmenu', handleContextMenu)
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])
  
  // 初始化和清理
  useEffect(() => {
    updateWatermark()
    setupMutationObserver()
    const cleanupDevTools = setupDevToolsProtection()
    
    // 窗口大小变化时重新创建水印
    const handleResize = () => {
      setTimeout(updateWatermark, 100)
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      window.removeEventListener('resize', handleResize)
      cleanupDevTools()
    }
  }, [updateWatermark, setupMutationObserver, setupDevToolsProtection])
  
  // 配置变化时更新水印
  useEffect(() => {
    updateWatermark()
  }, [config.text, config.fontSize, config.color, config.angle, updateWatermark])
  
  return (
    <div
      ref={containerRef}
      className="watermark-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

export default Watermark