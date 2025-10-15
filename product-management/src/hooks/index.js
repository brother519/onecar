import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 本地存储状态管理 Hook
 * 
 * 封装本地存储的读写操作，自动处理 JSON 序列化和反序列化
 * 
 * @param {string} key - localStorage 中的键名
 * @param {*} initialValue - 键不存在时的默认值，类型任意
 * @returns {[*, Function]} 返回 [storedValue, setValue] 数组，其中 storedValue 为当前存储的值，setValue 为更新存储值的函数
 * 
 * @example
 * const [user, setUser] = useLocalStorage('user', { name: '' })
 * setUser({ name: '张三' })
 */
export const useLocalStorage = (key, initialValue) => {
  // 初始化状态：尝试从 localStorage 读取数据
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // 读取失败时返回初始值
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // 更新值并同步到 localStorage
  const setValue = useCallback((value) => {
    try {
      // 支持函数式更新
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      // 同步写入 localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

/**
 * 值防抖处理 Hook
 * 
 * 对快速变化的值进行防抖处理，在指定延迟时间内值变化会重置定时器
 * 
 * @param {*} value - 需要防抖的值，类型任意
 * @param {number} delay - 防抖延迟时间，单位毫秒
 * @returns {*} 防抖后的值
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebounce(searchTerm, 500)
 * // debouncedSearchTerm 会在用户停止输入 500ms 后更新
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // 设置延迟定时器
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 清理函数：值变化时清除上一个定时器
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 值节流处理 Hook
 * 
 * 对快速变化的值进行节流处理，限制更新频率
 * 
 * @param {*} value - 需要节流的值，类型任意
 * @param {number} limit - 节流时间限制，单位毫秒
 * @returns {*} 节流后的值
 */
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value)
  // 记录上次执行时间
  const lastRun = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      // 检查是否超过时间限制
      if (Date.now() - lastRun.current >= limit) {
        setThrottledValue(value)
        lastRun.current = Date.now()
      }
    }, limit - (Date.now() - lastRun.current))

    // 清理定时器
    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

/**
 * 异步操作状态管理 Hook
 * 
 * 管理异步操作的执行状态和结果，追踪 pending、success、error 三种状态
 * 
 * @param {Function} asyncFunction - 要执行的异步函数
 * @param {boolean} immediate - 是否立即执行，默认 true
 * @returns {{execute: Function, status: string, data: *, error: Error, isLoading: boolean, isError: boolean, isSuccess: boolean}} 异步操作状态对象
 * 
 * @example
 * const { data, isLoading, isError, execute } = useAsync(async () => {
 *   const response = await fetch('/api/data')
 *   return response.json()
 * })
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  // 执行异步函数
  const execute = useCallback(async (...args) => {
    setStatus('pending')
    setData(null)
    setError(null)

    try {
      const response = await asyncFunction(...args)
      setData(response)
      setStatus('success')
      return response
    } catch (error) {
      // 捕获异步函数执行错误
      setError(error)
      setStatus('error')
      throw error
    }
  }, [asyncFunction])

  useEffect(() => {
    // 如果设置了立即执行，则在组件挂载时执行
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    execute,
    status,
    data,
    error,
    isLoading: status === 'pending',
    isError: status === 'error',
    isSuccess: status === 'success',
  }
}

/**
 * 窗口尺寸监听 Hook
 * 
 * 监听并返回窗口尺寸变化
 * 
 * @returns {{width: number, height: number}} 窗口尺寸对象，包含宽度和高度
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // 监听窗口尺寸变化事件
    window.addEventListener('resize', handleResize)
    // 组件挂载时立即获取初始尺寸
    handleResize()

    // 清理事件监听器
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

/**
 * 鼠标位置追踪 Hook
 * 
 * 实时追踪鼠标位置坐标
 * 
 * @returns {{x: number, y: number}} 鼠标位置对象，包含横坐标和纵坐标
 */
export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event) => {
      // 记录鼠标的 clientX 和 clientY 坐标
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    // 监听鼠标移动事件
    window.addEventListener('mousemove', handleMouseMove)

    // 清理事件监听器
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return mousePosition
}

