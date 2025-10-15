/**
 * React 自定义 Hooks 工具集合
 * 
 * 本文件提供了一系列通用的 React Hooks，用于简化常见的开发任务。
 * 
 * 功能分类：
 * - 状态管理：useLocalStorage、useFormValidation
 * - 性能优化：useDebounce、useThrottle、useVirtualList、useInfiniteScroll
 * - 异步处理：useAsync
 * - 浏览器 API 封装：useWindowSize、useMousePosition、useScrollPosition、useOnlineStatus、useClipboard
 * - 计时器：useCountdown
 * - 交互控制：useDrag
 * 
 * 总计：15 个通用 Hooks
 * 依赖：React Hooks API（useState、useEffect、useCallback、useRef）
 * 适用场景：product-management 应用的各类组件和页面
 */

/**
 * React Hooks 导入
 * @module react
 * @description
 * - useState: 状态管理基础 Hook
 * - useEffect: 副作用处理 Hook
 * - useCallback: 函数记忆化 Hook
 * - useRef: 引用持久化 Hook
 */
import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 本地存储 Hook
 * 
 * 封装 localStorage 的响应式读写操作，自动处理 JSON 序列化和反序列化，
 * 提供错误处理和降级方案。
 * 
 * @param {string} key - localStorage 的存储键名
 * @param {any} initialValue - 当 localStorage 中无数据时的默认初始值
 * @returns {[any, Function]} 返回一个数组元组
 *   - [0]: storedValue - 当前存储的值（响应式状态）
 *   - [1]: setValue - 更新存储值的函数，接受新值或更新函数作为参数
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('app-theme', 'light')
 * setTheme('dark') // 自动同步到 localStorage
 * 
 * @example
 * const [user, setUser] = useLocalStorage('user-info', null)
 * setUser({ name: '张三', role: 'admin' })
 * 
 * 使用场景：
 * - 持久化用户偏好设置（如主题、语言）
 * - 保存表单草稿数据
 * - 缓存已登录用户的 token
 * - 记录用户浏览历史
 * 
 * 注意事项：
 * - localStorage 存储容量限制为 5-10MB
 * - 仅支持同源访问
 * - 数据以字符串形式存储，复杂对象会被 JSON 序列化
 * - 发生错误时会在控制台输出警告信息并返回初始值
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

