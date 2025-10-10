import React, { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// 懒加载组件包装器
export const createLazyComponent = (importFunc, fallback = <Spin size="large" />) => {
  const LazyComponent = lazy(importFunc)
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

// 错误边界组件
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    })
    
    // 这里可以记录错误到日志服务
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '6px',
          margin: '20px',
        }}>
          <h2 style={{ color: '#ff4d4f' }}>出错了</h2>
          <p style={{ color: '#666' }}>页面加载过程中发生了错误，请刷新页面重试。</p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ textAlign: 'left', marginTop: '20px' }}>
              <summary>错误详情</summary>
              <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// 图片懒加载组件
export const LazyImage = ({ src, alt, placeholder, className, style, ...props }) => {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const imgRef = React.useRef(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  return (
    <div ref={imgRef} className={className} style={style}>
      {isInView && (
        <>
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
              ...style,
            }}
            {...props}
          />
          {!isLoaded && placeholder && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5',
                ...style,
              }}
            >
              {placeholder}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// 虚拟滚动优化组件
export const VirtualScrollOptimizer = ({ 
  children, 
  itemHeight, 
  containerHeight, 
  items,
  renderItem,
  overscan = 5 
}) => {
  const [scrollTop, setScrollTop] = React.useState(0)
  const scrollElementRef = React.useRef(null)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = []
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({
      index: i,
      item: items[i],
      offsetTop: i * itemHeight,
    })
  }

  const totalHeight = items.length * itemHeight

  const handleScroll = React.useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  return (
    <div
      ref={scrollElementRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, item, offsetTop }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offsetTop,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// 内存优化的大列表组件
export const OptimizedList = React.memo(({ 
  items, 
  renderItem, 
  keyExtractor,
  chunkSize = 50,
  loadMoreThreshold = 10,
  onLoadMore,
}) => {
  const [visibleChunks, setVisibleChunks] = React.useState(1)
  const listRef = React.useRef(null)

  const visibleItems = items.slice(0, visibleChunks * chunkSize)

  React.useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = listRef.current
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

      if (scrollPercentage > 0.8 && visibleChunks * chunkSize < items.length) {
        setVisibleChunks(prev => prev + 1)
      }

      if (items.length - visibleItems.length <= loadMoreThreshold) {
        onLoadMore && onLoadMore()
      }
    }

    const element = listRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [items.length, visibleChunks, chunkSize, loadMoreThreshold, onLoadMore, visibleItems.length])

  return (
    <div ref={listRef} style={{ height: '100%', overflow: 'auto' }}>
      {visibleItems.map((item, index) => (
        <div key={keyExtractor ? keyExtractor(item, index) : index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
})

// 防抖搜索组件
export const DebouncedSearch = React.memo(({ 
  onSearch, 
  delay = 300, 
  placeholder = '搜索...',
  ...props 
}) => {
  const [value, setValue] = React.useState('')
  const timeoutRef = React.useRef(null)

  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(value)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay, onSearch])

  const handleChange = (e) => {
    setValue(e.target.value)
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      {...props}
    />
  )
})

// 缓存组件包装器
export const withCache = (WrappedComponent, cacheKey) => {
  const cache = new Map()

  return React.memo((props) => {
    const key = typeof cacheKey === 'function' ? cacheKey(props) : JSON.stringify(props)
    
    if (cache.has(key)) {
      return cache.get(key)
    }

    const element = <WrappedComponent {...props} />
    cache.set(key, element)

    // 限制缓存大小
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    return element
  })
}

// 渲染优化的高阶组件
export const withRenderOptimization = (WrappedComponent) => {
  return React.memo(WrappedComponent, (prevProps, nextProps) => {
    // 自定义比较逻辑
    return JSON.stringify(prevProps) === JSON.stringify(nextProps)
  })
}

// 异步数据加载组件
export const AsyncDataLoader = ({ 
  loadData, 
  deps = [], 
  fallback = <Spin />, 
  errorFallback,
  children 
}) => {
  const [state, setState] = React.useState({
    data: null,
    loading: true,
    error: null,
  })

  React.useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        const data = await loadData()
        
        if (!cancelled) {
          setState({ data, loading: false, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState({ data: null, loading: false, error })
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, deps)

  if (state.loading) return fallback
  if (state.error) return errorFallback ? errorFallback(state.error) : <div>Error: {state.error.message}</div>
  
  return children(state.data)
}

// 性能监控组件
export const PerformanceMonitor = ({ children, name }) => {
  React.useEffect(() => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (duration > 100) { // 只记录超过100ms的渲染
        console.warn(`Slow render detected for ${name}: ${duration.toFixed(2)}ms`)
      }
    }
  })

  return children
}