/**
 * 滚动位置监听 Hook
 * 
 * 监听并返回页面滚动位置
 * 
 * @returns {{x: number, y: number}} 滚动位置对象，包含水平和垂直滚动距离
 */
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => {
      // 读取页面滚动偏移量
      setScrollPosition({
        x: window.pageXOffset,
        y: window.pageYOffset,
      })
    }

    // 监听滚动事件
    window.addEventListener('scroll', handleScroll)
    // 组件挂载时立即获取初始滚动位置
    handleScroll()

    // 清理事件监听器
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return scrollPosition
}

/**
 * 网络状态检测 Hook
 * 
 * 检测并监听网络连接状态变化
 * 
 * @returns {boolean} 网络状态，true 表示在线，false 表示离线
 */
export const useOnlineStatus = () => {
  // 初始值从浏览器获取当前网络状态
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // 监听网络状态变化事件
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 清理事件监听器
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * 剪贴板操作 Hook
 * 
 * 提供剪贴板复制功能，使用 Clipboard API 实现
 * 
 * @returns {{value: string, success: boolean, copy: Function}} 剪贴板操作对象
 */
export const useClipboard = () => {
  const [value, setValue] = useState('')
  const [success, setSuccess] = useState(false)

  const copy = useCallback(async (text) => {
    // 检查浏览器是否支持 Clipboard API
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported')
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setValue(text)
      setSuccess(true)
      // 2 秒后重置 success 状态
      setTimeout(() => setSuccess(false), 2000)
      return true
    } catch (error) {
      // 复制失败时的错误处理
      console.warn('Copy failed', error)
      setSuccess(false)
      return false
    }
  }, [])

  return { value, success, copy }
}

/**
 * 倒计时管理 Hook
 * 
 * 提供倒计时功能，支持启动、停止、重置操作
 * 
 * @param {number} initialCount - 初始倒计时值
 * @param {number} interval - 倒计时间隔，单位毫秒，默认 1000
 * @returns {{count: number, isActive: boolean, start: Function, stop: Function, reset: Function}} 倒计时控制对象
 */
export const useCountdown = (initialCount, interval = 1000) => {
  const [count, setCount] = useState(initialCount)
  const [isActive, setIsActive] = useState(false)

  const start = useCallback(() => setIsActive(true), [])
  const stop = useCallback(() => setIsActive(false), [])
  const reset = useCallback(() => {
    setCount(initialCount)
    setIsActive(false)
  }, [initialCount])

  useEffect(() => {
    let intervalId = null

    if (isActive && count > 0) {
      // 启动倒计时定时器
      intervalId = setInterval(() => {
        setCount((count) => count - 1)
      }, interval)
    } else if (count === 0) {
      // 倒计时结束时自动停止
      setIsActive(false)
    }

    // 清理定时器
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isActive, count, interval])

  return { count, isActive, start, stop, reset }
}