/**
 * 防抖 Hook
 * 
 * 对快速变化的值进行防抖处理，在指定时间延迟后才更新返回值。
 * 适用于需要等待用户输入完成后再执行操作的场景。
 * 
 * @param {any} value - 需要防抖的值，可以是任意类型
 * @param {number} delay - 延迟时间，单位为毫秒（ms）
 * @returns {any} 防抖后的值，在 delay 时间内值不再变化后才会更新
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 500)
 * // 用户停止输入 500ms 后才触发搜索
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchSearchResults(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 * 
 * 使用场景：
 * - 搜索框实时搜索，减少 API 请求次数
 * - 表单输入验证，等待用户输入完成
 * - 窗口大小调整监听，避免频繁重渲染
 * - 滚动位置计算，减少计算次数
 * 
 * 性能优势：
 * - 显著减少不必要的函数调用和网络请求
 * - 降低服务器负载，提升用户体验
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 节流 Hook
 * 
 * 对高频变化的值进行节流限制，确保在指定时间间隔内最多更新一次。
 * 与防抖不同，节流会在时间间隔内保证至少执行一次。
 * 
 * @param {any} value - 需要节流的值，可以是任意类型
 * @param {number} limit - 时间间隔限制，单位为毫秒（ms）
 * @returns {any} 节流后的值，每隔 limit 毫秒最多更新一次
 * 
 * @example
 * const [scrollY, setScrollY] = useState(0)
 * const throttledScrollY = useThrottle(scrollY, 200)
 * // 每 200ms 最多更新一次滚动位置
 * useEffect(() => {
 *   updateProgressBar(throttledScrollY)
 * }, [throttledScrollY])
 * 
 * 使用场景：
 * - 滚动事件处理，控制回调执行频率
 * - 鼠标移动追踪，限制位置更新频率
 * - 按钮点击防连击，避免重复提交
 * - 窗口大小调整监听，控制重渲染频率
 * 
 * 与防抖的区别：
 * - 防抖：等待值稳定后才更新，可能一直不执行
 * - 节流：在时间间隔内保证至少执行一次，定期更新
 */
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastRun = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= limit) {
        setThrottledValue(value)
        lastRun.current = Date.now()
      }
    }, limit - (Date.now() - lastRun.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

/**
 * 异步操作 Hook
 * 
 * 统一管理异步操作的执行状态、数据和错误信息，
 * 自动追踪 loading、success、error 状态，支持立即执行或手动触发。
 * 
 * @param {Function} asyncFunction - 需要执行的异步函数，必须返回 Promise
 * @param {boolean} [immediate=true] - 是否在 Hook 初始化时立即执行，默认为 true
 * @returns {Object} 包含以下属性的对象
 *   - execute: {Function} 手动执行异步函数的方法，接受任意参数
 *   - status: {string} 当前状态，可选值 'idle' | 'pending' | 'success' | 'error'
 *   - data: {any} 异步操作成功后返回的数据
 *   - error: {Error} 异步操作失败时的错误对象
 *   - isLoading: {boolean} 是否正在加载中（status === 'pending'）
 *   - isError: {boolean} 是否执行失败（status === 'error'）
 *   - isSuccess: {boolean} 是否执行成功（status === 'success'）
 * 
 * @example
 * // 立即执行的异步请求
 * const { data, isLoading, error } = useAsync(fetchUserData)
 * if (isLoading) return <Loading />
 * if (error) return <Error message={error.message} />
 * return <UserProfile data={data} />
 * 
 * @example
 * // 手动触发的异步操作
 * const { execute, isLoading } = useAsync(submitForm, false)
 * const handleSubmit = () => execute(formData)
 * 
 * 使用场景：
 * - API 数据请求，统一处理加载状态
 * - 文件上传下载，追踪进度状态
 * - 异步表单提交，管理提交状态
 * - 数据导入导出，处理长耗时操作
 * 
 * 状态流转：
 * idle → pending → success/error
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

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
      setError(error)
      setStatus('error')
      throw error
    }
  }, [asyncFunction])

  useEffect(() => {
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
 * 窗口大小 Hook
 * 
 * 监听并返回浏览器窗口的实时尺寸，自动响应窗口大小变化。
 * Hook 卸载时自动清理事件监听器，防止内存泄漏。
 * 
 * @returns {Object} 包含窗口尺寸的对象
 *   - width: {number|undefined} 窗口宽度，单位为像素（px）
 *   - height: {number|undefined} 窗口高度，单位为像素（px）
 * 
 * @example
 * const { width, height } = useWindowSize()
 * const isMobile = width < 768
 * return <div>{isMobile ? <MobileLayout /> : <DesktopLayout />}</div>
 * 
 * @example
 * // 响应式图表宽度
 * const { width } = useWindowSize()
 * <Chart width={width * 0.8} height={400} />
 * 
 * 使用场景：
 * - 响应式布局，根据窗口大小切换组件
 * - 图表自适应，动态调整图表尺寸
 * - 移动端适配，判断设备类型
 * - 分屏显示逻辑，优化大屏体验
 * 
 * 性能优化：
 * - 自动清理事件监听器，避免内存泄漏
 * - 仅在窗口大小变化时更新，减少不必要的重渲染
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

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

/**
 * 鼠标位置 Hook
 * 
 * 实时追踪鼠标在页面中的坐标位置，自动响应鼠标移动事件。
 * Hook 卸载时自动清理事件监听器。
 * 
 * @returns {Object} 包含鼠标坐标的对象
 *   - x: {number} 鼠标水平坐标，相对于视口左侧，单位 px
 *   - y: {number} 鼠标垂直坐标，相对于视口顶部，单位 px
 * 
 * @example
 * const { x, y } = useMousePosition()
 * return (
 *   <div style={{ position: 'fixed', left: x, top: y }}>
 *     自定义光标
 *   </div>
 * )
 * 
 * @example
 * // 鼠标悬浮提示定位
 * const { x, y } = useMousePosition()
 * <Tooltip x={x + 10} y={y + 10} content="提示信息" />
 * 
 * 使用场景：
 * - 自定义光标效果，跟随鼠标的动画
 * - 拖拽交互，计算拖动偏移量
 * - 悬浮提示定位，动态显示 tooltip
 * - 画布绘图应用，记录绘图轨迹
 * 
 * 注意事项：
 * - 鼠标移动是高频事件，建议结合 useThrottle 使用
 * - 返回的坐标是相对于视口的 clientX/clientY
 */
export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return mousePosition
}

