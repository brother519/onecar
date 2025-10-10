// 格式化货币
export const formatCurrency = (amount, currency = 'CNY', locale = 'zh-CN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// 格式化数字
export const formatNumber = (number, locale = 'zh-CN') => {
  return new Intl.NumberFormat(locale).format(number)
}

// 格式化日期
export const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

// 相对时间格式化
export const formatRelativeTime = (date) => {
  if (!date) return '-'
  
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return formatDate(date, 'YYYY-MM-DD')
}

// 文件大小格式化
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 防抖函数
export const debounce = (func, wait, immediate = false) => {
  let timeout
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 深拷贝
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  
  const cloned = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  
  return cloned
}

// 生成唯一ID
export const generateId = (prefix = 'id') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 下载文件
export const downloadFile = (data, filename, type = 'application/octet-stream') => {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// 复制到剪贴板
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    
    try {
      document.execCommand('copy')
      return true
    } catch (err) {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

// 获取图片颜色主题
export const getImageDominantColor = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      let r = 0, g = 0, b = 0
      const length = data.length
      
      for (let i = 0; i < length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }
      
      const pixelCount = length / 4
      r = Math.floor(r / pixelCount)
      g = Math.floor(g / pixelCount)
      b = Math.floor(b / pixelCount)
      
      resolve(`rgb(${r}, ${g}, ${b})`)
    }
    
    img.onerror = reject
    img.src = imageUrl
  })
}

// 验证函数
export const validators = {
  required: (value, message = '此字段为必填项') => {
    if (value === undefined || value === null || value === '') {
      return { valid: false, message }
    }
    return { valid: true }
  },
  
  email: (value, message = '请输入有效的邮箱地址') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (value && !emailRegex.test(value)) {
      return { valid: false, message }
    }
    return { valid: true }
  },
  
  phone: (value, message = '请输入有效的手机号码') => {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (value && !phoneRegex.test(value)) {
      return { valid: false, message }
    }
    return { valid: true }
  },
  
  minLength: (value, min, message) => {
    if (value && value.length < min) {
      return { valid: false, message: message || `长度不能少于${min}个字符` }
    }
    return { valid: true }
  },
  
  maxLength: (value, max, message) => {
    if (value && value.length > max) {
      return { valid: false, message: message || `长度不能超过${max}个字符` }
    }
    return { valid: true }
  },
  
  range: (value, min, max, message) => {
    if (value !== undefined && value !== null) {
      const num = Number(value)
      if (isNaN(num) || num < min || num > max) {
        return { valid: false, message: message || `值必须在${min}到${max}之间` }
      }
    }
    return { valid: true }
  },
}

// 本地存储工具
export const storage = {
  set: (key, value, expiry = null) => {
    const data = {
      value,
      expiry: expiry ? Date.now() + expiry : null,
    }
    localStorage.setItem(key, JSON.stringify(data))
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      if (!item) return defaultValue
      
      const data = JSON.parse(item)
      
      if (data.expiry && Date.now() > data.expiry) {
        localStorage.removeItem(key)
        return defaultValue
      }
      
      return data.value
    } catch {
      return defaultValue
    }
  },
  
  remove: (key) => {
    localStorage.removeItem(key)
  },
  
  clear: () => {
    localStorage.clear()
  },
}

// URL参数工具
export const urlParams = {
  get: (param) => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(param)
  },
  
  set: (params) => {
    const url = new URL(window.location)
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        url.searchParams.delete(key)
      } else {
        url.searchParams.set(key, value)
      }
    })
    window.history.replaceState({}, '', url)
  },
  
  getAll: () => {
    const urlParams = new URLSearchParams(window.location.search)
    const params = {}
    for (const [key, value] of urlParams) {
      params[key] = value
    }
    return params
  },
}

// 设备检测
export const device = {
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },
  
  isTablet: () => {
    return /iPad|Android/i.test(navigator.userAgent) && !window.MSStream
  },
  
  isDesktop: () => {
    return !device.isMobile() && !device.isTablet()
  },
  
  getScreenSize: () => {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1200) return 'tablet'
    return 'desktop'
  },
}