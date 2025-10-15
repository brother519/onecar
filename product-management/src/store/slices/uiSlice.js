/**
 * UI状态切片 (UI Slice)
 * 
 * 功能说明：
 * - 管理应用的各种弹窗显示状态
 * - 管理全局和局部加载状态
 * - 处理通知消息的显示和关闭
 * - 管理主题设置（亮色/暗色模式、主色调等）
 * - 管理布局配置（侧边栏折叠、响应式屏幕尺寸）
 * - 管理水印配置
 * 
 * 状态结构：
 * - modals: 各种弹窗的显示状态和数据
 * - loading: 各个模块的加载状态
 * - notifications: 通知消息队列
 * - theme: 主题设置
 * - layout: 布局配置
 * - watermark: 水印设置
 * 
 * @module store/slices/uiSlice
 * @requires @reduxjs/toolkit
 */

import { createSlice } from '@reduxjs/toolkit'

/**
 * UI切片的初始状态定义
 * 
 * @typedef {Object} UIState
 * @property {Object} modals - 弹窗状态对象
 * @property {Object} modals.productEdit - 产品编辑弹窗状态
 * @property {Object} modals.codeEditor - 代码编辑器弹窗状态
 * @property {Object} modals.qrCode - 二维码弹窗状态
 * @property {Object} modals.captcha - 验证码弹窗状态
 * @property {Object} modals.batchOperation - 批量操作弹窗状态
 * @property {Object} loading - 加载状态对象
 * @property {boolean} loading.global - 全局加载状态
 * @property {boolean} loading.productList - 产品列表加载状态
 * @property {boolean} loading.productEdit - 产品编辑加载状态
 * @property {boolean} loading.upload - 上传加载状态
 * @property {Array<Object>} notifications - 通知消息数组
 * @property {Object} theme - 主题设置
 * @property {string} theme.mode - 主题模式 ('light' | 'dark')
 * @property {string} theme.primaryColor - 主色调
 * @property {number} theme.borderRadius - 边框圆角大小
 * @property {Object} layout - 布局设置
 * @property {boolean} layout.siderCollapsed - 侧边栏是否折叠
 * @property {string} layout.screenSize - 屏幕尺寸 ('mobile' | 'tablet' | 'desktop')
 * @property {Object} watermark - 水印设置
 * @property {string} watermark.text - 水印文本
 * @property {number} watermark.fontSize - 字体大小
 * @property {string} watermark.color - 水印颜色
 * @property {number} watermark.angle - 旋转角度
 * @property {Object} watermark.spacing - 水印间距
 * @property {number} watermark.spacing.x - 水平间距
 * @property {number} watermark.spacing.y - 垂直间距
 */
const initialState = {
  // 弹窗状态
  modals: {
    productEdit: { visible: false, data: null },
    codeEditor: { visible: false, data: null },
    qrCode: { visible: false, data: null },
    captcha: { visible: false, data: null },
    batchOperation: { visible: false, data: null },
  },
  
  // 加载状态
  loading: {
    global: false,
    productList: false,
    productEdit: false,
    upload: false,
  },
  
  // 通知消息
  notifications: [],
  
  // 主题设置
  theme: {
    mode: 'light',
    primaryColor: '#1890ff',
    borderRadius: 6,
  },
  
  // 布局设置
  layout: {
    siderCollapsed: false,
    screenSize: 'desktop', // mobile, tablet, desktop
  },
  
  // 水印设置
  watermark: {
    text: '商品管理系统',
    fontSize: 16,
    color: 'rgba(0,0,0,0.1)',
    angle: -30,
    spacing: { x: 200, y: 150 },
  },
}

