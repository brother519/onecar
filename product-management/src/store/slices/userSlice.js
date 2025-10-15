/**
 * 用户状态切片 (User Slice)
 * 
 * 功能说明：
 * - 管理用户基本信息（姓名、邮箱、头像等）
 * - 管理用户认证状态（登录/登出、token）
 * - 管理用户权限列表和权限检查
 * - 管理用户个人偏好设置（语言、分页大小等）
 * - 跟踪用户最近操作历史
 * 
 * 状态结构：
 * - userInfo: 用户基本信息
 * - isAuthenticated: 认证状态
 * - token: 认证令牌
 * - permissions: 权限列表
 * - preferences: 个人偏好设置
 * - recentActions: 最近操作历史
 * 
 * @module store/slices/userSlice
 * @requires @reduxjs/toolkit
 */

import { createSlice } from '@reduxjs/toolkit'

/**
 * 用户切片的初始状态定义
 * 
 * @typedef {Object} UserState
 * @property {Object} userInfo - 用户基本信息
 * @property {string} userInfo.id - 用户ID
 * @property {string} userInfo.name - 用户姓名
 * @property {string} userInfo.username - 用户名
 * @property {string} userInfo.email - 电子邮箱
 * @property {string|null} userInfo.avatar - 头像链接
 * @property {string} userInfo.role - 用户角色 ('admin' | 'user' | 'guest')
 * @property {boolean} isAuthenticated - 是否已认证
 * @property {string|null} token - 认证令牌
 * @property {Array<string>} permissions - 权限列表
 * @property {Object} preferences - 用户偏好设置
 * @property {string} preferences.language - 语言设置
 * @property {number} preferences.pageSize - 分页大小
 * @property {Array<string>} preferences.tableColumns - 表格显示列
 * @property {string} preferences.sortField - 默认排序字段
 * @property {string} preferences.sortOrder - 默认排序方向 ('asc' | 'desc')
 * @property {boolean} preferences.autoSave - 是否自动保存
 * @property {Array<Object>} recentActions - 最近操作历史
 */
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

/**
 * 用户状态切片
 * 
 * 包含用户信息和权限管理的所有 reducers 和 actions
 * 
 * @constant
 * @type {Slice}
 */
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /**
     * 设置用户信息
     * 
     * @function setUserInfo
     * @param {UserState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 要更新的用户信息（与现有信息合并）
     * @param {string} [action.payload.name] - 用户姓名
     * @param {string} [action.payload.email] - 电子邮箱
     * @param {string} [action.payload.avatar] - 头像链接
     * 
     * @example
     * dispatch(setUserInfo({ name: '张三', email: 'zhangsan@example.com' }))
     */
    setUserInfo: (state, action) => {
      state.userInfo = { ...state.userInfo, ...action.payload }
    },
    
    /**
     * 设置认证状态
     * 
     * @function setAuthStatus
     * @param {UserState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 认证状态配置
     * @param {boolean} action.payload.isAuthenticated - 是否已认证
     * @param {string} [action.payload.token=null] - 认证令牌
     * 
     * @example
     * dispatch(setAuthStatus({ isAuthenticated: true, token: 'abc123' }))
     */
    setAuthStatus: (state, action) => {
      const { isAuthenticated, token = null } = action.payload
      state.isAuthenticated = isAuthenticated
      state.token = token
    },
    
    /**
     * 用户登录
     * 
     * @function login
     * @param {UserState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 登录数据
     * @param {Object} action.payload.userInfo - 用户信息对象
     * @param {string} action.payload.token - 认证令牌
     * 
     * @example
     * dispatch(login({
     *   userInfo: { id: '1', name: '管理员', role: 'admin' },
     *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
     * }))
     */
    login: (state, action) => {
      const { userInfo, token } = action.payload
      state.userInfo = userInfo
      state.token = token
      state.isAuthenticated = true
    },
    
    /**
     * 用户登出
     * 
     * @function logout
     * @param {UserState} state - 当前状态
     * 
     * @description
     * 清空用户信息、令牌和操作历史，将认证状态设为false
     * 
     * @example
     * dispatch(logout())
     */
    logout: (state) => {
      state.userInfo = {}
      state.token = null
      state.isAuthenticated = false
      state.recentActions = []
    },
    
    /**
     * 设置权限列表
     * 
     * @function setPermissions
     * @param {UserState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Array<string>} action.payload - 权限字符串数组
     * 
     * @example
     * dispatch(setPermissions([
     *   'product:view',
     *   'product:create',
     *   'product:edit',
     *   'product:delete'
     * ]))
     */
    setPermissions: (state, action) => {
      state.permissions = action.payload
    },
    
    /**
     * 检查用户是否具有指定权限
     * 
     * @function hasPermission
     * @param {UserState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {string} action.payload - 要检查的权限字符串
     * @returns {boolean} 是否具有该权限
     * 
     * @description
     * 此函数用于检查当前用户是否具有指定权限
     * 
     * @example
     * // 在组件中检查权限
     * const canDelete = useSelector(state => 
     *   state.user.permissions.includes('product:delete')
     * )
     */
    hasPermission: (state, action) => {
      const permission = action.payload
      return state.permissions.includes(permission)
    },
    
    /**
     * 设置用户偏好
     * 
     * @function setPreferences
     * @param {UserState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 要更新的偏好设置（与现有设置合并）
     * @param {string} [action.payload.language] - 语言设置
     * @param {number} [action.payload.pageSize] - 分页大小
     * @param {Array<string>} [action.payload.tableColumns] - 表格显示列
     * @param {boolean} [action.payload.autoSave] - 是否自动保存
     * 
     * @example
     * dispatch(setPreferences({ language: 'en-US', pageSize: 50 }))
     */
    setPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload }
    },
    
    /**
     * 添加最近操作
     * 
     * @function addRecentAction
     * @param {UserState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 操作信息
     * @param {string} action.payload.type - 操作类型
     * @param {string} action.payload.description - 操作描述
     * @param {Object} [action.payload.data] - 操作相关数据
     * 
     * @description
     * 记录用户的操作历史，最多保留50条记录
     * 
     * @example
     * dispatch(addRecentAction({
     *   type: 'product:create',
     *   description: '创建产品: iPhone 15',
     *   data: { productId: 123 }
     * }))
     */
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
    
    /**
     * 清空最近操作
     * 
     * @function clearRecentActions
     * @param {UserState} state - 当前状态
     * 
     * @example
     * dispatch(clearRecentActions())
     */
    clearRecentActions: (state) => {
      state.recentActions = []
    },
  },
})

/**
 * 导出所有 action creators
 * 
 * @exports
 */
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

/**
 * 导出用户切片的 reducer 函数
 * 
 * @exports
 * @default
 */
export default userSlice.reducer