/**
 * 表单验证管理 Hook
 * 
 * 管理表单字段的值、错误信息和触摸状态，支持单字段验证和全量验证
 * 
 * @param {Object} initialValues - 表单字段初始值对象
 * @param {Object} validationRules - 验证规则对象，键为字段名，值为规则函数数组
 * @returns {{values: Object, errors: Object, touched: Object, setValue: Function, setTouched: Function, validateAll: Function, reset: Function, isValid: boolean}} 表单验证管理对象
 * 
 * @example
 * const { values, errors, setValue, validateAll } = useFormValidation(
 *   { username: '', email: '' },
 *   {
 *     username: [(v) => ({ valid: v.length > 0, message: '用户名不能为空' })],
 *     email: [(v) => ({ valid: /\S+@\S+/.test(v), message: '邮箱格式不正确' })]
 *   }
 * )
 */
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // 验证单个字段
  const validate = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName]
    if (!rules) return ''

    // 执行所有验证规则
    for (const rule of rules) {
      const result = rule(value)
      if (!result.valid) {
        return result.message
      }
    }
    return ''
  }, [validationRules])

  const setValue = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    
    // 仅对已触摸的字段进行验证
    if (touched[fieldName]) {
      const error = validate(fieldName, value)
      setErrors(prev => ({ ...prev, [fieldName]: error }))
    }
  }, [validate, touched])

  const setTouched = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    
    // 标记为触摸时立即验证该字段
    const error = validate(fieldName, values[fieldName])
    setErrors(prev => ({ ...prev, [fieldName]: error }))
  }, [validate, values])

  // 验证所有字段
  const validateAll = useCallback(() => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(fieldName => {
      const error = validate(fieldName, values[fieldName])
      newErrors[fieldName] = error
      if (error) isValid = false
    })

    setErrors(newErrors)
    // 标记所有字段为已触摸
    setTouched(Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {}))

    return isValid
  }, [validate, values, validationRules])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateAll,
    reset,
    isValid: Object.values(errors).every(error => !error),
  }
}

/**
 * 拖拽状态管理 Hook
 * 
 * 提供拖拽开始和结束的状态控制方法
 * 
 * @returns {{isDragging: boolean, draggedItem: *, dragStart: Function, dragEnd: Function}} 拖拽状态管理对象
 */
export const useDrag = () => {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)

  const dragStart = useCallback((item) => {
    setIsDragging(true)
    setDraggedItem(item)
  }, [])

  const dragEnd = useCallback(() => {
    setIsDragging(false)
    setDraggedItem(null)
  }, [])

  return {
    isDragging,
    draggedItem,
    dragStart,
    dragEnd,
  }
}

/**
 * 虚拟列表计算 Hook
 * 
 * 根据滚动位置计算可见范围，仅渲染视口内的项目，实现视觉连续性
 * 
 * @param {Array} items - 完整的数据项列表
 * @param {number} containerHeight - 可视容器高度，单位像素
 * @param {number} itemHeight - 单个列表项高度，单位像素
 * @returns {{visibleItems: Array, totalHeight: number, offsetY: number, onScroll: Function}} 虚拟列表状态对象
 */
export const useVirtualList = (items, containerHeight, itemHeight) => {
  const [scrollTop, setScrollTop] = useState(0)

  // 计算可见区域的起始索引
  const visibleStart = Math.floor(scrollTop / itemHeight)
  // 计算可见区域的结束索引
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  )

  // 提取可见范围内的数据项
  const visibleItems = items.slice(visibleStart, visibleEnd + 1).map((item, index) => ({
    ...item,
    index: visibleStart + index,
  }))

  // 计算列表总高度
  const totalHeight = items.length * itemHeight
  // 计算垂直偏移量
  const offsetY = visibleStart * itemHeight

  const onScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
  }
}

/**
 * 无限滚动加载 Hook
 * 
 * 监听滚动事件，当接近页面底部时自动触发加载更多数据
 * 
 * @param {Function} fetchMore - 加载更多数据的异步函数
 * @param {boolean} hasMore - 是否还有更多数据可加载，默认 true
 * @returns {{isLoading: boolean, loadMore: Function}} 无限滚动状态对象
 */
export const useInfiniteScroll = (fetchMore, hasMore = true) => {
  const [isLoading, setIsLoading] = useState(false)

  const loadMore = useCallback(async () => {
    // 防止重复加载
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      await fetchMore()
    } catch (error) {
      // 加载失败时的错误处理
      console.error('Error loading more items:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchMore, hasMore, isLoading])

  useEffect(() => {
    const handleScroll = () => {
      // 检查是否滚动到接近底部（距离底部 1000px 时触发）
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMore()
      }
    }

    // 监听滚动事件
    window.addEventListener('scroll', handleScroll)
    // 清理事件监听器
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  return { isLoading, loadMore }
}