/**
 * 滚动位置 Hook
 * 
 * 监听并返回页面的滚动位置，自动响应滚动事件。
 * Hook 卸载时自动清理事件监听器。
 * 
 * @returns {Object} 包含滚动偏移量的对象
 *   - x: {number} 水平滚动偏移量，单位 px
 *   - y: {number} 垂直滚动偏移量，单位 px
 * 
 * @example
 * const { y } = useScrollPosition()
 * const showBackToTop = y > 300
 * return showBackToTop && <BackToTopButton />
 * 
 * @example
 * // 滚动进度条
 * const { y } = useScrollPosition()
 * const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
 * const progress = (y / scrollHeight) * 100
 * <ProgressBar value={progress} />
 * 
 * 使用场景：
 * - “返回顶部”按钮，滚动一定距离后显示
 * - 滚动加载，接近底部时加载更多数据
 * - 阅读进度指示器，显示文章阅读进度
 * - 视差滚动效果，基于滚动位置计算动画
 * 
 * 性能优化：
 * - 滚动是高频事件，建议结合 useThrottle 使用
 * - 自动清理事件监听器，避免内存泄漏
 */
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({
        x: window.pageXOffset,
        y: window.pageYOffset,
      })
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return scrollPosition
}

/**
 * 网络状态 Hook
 * 
 * 监听并返回浏览器的网络连接状态，自动响应网络状态变化。
 * Hook 卸载时自动清理事件监听器。
 * 
 * @returns {boolean} 网络连接状态，true 表示在线，false 表示离线
 * 
 * @example
 * const isOnline = useOnlineStatus()
 * return (
 *   <div>
 *     {!isOnline && <Alert>当前网络已断开，请检查网络连接</Alert>}
 *   </div>
 * )
 * 
 * @example
 * // 网络恢复后自动重试
 * const isOnline = useOnlineStatus()
 * useEffect(() => {
 *   if (isOnline) {
 *     retryFailedRequests()
 *   }
 * }, [isOnline])
 * 
 * 使用场景：
 * - 离线提示，向用户显示网络状态
 * - 网络恢复自动重连，重新获取数据
 * - 数据同步，在线时同步本地数据
 * - 功能降级，离线时禁用某些功能
 * 
 * 注意事项：
 * - 基于 Navigator API，部分老旧浏览器可能不支持
 * - 返回在线不代表一定能访问互联网，可能只是连接到本地网络
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * 剪贴板 Hook
 * 
 * 封装浏览器剪贴板 API 的读写操作，提供简单易用的复制功能。
 * 自动检测浏览器兼容性，并提供错误处理。
 * 
 * @returns {Object} 包含剪贴板状态和操作方法的对象
 *   - value: {string} 当前复制的文本内容
 *   - success: {boolean} 最近一次复制操作是否成功（2秒后自动重置为 false）
 *   - copy: {Function} 复制文本到剪贴板的函数，接受字符串参数，返回 Promise<boolean>
 * 
 * @example
 * const { copy, success } = useClipboard()
 * const handleCopy = () => {
 *   copy('https://example.com/share')
 * }
 * return (
 *   <button onClick={handleCopy}>
 *     {success ? '已复制' : '复制链接'}
 *   </button>
 * )
 * 
 * @example
 * // 复制代码片段
 * const { copy } = useClipboard()
 * <CodeBlock code={code} onCopy={() => copy(code)} />
 * 
 * 使用场景：
 * - 一键复制链接，分享功能
 * - 代码片段复制，文档站点
 * - 联系方式复制，快速复制手机号/邮箱
 * - 口令/密钥复制，安全信息分享
 * 
 * 兼容性：
 * - 自动检测 Clipboard API 支持
 * - 不支持时在控制台输出警告信息
 * - 需要 HTTPS 或 localhost 环境
 */
