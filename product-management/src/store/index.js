/**
 * Redux Store 配置文件
 * 
 * 功能说明：
 * - 配置应用的全局状态管理
 * - 整合产品、UI、用户三个状态切片
 * - 配置序列化检查中间件
 * - 导出 TypeScript 类型定义
 * 
 * 状态树结构：
 * - products: 产品数据管理（商品列表、CRUD操作、分页、筛选、批量操作、拖拽排序、虚拟滚动）
 * - ui: 界面状态管理（弹窗状态、加载状态、通知消息、主题设置、布局配置、水印设置）
 * - user: 用户信息管理（用户身份、权限控制、偏好设置、操作记录、认证状态）
 */

// Redux Toolkit 核心配置工具，用于创建和配置 Redux store
import { configureStore } from '@reduxjs/toolkit'

// 产品状态切片 - 管理商品数据、列表操作、分页筛选、批量处理、拖拽排序等功能
import productReducer from './slices/productSlice'

// UI状态切片 - 管理界面交互状态、弹窗显示、加载状态、通知消息、主题布局等
import uiReducer from './slices/uiSlice'

// 用户状态切片 - 管理用户信息、认证状态、权限控制、个人偏好、操作历史等
import userReducer from './slices/userSlice'

/**
 * Redux Store 实例配置
 * 
 * 状态结构说明：
 * - state.products: 产品相关数据和操作状态
 * - state.ui: 用户界面状态和交互控制
 * - state.user: 用户信息和权限管理
 */
export const store = configureStore({
  // 状态切片组合配置 - 将各个独立的状态切片合并为完整的状态树
  reducer: {
    products: productReducer,  // 产品数据管理切片
    ui: uiReducer,            // 界面状态管理切片
    user: userReducer,        // 用户信息管理切片
  },
  
  // 中间件配置 - 自定义 Redux 中间件行为
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // 序列化检查配置 - 确保状态对象的可序列化性，提升开发体验和调试能力
      serializableCheck: {
        // 忽略持久化相关操作的序列化检查，避免 redux-persist 产生的警告
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

// TypeScript 类型定义导出

/**
 * 根状态类型定义
 * 
 * 用途：
 * - 在 React 组件中使用 useSelector 时提供类型支持
 * - 为状态选择器函数提供类型约束
 * - 确保状态访问的类型安全
 * 
 * 使用示例：
 * const products = useSelector((state: RootState) => state.products.items)
 */
export type RootState = ReturnType<typeof store.getState>

/**
 * 调度器类型定义
 * 
 * 用途：
 * - 在 React 组件中使用 useDispatch 时提供类型支持
 * - 为异步 action 调用提供类型约束
 * - 确保 action 调度的类型安全
 * 
 * 使用示例：
 * const dispatch = useDispatch<AppDispatch>()
 * dispatch(fetchProducts({ page: 1, size: 20 }))
 */
export type AppDispatch = typeof store.dispatch