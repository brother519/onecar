/**
 * React Custom Hooks Collection
 * 
 * This file provides a set of common React Hooks to simplify common development tasks.
 * 
 * Categories:
 * - State Management: useLocalStorage, useFormValidation
 * - Performance Optimization: useDebounce, useThrottle, useVirtualList, useInfiniteScroll
 * - Async Handling: useAsync
 * - Browser API Wrapper: useWindowSize, useMousePosition, useScrollPosition, useOnlineStatus, useClipboard
 * - Timer: useCountdown
 * - Interaction Control: useDrag
 * 
 * Total: 15 common Hooks
 * Dependencies: React Hooks API (useState, useEffect, useCallback, useRef)
 * Use Cases: Various components and pages in the product-management application
 */

/**
 * React Hooks Imports
 * @module react
 * @description
 * - useState: Basic state management Hook
 * - useEffect: Side effect handling Hook
 * - useCallback: Function memoization Hook
 * - useRef: Reference persistence Hook
 */
import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Local Storage Hook
 * 
 * Encapsulates reactive read/write operations for localStorage with automatic JSON serialization/deserialization,
 * providing error handling and fallback mechanisms.
 * 
 * @param {string} key - The storage key name for localStorage
 * @param {any} initialValue - The default initial value when no data exists in localStorage
 * @returns {[any, Function]} Returns an array tuple
 *   - [0]: storedValue - The current stored value (reactive state)
 *   - [1]: setValue - Function to update the stored value, accepts new value or updater function
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('app-theme', 'light')
 * setTheme('dark') // Automatically syncs to localStorage
 * 
 * @example
 * const [user, setUser] = useLocalStorage('user-info', null)
 * setUser({ name: 'John', role: 'admin' })
 * 
 * Use Cases:
 * - Persist user preferences (theme, language)
 * - Save form draft data
 * - Cache logged-in user's token
 * - Record user browsing history
 * 
 * Notes:
 * - localStorage storage capacity is limited to 5-10MB
 * - Only supports same-origin access
 * - Data is stored as strings, complex objects are JSON serialized
 * - Errors output warnings to console and return initial value
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
 * Debounce Hook
 * 
 * Debounces rapidly changing values, updating the return value only after the specified delay.
 * Suitable for scenarios where you need to wait for user input to complete before executing operations.
 * 
 * @param {any} value - The value to debounce, can be any type
 * @param {number} delay - Delay time in milliseconds (ms)
 * @returns {any} The debounced value, updates only after the value stops changing for the delay period
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 500)
 * // Triggers search 500ms after user stops typing
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchSearchResults(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 * 
 * Use Cases:
 * - Real-time search box, reducing API request frequency
 * - Form input validation, waiting for user to finish typing
 * - Window resize monitoring, avoiding frequent re-renders
 * - Scroll position calculation, reducing computation frequency
 * 
 * Performance Benefits:
 * - Significantly reduces unnecessary function calls and network requests
 * - Reduces server load and improves user experience
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
 * Throttle Hook
 * 
 * Throttles high-frequency changing values, ensuring updates occur at most once per specified interval.
 * Unlike debounce, throttle guarantees at least one execution within the time interval.
 * 
 * @param {any} value - The value to throttle, can be any type
 * @param {number} limit - Time interval limit in milliseconds (ms)
 * @returns {any} The throttled value, updates at most once per limit milliseconds
 * 
 * @example
 * const [scrollY, setScrollY] = useState(0)
 * const throttledScrollY = useThrottle(scrollY, 200)
 * // Updates scroll position at most once every 200ms
 * useEffect(() => {
 *   updateProgressBar(throttledScrollY)
 * }, [throttledScrollY])
 * 
 * Use Cases:
 * - Scroll event handling, controlling callback execution frequency
 * - Mouse movement tracking, limiting position update frequency
 * - Button click throttling, preventing duplicate submissions
 * - Window resize monitoring, controlling re-render frequency
 * 
 * Difference from Debounce:
 * - Debounce: Updates only after value stabilizes, may never execute
 * - Throttle: Guarantees at least one execution within interval, periodic updates
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
 * Async Operation Hook
 * 
 * Manages async operation execution state, data, and error information uniformly.
 * Automatically tracks loading, success, and error states, supports immediate or manual execution.
 * 
 * @param {Function} asyncFunction - The async function to execute, must return a Promise
 * @param {boolean} [immediate=true] - Whether to execute immediately on Hook initialization, defaults to true
 * @returns {Object} Object containing the following properties
 *   - execute: {Function} Method to manually execute the async function, accepts any arguments
 *   - status: {string} Current status, values: 'idle' | 'pending' | 'success' | 'error'
 *   - data: {any} Data returned after successful async operation
 *   - error: {Error} Error object when async operation fails
 *   - isLoading: {boolean} Whether currently loading (status === 'pending')
 *   - isError: {boolean} Whether execution failed (status === 'error')
 *   - isSuccess: {boolean} Whether execution succeeded (status === 'success')
 * 
 * @example
 * // Immediately executed async request
 * const { data, isLoading, error } = useAsync(fetchUserData)
 * if (isLoading) return <Loading />
 * if (error) return <Error message={error.message} />
 * return <UserProfile data={data} />
 * 
 * @example
 * // Manually triggered async operation
 * const { execute, isLoading } = useAsync(submitForm, false)
 * const handleSubmit = () => execute(formData)
 * 
 * Use Cases:
 * - API data requests with unified loading state handling
 * - File upload/download with progress tracking
 * - Async form submission with state management
 * - Data import/export for long-running operations
 * 
 * State Flow:
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
 * Window Size Hook
 * 
 * Monitors and returns the browser window's real-time dimensions, automatically responding to window size changes.
 * Automatically cleans up event listeners on Hook unmount to prevent memory leaks.
 * 
 * @returns {Object} Object containing window dimensions
 *   - width: {number|undefined} Window width in pixels (px)
 *   - height: {number|undefined} Window height in pixels (px)
 * 
 * @example
 * const { width, height } = useWindowSize()
 * const isMobile = width < 768
 * return <div>{isMobile ? <MobileLayout /> : <DesktopLayout />}</div>
 * 
 * @example
 * // Responsive chart width
 * const { width } = useWindowSize()
 * <Chart width={width * 0.8} height={400} />
 * 
 * Use Cases:
 * - Responsive layouts, switching components based on window size
 * - Chart adaptation, dynamically adjusting chart dimensions
 * - Mobile adaptation, detecting device type
 * - Split screen display logic, optimizing large screen experience
 * 
 * Performance Optimization:
 * - Automatically cleans up event listeners to prevent memory leaks
 * - Updates only on window size change, reducing unnecessary re-renders
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
 * Mouse Position Hook
 * 
 * Tracks mouse coordinates in real-time on the page, automatically responding to mouse move events.
 * Automatically cleans up event listeners on Hook unmount.
 * 
 * @returns {Object} Object containing mouse coordinates
 *   - x: {number} Mouse horizontal coordinate, relative to viewport left, in px
 *   - y: {number} Mouse vertical coordinate, relative to viewport top, in px
 * 
 * @example
 * const { x, y } = useMousePosition()
 * return (
 *   <div style={{ position: 'fixed', left: x, top: y }}>
 *     Custom Cursor
 *   </div>
 * )
 * 
 * @example
 * // Tooltip positioning
 * const { x, y } = useMousePosition()
 * <Tooltip x={x + 10} y={y + 10} content="Tooltip info" />
 * 
 * Use Cases:
 * - Custom cursor effects, animations following the mouse
 * - Drag interactions, calculating drag offsets
 * - Tooltip positioning, dynamically displaying tooltips
 * - Canvas drawing applications, recording drawing paths
 * 
 * Notes:
 * - Mouse move is a high-frequency event, recommend using with useThrottle
 * - Returned coordinates are viewport-relative clientX/clientY
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
 * Scroll Position Hook
 * 
 * Monitors and returns page scroll position, automatically responding to scroll events.
 * Automatically cleans up event listeners on Hook unmount.
 * 
 * @returns {Object} Object containing scroll offsets
 *   - x: {number} Horizontal scroll offset in px
 *   - y: {number} Vertical scroll offset in px
 * 
 * @example
 * const { y } = useScrollPosition()
 * const showBackToTop = y > 300
 * return showBackToTop && <BackToTopButton />
 * 
 * @example
 * // Scroll progress bar
 * const { y } = useScrollPosition()
 * const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
 * const progress = (y / scrollHeight) * 100
 * <ProgressBar value={progress} />
 * 
 * Use Cases:
 * - "Back to top" button, showing after scrolling a certain distance
 * - Infinite scroll loading, loading more data near bottom
 * - Reading progress indicator, showing article reading progress
 * - Parallax scrolling effects, calculating animations based on scroll position
 * 
 * Performance Optimization:
 * - Scrolling is a high-frequency event, recommend using with useThrottle
 * - Automatically cleans up event listeners to prevent memory leaks
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
 * Online Status Hook
 * 
 * Monitors and returns the browser's network connection status, automatically responding to network status changes.
 * Automatically cleans up event listeners on Hook unmount.
 * 
 * @returns {boolean} Network connection status, true indicates online, false indicates offline
 * 
 * @example
 * const isOnline = useOnlineStatus()
 * return (
 *   <div>
 *     {!isOnline && <Alert>Network disconnected, please check your connection</Alert>}
 *   </div>
 * )
 * 
 * @example
 * // Auto-retry after network recovery
 * const isOnline = useOnlineStatus()
 * useEffect(() => {
 *   if (isOnline) {
 *     retryFailedRequests()
 *   }
 * }, [isOnline])
 * 
 * Use Cases:
 * - Offline notifications, displaying network status to users
 * - Auto-reconnect on network recovery, re-fetching data
 * - Data synchronization, syncing local data when online
 * - Feature degradation, disabling certain features when offline
 * 
 * Notes:
 * - Based on Navigator API, may not be supported in older browsers
 * - Online doesn't guarantee internet access, may just be connected to local network
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
 * Clipboard Hook
 * 
 * Encapsulates browser Clipboard API read/write operations, providing easy-to-use copy functionality.
 * Automatically detects browser compatibility and provides error handling.
 * 
 * @returns {Object} Object containing clipboard state and operation methods
 *   - value: {string} Current copied text content
 *   - success: {boolean} Whether the most recent copy operation succeeded (auto-resets to false after 2s)
 *   - copy: {Function} Function to copy text to clipboard, accepts string parameter, returns Promise<boolean>
 * 
 * @example
 * const { copy, success } = useClipboard()
 * const handleCopy = () => {
 *   copy('https://example.com/share')
 * }
 * return (
 *   <button onClick={handleCopy}>
 *     {success ? 'Copied' : 'Copy Link'}
 *   </button>
 * )
 * 
 * @example
 * // Copy code snippet
 * const { copy } = useClipboard()
 * <CodeBlock code={code} onCopy={() => copy(code)} />
 * 
 * Use Cases:
 * - One-click link copying, sharing functionality
 * - Code snippet copying, documentation sites
 * - Contact info copying, quickly copy phone/email
 * - Passphrase/key copying, secure information sharing
 * 
 * Compatibility:
 * - Automatically detects Clipboard API support
 * - Outputs warning to console when not supported
 * - Requires HTTPS or localhost environment
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
 * Countdown Hook
 * 
 * Implements countdown functionality with start, stop, and reset operations.
 * Automatically manages timer lifecycle to prevent memory leaks.
 * 
 * @param {number} initialCount - Initial countdown value, counting down from this value
 * @param {number} [interval=1000] - Countdown interval in milliseconds, defaults to 1000ms (1 second)
 * @returns {Object} Object containing countdown state and control methods
 *   - count: {number} Current countdown value
 *   - isActive: {boolean} Whether the countdown is active
 *   - start: {Function} Function to start the countdown
 *   - stop: {Function} Function to stop the countdown
 *   - reset: {Function} Function to reset the countdown, restores to initial value and stops
 * 
 * @example
 * // Verification code countdown
 * const { count, isActive, start, reset } = useCountdown(60)
 * return (
 *   <button onClick={start} disabled={isActive}>
 *     {isActive ? `Resend in ${count}s` : 'Get Code'}
 *   </button>
 * )
 * 
 * @example
 * // Flash sale countdown
 * const { count } = useCountdown(3600, 1000)
 * const hours = Math.floor(count / 3600)
 * const minutes = Math.floor((count % 3600) / 60)
 * const seconds = count % 60
 * <div>Time remaining: {hours}:{minutes}:{seconds}</div>
 * 
 * Use Cases:
 * - SMS verification code countdown, resend after 60 seconds
 * - Event countdown, showing time until event start/end
 * - Flash sales, displaying remaining time
 * - Scheduled tasks, auto-executing operations
 * 
 * Notes:
 * - Automatically stops when countdown reaches 0
 * - Auto-cleans up timer on component unmount to prevent memory leaks
 * - interval of 1000ms means decrease by 1 per second, adjust as needed
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
 * Form Validation Hook
 * 
 * Manages form state, validation rules, and error messages uniformly, supporting field-level and form-level validation.
 * Provides complete form state management and validation flow control.
 * 
 * @param {Object} initialValues - Initial values object for form fields, keys are field names, values are initial values
 * @param {Object} validationRules - Validation rules object, keys are field names, values are validation function arrays
 *   - Each validation function accepts field value, returns { valid: boolean, message: string }
 * @returns {Object} Object containing form state and operation methods
 *   - values: {Object} Current values of all form fields
 *   - errors: {Object} Validation error messages for each field, keys are field names, values are error text
 *   - touched: {Object} Whether each field has been interacted with (blurred), controls error display timing
 *   - setValue: {Function} Function to set field value, accepts (fieldName, value) parameters
 *   - setTouched: {Function} Function to mark field as touched, accepts fieldName parameter
 *   - validateAll: {Function} Function to validate all fields, returns boolean indicating if all passed
 *   - reset: {Function} Function to reset form to initial state
 *   - isValid: {boolean} Whether the current form is valid (all fields have no errors)
 * 
 * @example
 * const validationRules = {
 *   email: [
 *     (value) => ({ valid: !!value, message: 'Email is required' }),
 *     (value) => ({ valid: /^\S+@\S+$/.test(value), message: 'Invalid email format' })
 *   ],
 *   password: [
 *     (value) => ({ valid: value.length >= 6, message: 'Password must be at least 6 characters' })
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
 * // Field blur validation
 * <input
 *   value={values.email}
 *   onChange={(e) => setValue('email', e.target.value)}
 *   onBlur={() => setTouched('email')}
 * />
 * {touched.email && errors.email && <span>{errors.email}</span>}
 * 
 * Use Cases:
 * - Complex form validation, managing multiple fields uniformly
 * - Multi-step forms, validating and submitting in steps
 * - Dynamic form fields, flexibly adding validation rules
 * - Real-time validation feedback, improving user experience
 * 
 * Validation Timing:
 * - Field blur triggers single field validation (setTouched)
 * - Form submission triggers all fields validation (validateAll)
 * - setValue auto-validates if field is already touched
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
 * Drag Hook
 * 
 * Manages drag operation state, tracking dragged items and drag status.
 * Provides simple API to start and end drag operations.
 * 
 * @returns {Object} Object containing drag state and control methods
 *   - isDragging: {boolean} Whether currently dragging
 *   - draggedItem: {any} Current dragged item data, null when not dragging
 *   - dragStart: {Function} Function to start dragging, accepts the item to drag as parameter
 *   - dragEnd: {Function} Function to end dragging, clears drag state
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
 * // Kanban task dragging
 * const { draggedItem, dragStart, dragEnd } = useDrag()
 * const handleDrop = (targetColumn) => {
 *   if (draggedItem) {
 *     moveTask(draggedItem.id, targetColumn)
 *   }
 *   dragEnd()
 * }
 * 
 * Use Cases:
 * - List item drag sorting, adjusting item order
 * - Kanban task movement, dragging between columns
 * - File upload drag, dropping files to upload area
 * - Canvas element dragging, moving graphic elements
 * 
 * Notes:
 * - Use with HTML5 Drag and Drop API
 * - draggedItem can store any type of data
 * - Recommend using with onDragOver and onDrop event handlers
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
 * Virtual List Hook
 * 
 * Implements virtual scrolling for large lists, rendering only visible items to dramatically improve performance.
 * Automatically calculates visible items, total height, and offset.
 * 
 * @param {Array} items - Complete data list array
 * @param {number} containerHeight - Container visible height in px
 * @param {number} itemHeight - Individual list item height in px (must be fixed height)
 * @returns {Object} Object containing virtual list data and control methods
 *   - visibleItems: {Array} List items in the current visible area, each includes original data and index property
 *   - totalHeight: {number} Total list height, used to set container inner height in px
 *   - offsetY: {number} Vertical offset of visible items, used to position list items in px
 *   - onScroll: {Function} Scroll event handler, must be bound to container's onScroll event
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
 * // Table virtual scrolling
 * const { visibleItems, totalHeight, offsetY, onScroll } = 
 *   useVirtualList(tableData, 500, 40)
 * 
 * Use Cases:
 * - Long list rendering, lists with thousands of data items
 * - Large table pagination, optimizing render performance
 * - Chat message history, massive message data
 * - Log viewer, huge amounts of log data
 * 
 * Performance Improvement:
 * - Renders only elements in visible area, typically just 10-20 DOM nodes
 * - Dramatically reduces DOM node count, improving render performance
 * - Smooth scrolling, no lag
 * 
 * Notes:
 * - Requires each list item to have fixed height, doesn't support variable height items
 * - visibleItems index property is the index in original array, recommended for use as key
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
 * Infinite Scroll Hook
 * 
 * Implements infinite scroll loading, automatically loading more data when user scrolls near page bottom.
 * Automatically manages loading state to prevent duplicate loading.
 * 
 * @param {Function} fetchMore - Async function to load more data, returns Promise
 * @param {boolean} [hasMore=true] - Whether there is more data to load, defaults to true
 * @returns {Object} Object containing loading state and control methods
 *   - isLoading: {boolean} Whether currently loading
 *   - loadMore: {Function} Function to manually trigger loading more
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
 *     {!hasMore && <div>No more data</div>}
 *   </div>
 * )
 * 
 * @example
 * // Manual load more
 * const { isLoading, loadMore } = useInfiniteScroll(fetchMore, hasMore)
 * <button onClick={loadMore} disabled={isLoading}>
 *   {isLoading ? 'Loading...' : 'Load More'}
 * </button>
 * 
 * Use Cases:
 * - News feeds, auto-loading more content on scroll
 * - Product listings, loading next page of products on scroll
 * - Social feeds, infinite scrolling to view more updates
 * - Search results page, paginated loading of search results
 * 
 * Trigger Conditions:
 * - Triggers loading when scroll distance to page bottom is less than 1000px
 * - Won't trigger duplicate loads while loading
 * - Won't trigger loading when hasMore is false
 * 
 * Performance Optimization:
 * - Auto-prevents duplicate loading
 * - Auto-cleans up scroll listener on component unmount
 * - Recommend combining with throttle to optimize scroll event handling
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