/**
 * UI状态切片
 * 
 * 包含UI交互相关的所有 reducers 和 actions
 * 
 * @constant
 * @type {Slice}
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * 显示弹窗
     * 
     * @function showModal
     * @param {UIState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 弹窗配置
     * @param {string} action.payload.type - 弹窗类型 (productEdit | codeEditor | qrCode | captcha | batchOperation)
     * @param {Object} [action.payload.data=null] - 弹窗数据
     * 
     * @example
     * dispatch(showModal({ type: 'productEdit', data: { id: 123, name: 'iPhone' } }))
     */
    showModal: (state, action) => {
      const { type, data = null } = action.payload
      if (state.modals[type]) {
        state.modals[type] = { visible: true, data }
      }
    },
    
    /**
     * 隐藏弹窗
     * 
     * @function hideModal
     * @param {UIState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 弹窗配置
     * @param {string} action.payload.type - 弹窗类型
     * 
     * @example
     * dispatch(hideModal({ type: 'productEdit' }))
     */
    hideModal: (state, action) => {
      const { type } = action.payload
      if (state.modals[type]) {
        state.modals[type] = { visible: false, data: null }
      }
    },
    
    /**
     * 隐藏所有弹窗
     * 
     * @function hideAllModals
     * @param {UIState} state - 当前状态
     * 
     * @example
     * dispatch(hideAllModals())
     */
    hideAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = { visible: false, data: null }
      })
    },
    
    /**
     * 设置加载状态
     * 
     * @function setLoading
     * @param {UIState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 加载状态配置
     * @param {string} action.payload.type - 加载类型 (global | productList | productEdit | upload)
     * @param {boolean} action.payload.loading - 加载状态
     * 
     * @example
     * dispatch(setLoading({ type: 'productList', loading: true }))
     */
    setLoading: (state, action) => {
      const { type, loading } = action.payload
      if (state.loading[type] !== undefined) {
        state.loading[type] = loading
      }
    },
    
    /**
     * 设置全局加载状态
     * 
     * @function setGlobalLoading
     * @param {UIState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {boolean} action.payload - 全局加载状态
     * 
     * @example
     * dispatch(setGlobalLoading(true))
     */
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload
    },
    
    /**
     * 添加通知消息
     * 
     * @function addNotification
     * @param {UIState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 通知消息配置
     * @param {string} action.payload.type - 消息类型 (success | error | warning | info)
     * @param {string} action.payload.message - 消息内容
     * @param {number} [action.payload.duration=3000] - 显示时长（毫秒）
     * 
     * @example
     * dispatch(addNotification({ 
     *   type: 'success', 
     *   message: '产品创建成功',
     *   duration: 3000
     * }))
     */
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      }
      state.notifications.push(notification)
    },
    
    /**
     * 移除通知消息
     * 
     * @function removeNotification
     * @param {UIState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {number} action.payload - 通知消息ID
     * 
     * @example
     * dispatch(removeNotification(1634567890123))
     */
    removeNotification: (state, action) => {
      const id = action.payload
      state.notifications = state.notifications.filter(n => n.id !== id)
    },
    
    /**
     * 清空所有通知消息
     * 
     * @function clearNotifications
     * @param {UIState} state - 当前状态
     * 
     * @example
     * dispatch(clearNotifications())
     */
    clearNotifications: (state) => {
      state.notifications = []
    },
    
    /**
     * 设置主题
     * 
     * @function setTheme
     * @param {UIState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 主题配置
     * @param {string} [action.payload.mode] - 主题模式 ('light' | 'dark')
     * @param {string} [action.payload.primaryColor] - 主色调
     * @param {number} [action.payload.borderRadius] - 边框圆角
     * 
     * @example
     * dispatch(setTheme({ mode: 'dark', primaryColor: '#1890ff' }))
     */
    setTheme: (state, action) => {
      state.theme = { ...state.theme, ...action.payload }
    },
    
    /**
     * 切换主题模式
     * 
     * @function toggleThemeMode
     * @param {UIState} state - 当前状态
     * 
     * @description
     * 在亮色和暗色模式之间切换
     * 
     * @example
     * dispatch(toggleThemeMode())
     */
    toggleThemeMode: (state) => {
      state.theme.mode = state.theme.mode === 'light' ? 'dark' : 'light'
    },
    
    /**
     * 设置布局
     * 
     * @function setLayout
     * @param {UIState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 布局配置
     * @param {boolean} [action.payload.siderCollapsed] - 侧边栏是否折叠
     * @param {string} [action.payload.screenSize] - 屏幕尺寸
     * 
     * @example
     * dispatch(setLayout({ siderCollapsed: true }))
     */
    setLayout: (state, action) => {
      state.layout = { ...state.layout, ...action.payload }
    },
    
    /**
     * 切换侧边栏折叠状态
     * 
     * @function toggleSider
     * @param {UIState} state - 当前状态
     * 
     * @example
     * dispatch(toggleSider())
     */
    toggleSider: (state) => {
      state.layout.siderCollapsed = !state.layout.siderCollapsed
    },
    
    /**
     * 设置屏幕尺寸
     * 
     * @function setScreenSize
     * @param {UIState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {string} action.payload - 屏幕尺寸 ('mobile' | 'tablet' | 'desktop')
     * 
     * @example
     * dispatch(setScreenSize('mobile'))
     */
    setScreenSize: (state, action) => {
      state.layout.screenSize = action.payload
    },
    
    /**
     * 设置水印
     * 
     * @function setWatermark
     * @param {UIState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 水印配置
     * @param {string} [action.payload.text] - 水印文本
     * @param {number} [action.payload.fontSize] - 字体大小
     * @param {string} [action.payload.color] - 水印颜色
     * @param {number} [action.payload.angle] - 旋转角度
     * @param {Object} [action.payload.spacing] - 水印间距
     * 
     * @example
     * dispatch(setWatermark({ 
     *   text: '商品管理系统',
     *   fontSize: 16,
     *   color: 'rgba(0,0,0,0.1)'
     * }))
     */
    setWatermark: (state, action) => {
      state.watermark = { ...state.watermark, ...action.payload }
    },
  },
})

/**
 * 导出所有 action creators
 * 
 * @exports
 */
export const {
  showModal,
  hideModal,
  hideAllModals,
  setLoading,
  setGlobalLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
  toggleThemeMode,
  setLayout,
  toggleSider,
  setScreenSize,
  setWatermark,
} = uiSlice.actions

/**
 * 导出UI切片的 reducer 函数
 * 
 * @exports
 * @default
 */
export default uiSlice.reducer