import { createSlice } from '@reduxjs/toolkit'

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

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // 弹窗管理
    showModal: (state, action) => {
      const { type, data = null } = action.payload
      if (state.modals[type]) {
        state.modals[type] = { visible: true, data }
      }
    },
    
    hideModal: (state, action) => {
      const { type } = action.payload
      if (state.modals[type]) {
        state.modals[type] = { visible: false, data: null }
      }
    },
    
    hideAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = { visible: false, data: null }
      })
    },
    
    // 加载状态管理
    setLoading: (state, action) => {
      const { type, loading } = action.payload
      if (state.loading[type] !== undefined) {
        state.loading[type] = loading
      }
    },
    
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload
    },
    
    // 通知消息管理
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      }
      state.notifications.push(notification)
    },
    
    removeNotification: (state, action) => {
      const id = action.payload
      state.notifications = state.notifications.filter(n => n.id !== id)
    },
    
    clearNotifications: (state) => {
      state.notifications = []
    },
    
    // 主题设置
    setTheme: (state, action) => {
      state.theme = { ...state.theme, ...action.payload }
    },
    
    toggleThemeMode: (state) => {
      state.theme.mode = state.theme.mode === 'light' ? 'dark' : 'light'
    },
    
    // 布局设置
    setLayout: (state, action) => {
      state.layout = { ...state.layout, ...action.payload }
    },
    
    toggleSider: (state) => {
      state.layout.siderCollapsed = !state.layout.siderCollapsed
    },
    
    setScreenSize: (state, action) => {
      state.layout.screenSize = action.payload
    },
    
    // 水印设置
    setWatermark: (state, action) => {
      state.watermark = { ...state.watermark, ...action.payload }
    },
  },
})

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

export default uiSlice.reducer