export const useClipboard = () => {
  const [value, setValue] = useState('')
  const [success, setSuccess] = useState(false)

  const copy = useCallback(async (text) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported')
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setValue(text)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      return true
    } catch (error) {
      console.warn('Copy failed', error)
      setSuccess(false)
      return false
    }
  }, [])

  return { value, success, copy }
}

/**
 * 倒计时 Hook
 * 
 * 实现倒计时功能，支持开始、停止、重置操作。
 * 自动管理计时器生命周期，防止内存泄漏。
 * 
 * @param {number} initialCount - 初始倒计时数值，从此值开始倒数
 * @param {number} [interval=1000] - 倒计时间隔，单位为毫秒，默认 1000ms（1秒）
 * @returns {Object} 包含倒计时状态和控制方法的对象
 *   - count: {number} 当前倒计时数值
 *   - isActive: {boolean} 倒计时是否激活中
 *   - start: {Function} 开始倒计时的函数
 *   - stop: {Function} 停止倒计时的函数
 *   - reset: {Function} 重置倒计时的函数，恢复到初始值并停止
 * 
 * @example
 * // 验证码倒计时
 * const { count, isActive, start, reset } = useCountdown(60)
 * return (
 *   <button onClick={start} disabled={isActive}>
 *     {isActive ? `${count}s 后重新发送` : '获取验证码'}
 *   </button>
 * )
 * 
 * @example
 * // 限时抢购倒计时
 * const { count } = useCountdown(3600, 1000)
 * const hours = Math.floor(count / 3600)
 * const minutes = Math.floor((count % 3600) / 60)
 * const seconds = count % 60
 * <div>距离活动结束：{hours}:{minutes}:{seconds}</div>
 * 
 * 使用场景：
 * - 短信验证码倒计时，60秒后可重新发送
 * - 活动倒计时，显示距离活动开始/结束的时间
 * - 限时抢购，显示剩余时间
 * - 定时任务，自动执行某个操作
 * 
 * 注意事项：
 * - 倒计时到 0 时会自动停止
 * - 组件卸载时自动清理计时器，防止内存泄漏
 * - interval 为 1000ms 时表示每秒减 1，可根据需要调整
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
      intervalId = setInterval(() => {
        setCount((count) => count - 1)
      }, interval)
    } else if (count === 0) {
      setIsActive(false)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isActive, count, interval])

  return { count, isActive, start, stop, reset }
}

/**
 * 表单验证 Hook
 * 
 * 统一管理表单状态、验证规则和错误提示，支持字段级别和全表单验证。
 * 提供完整的表单状态管理和验证流程控制。
 * 
 * @param {Object} initialValues - 表单字段的初始值对象，键为字段名，值为初始值
 * @param {Object} validationRules - 验证规则对象，键为字段名，值为验证函数数组
 *   - 每个验证函数接受字段值，返回 { valid: boolean, message: string }
 * @returns {Object} 包含表单状态和操作方法的对象
 *   - values: {Object} 当前表单的所有字段值
 *   - errors: {Object} 各字段的验证错误信息，键为字段名，值为错误文本
 *   - touched: {Object} 各字段是否被操作过（失焦），用于控制错误显示时机
 *   - setValue: {Function} 设置字段值的函数，接受 (fieldName, value) 参数
 *   - setTouched: {Function} 标记字段为已操作的函数，接受 fieldName 参数
 *   - validateAll: {Function} 验证所有字段的函数，返回 boolean 表示是否全部通过
 *   - reset: {Function} 重置表单到初始状态的函数
 *   - isValid: {boolean} 当前表单是否有效（所有字段无错误）
 * 
 * @example
 * const validationRules = {
 *   email: [
 *     (value) => ({ valid: !!value, message: '邮箱不能为空' }),
 *     (value) => ({ valid: /^\S+@\S+$/.test(value), message: '邮箱格式不正确' })
 *   ],
 *   password: [
 *     (value) => ({ valid: value.length >= 6, message: '密码至少 6 位' })
 *   ]
 * }
 * 
 * const { values, errors, touched, setValue, setTouched, validateAll } = 
 *   useFormValidation({ email: '', password: '' }, validationRules)
 * 
 * const handleSubmit = () => {
 *   if (validateAll()) {
 *     submitForm(values)
 *   }
 * }
 * 
 * @example
 * // 字段失焦验证
 * <input
 *   value={values.email}
 *   onChange={(e) => setValue('email', e.target.value)}
 *   onBlur={() => setTouched('email')}
 * />
 * {touched.email && errors.email && <span>{errors.email}</span>}
 * 
 * 使用场景：
 * - 复杂表单验证，统一管理多个字段
 * - 多步骤表单，分步验证和提交
 * - 动态表单字段，灵活添加验证规则
 * - 实时验证反馈，提升用户体验
 * 
 * 验证时机：
 * - 字段失焦时触发单字段验证（setTouched）
 * - 表单提交时触发全表单验证（validateAll）
 * - setValue 时如果字段已 touched 则自动验证
 */
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validate = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName]
    if (!rules) return ''

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
    
    if (touched[fieldName]) {
      const error = validate(fieldName, value)
      setErrors(prev => ({ ...prev, [fieldName]: error }))
    }
  }, [validate, touched])

  const setTouched = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    
    const error = validate(fieldName, values[fieldName])
    setErrors(prev => ({ ...prev, [fieldName]: error }))
  }, [validate, values])

  const validateAll = useCallback(() => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(fieldName => {
      const error = validate(fieldName, values[fieldName])
      newErrors[fieldName] = error
      if (error) isValid = false
    })

    setErrors(newErrors)
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
 * 拖拽 Hook
 * 
 * 管理拖拽操作的状态，跟踪拖拽中的项目和拖拽状态。
 * 提供简单的 API 来启动和结束拖拽操作。
 * 
 * @returns {Object} 包含拖拽状态和控制方法的对象
 *   - isDragging: {boolean} 是否正在拖拽中
 *   - draggedItem: {any} 当前被拖拽的项目数据，未拖拽时为 null
 *   - dragStart: {Function} 开始拖拽的函数，接受要拖拽的项目作为参数
 *   - dragEnd: {Function} 结束拖拽的函数，清空拖拽状态
 * 
 * @example
 * const { isDragging, draggedItem, dragStart, dragEnd } = useDrag()
 * 
 * return (
 *   <div>
 *     {items.map(item => (
 *       <div
 *         key={item.id}
 *         draggable
 *         onDragStart={() => dragStart(item)}
 *         onDragEnd={dragEnd}
 *         style={{ opacity: isDragging && draggedItem?.id === item.id ? 0.5 : 1 }}
 *       >
 *         {item.name}
 *       </div>
 *     ))}
 *   </div>
 * )
 * 
 * @example
 * // 看板任务拖拽
 * const { draggedItem, dragStart, dragEnd } = useDrag()
 * const handleDrop = (targetColumn) => {
 *   if (draggedItem) {
 *     moveTask(draggedItem.id, targetColumn)
 *   }
 *   dragEnd()
 * }
 * 
 * 使用场景：
 * - 列表项拖拽排序，调整项目顺序
 * - 看板任务移动，在不同列之间拖动
 * - 文件上传拖拽，拖放文件到上传区
 * - 画布元素拖动，拖动图形元素
 * 
 * 注意事项：
 * - 需要配合 HTML5 Drag and Drop API 使用
 * - draggedItem 可以存储任意类型的数据
 * - 建议结合 onDragOver 和 onDrop 事件处理器使用
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
 * 虚拟列表 Hook
 * 
 * 实现大列表的虚拟滚动渲染，仅渲染可见区域的列表项，大幅提升性能。
 * 自动计算可见项、总高度和偏移量。
 * 
 * @param {Array} items - 完整的数据列表数组
 * @param {number} containerHeight - 容器可见高度，单位 px
 * @param {number} itemHeight - 单个列表项的高度，单位 px（必须固定高度）
 * @returns {Object} 包含虚拟列表数据和控制方法的对象
 *   - visibleItems: {Array} 当前可见区域内的列表项，每项包含原始数据和 index 属性
 *   - totalHeight: {number} 列表总高度，用于设置容器内部高度，单位 px
 *   - offsetY: {number} 可见项的垂直偏移量，用于定位列表项，单位 px
 *   - onScroll: {Function} 滚动事件处理函数，需要绑定到容器的 onScroll 事件
 * 
 * @example
 * const { visibleItems, totalHeight, offsetY, onScroll } = 
 *   useVirtualList(largeDataList, 600, 50)
 * 
 * return (
 *   <div style={{ height: 600, overflow: 'auto' }} onScroll={onScroll}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       <div style={{ transform: `translateY(${offsetY}px)` }}>
 *         {visibleItems.map(item => (
 *           <div key={item.index} style={{ height: 50 }}>
 *             {item.name}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 * )
 * 
 * @example
 * // 表格虚拟滚动
 * const { visibleItems, totalHeight, offsetY, onScroll } = 
 *   useVirtualList(tableData, 500, 40)
 * 
 * 使用场景：
 * - 长列表渲染，数千条数据的列表
 * - 大型表格分页，优化渲染性能
 * - 聊天记录展示，大量消息历史
 * - 日志查看器，海量日志数据
 * 
 * 性能提升：
 * - 仅渲染可见区域内的元素，通常只有10-20个 DOM 节点
 * - 大幅减少 DOM 节点数量，提升渲染性能
 * - 滚动流畅，无卡顿
 * 
 * 注意事项：
 * - 要求每个列表项高度固定，不支持变高项
 * - visibleItems 的 index 属性为在原数组中的索引，建议用作 key
 */
export const useVirtualList = (items, containerHeight, itemHeight) => {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  )

  const visibleItems = items.slice(visibleStart, visibleEnd + 1).map((item, index) => ({
    ...item,
    index: visibleStart + index,
  }))

  const totalHeight = items.length * itemHeight
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
 * 无限滚动 Hook
 * 
 * 实现无限滚动加载功能，当用户滚动接近页面底部时自动加载更多数据。
 * 自动管理加载状态，防止重复加载。
 * 
 * @param {Function} fetchMore - 加载更多数据的异步函数，返回 Promise
 * @param {boolean} [hasMore=true] - 是否还有更多数据可加载，默认为 true
 * @returns {Object} 包含加载状态和控制方法的对象
 *   - isLoading: {boolean} 是否正在加载中
 *   - loadMore: {Function} 手动触发加载更多的函数
 * 
 * @example
 * const [items, setItems] = useState([])
 * const [hasMore, setHasMore] = useState(true)
 * 
 * const fetchMore = async () => {
 *   const newData = await api.getProducts({ page: currentPage })
 *   setItems(prev => [...prev, ...newData.items])
 *   setHasMore(newData.hasMore)
 * }
 * 
 * const { isLoading } = useInfiniteScroll(fetchMore, hasMore)
 * 
 * return (
 *   <div>
 *     {items.map(item => <ProductCard key={item.id} {...item} />)}
 *     {isLoading && <Loading />}
 *     {!hasMore && <div>没有更多数据了</div>}
 *   </div>
 * )
 * 
 * @example
 * // 手动加载更多
 * const { isLoading, loadMore } = useInfiniteScroll(fetchMore, hasMore)
 * <button onClick={loadMore} disabled={isLoading}>
 *   {isLoading ? '加载中...' : '加载更多'}
 * </button>
 * 
 * 使用场景：
 * - 信息流展示，滚动自动加载更多内容
 * - 商品列表，滚动加载下一页商品
 * - 社交动态，无限滚动查看更多动态
 * - 搜索结果页，分页加载搜索结果
 * 
 * 触发条件：
 * - 当滚动距离页面底部小于 1000px 时自动触发加载
 * - 正在加载时不会重复触发
 * - hasMore 为 false 时不会触发加载
 * 
 * 性能优化：
 * - 自动防止重复加载
 * - 组件卸载时自动清理滚动监听器
 * - 建议结合节流优化滚动事件处理
 */
export const useInfiniteScroll = (fetchMore, hasMore = true) => {
  const [isLoading, setIsLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      await fetchMore()
    } catch (error) {
      console.error('Error loading more items:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchMore, hasMore, isLoading])

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  return { isLoading, loadMore }
}