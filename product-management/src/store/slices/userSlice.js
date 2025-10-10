import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // 用户信息
  userInfo: {
    id: '1',
    name: '管理员',
    username: 'admin',
    email: 'admin@example.com',
    avatar: null,
    role: 'admin',
  },
  
  // 认证状态
  isAuthenticated: true,
  token: null,
  
  // 权限列表
  permissions: [
    'product:view',
    'product:create',
    'product:edit',
    'product:delete',
    'product:batch',
    'product:export',
    'system:config',
  ],
  
  // 用户偏好设置
  preferences: {
    language: 'zh-CN',
    pageSize: 20,
    tableColumns: ['name', 'price', 'category', 'stock', 'status', 'actions'],
    sortField: 'createdAt',
    sortOrder: 'desc',
    autoSave: true,
  },
  
  // 最近操作
  recentActions: [],
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 设置用户信息
    setUserInfo: (state, action) => {
      state.userInfo = { ...state.userInfo, ...action.payload }
    },
    
    // 设置认证状态
    setAuthStatus: (state, action) => {
      const { isAuthenticated, token = null } = action.payload
      state.isAuthenticated = isAuthenticated
      state.token = token
    },
    
    // 登录
    login: (state, action) => {
      const { userInfo, token } = action.payload
      state.userInfo = userInfo
      state.token = token
      state.isAuthenticated = true
    },
    
    // 登出
    logout: (state) => {
      state.userInfo = {}
      state.token = null
      state.isAuthenticated = false
      state.recentActions = []
    },
    
    // 设置权限
    setPermissions: (state, action) => {
      state.permissions = action.payload
    },
    
    // 检查权限
    hasPermission: (state, action) => {
      const permission = action.payload
      return state.permissions.includes(permission)
    },
    
    // 设置用户偏好
    setPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload }
    },
    
    // 添加最近操作
    addRecentAction: (state, action) => {
      const action_item = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      }
      
      state.recentActions.unshift(action_item)
      
      // 保持最近操作数量在合理范围内
      if (state.recentActions.length > 50) {
        state.recentActions = state.recentActions.slice(0, 50)
      }
    },
    
    // 清空最近操作
    clearRecentActions: (state) => {
      state.recentActions = []
    },
  },
})

export const {
  setUserInfo,
  setAuthStatus,
  login,
  logout,
  setPermissions,
  hasPermission,
  setPreferences,
  addRecentAction,
  clearRecentActions,
} = userSlice.actions

export default userSlice.reducer