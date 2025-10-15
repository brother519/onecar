/**
 * 产品状态切片 (Product Slice)
 * 
 * 功能说明：
 * - 管理产品数据的增删改查操作
 * - 处理产品列表的分页和筛选
 * - 支持批量操作和拖拽排序
 * - 实现虚拟滚动优化性能
 * - 管理产品选中状态
 * 
 * 状态结构：
 * - items: 产品列表数据
 * - total: 产品总数
 * - loading: 加载状态标识
 * - error: 错误信息
 * - currentPage: 当前页码
 * - pageSize: 每页数量
 * - filter: 筛选条件对象
 * - selectedItems: 已选中的产品ID列表
 * - dragState: 拖拽状态管理
 * - virtualScroll: 虚拟滚动配置
 * 
 * @module store/slices/productSlice
 * @requires @reduxjs/toolkit
 * @requires ../api/productAPI
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as productAPI from '../api/productAPI'

// ==================== 异步操作 (Async Thunks) ====================

/**
 * 获取产品列表
 * 
 * @async
 * @function fetchProducts
 * @param {Object} params - 查询参数对象
 * @param {number} [params.page=1] - 页码，从1开始
 * @param {number} [params.size=20] - 每页数量
 * @param {Object} [params.filter={}] - 筛选条件对象
 * @param {string} [params.filter.category] - 产品分类
 * @param {string} [params.filter.status] - 产品状态
 * @param {string} [params.filter.keyword] - 搜索关键词
 * @returns {Promise<{items: Array, total: number, page: number}>} 产品列表数据
 * @throws {Error} 当API请求失败时抛出错误
 * 
 * @example
 * // 获取第一页产品
 * dispatch(fetchProducts({ page: 1, size: 20 }))
 * 
 * @example
 * // 带筛选条件获取产品
 * dispatch(fetchProducts({ 
 *   page: 1, 
 *   size: 20, 
 *   filter: { category: '电子产品', status: 'active' } 
 * }))
 */
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 1, size = 20, filter = {} }) => {
    const response = await productAPI.getProducts({ page, size, filter })
    return response
  }
)

/**
 * 创建新产品
 * 
 * @async
 * @function createProduct
 * @param {Object} productData - 新产品数据对象
 * @param {string} productData.name - 产品名称
 * @param {number} productData.price - 产品价格
 * @param {string} productData.category - 产品分类
 * @param {number} [productData.stock=0] - 库存数量
 * @param {string} [productData.description] - 产品描述
 * @param {string} [productData.status='active'] - 产品状态
 * @returns {Promise<Object>} 创建成功的产品对象（包含服务器生成的ID）
 * @throws {Error} 当产品数据验证失败或API请求失败时抛出错误
 * 
 * @example
 * dispatch(createProduct({
 *   name: 'iPhone 15',
 *   price: 5999,
 *   category: '电子产品',
 *   stock: 100,
 *   status: 'active'
 * }))
 */
export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData) => {
    const response = await productAPI.createProduct(productData)
    return response
  }
)

/**
 * 更新产品信息
 * 
 * @async
 * @function updateProduct
 * @param {Object} params - 更新参数对象
 * @param {string|number} params.id - 产品ID
 * @param {Object} params.data - 要更新的产品数据
 * @param {string} [params.data.name] - 产品名称
 * @param {number} [params.data.price] - 产品价格
 * @param {string} [params.data.category] - 产品分类
 * @param {number} [params.data.stock] - 库存数量
 * @param {string} [params.data.status] - 产品状态
 * @returns {Promise<Object>} 更新后的完整产品对象
 * @throws {Error} 当产品不存在或更新失败时抛出错误
 * 
 * @example
 * dispatch(updateProduct({
 *   id: 123,
 *   data: { price: 4999, stock: 150 }
 * }))
 */
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }) => {
    const response = await productAPI.updateProduct(id, data)
    return response
  }
)

/**
 * 删除产品
 * 
 * @async
 * @function deleteProduct
 * @param {string|number} id - 要删除的产品ID
 * @returns {Promise<string|number>} 已删除的产品ID
 * @throws {Error} 当产品不存在或删除失败时抛出错误
 * 
 * @example
 * dispatch(deleteProduct(123))
 */
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id) => {
    await productAPI.deleteProduct(id)
    return id
  }
)

/**
 * 重新排序产品
 * 
 * @async
 * @function reorderProducts
 * @param {Object} reorderData - 排序数据对象
 * @param {number} reorderData.sourceIndex - 源索引位置
 * @param {number} reorderData.targetIndex - 目标索引位置
 * @param {Array<{id: string|number, sortOrder: number}>} [reorderData.items] - 包含新排序的产品列表
 * @returns {Promise<{items: Array}>} 重新排序后的产品列表
 * @throws {Error} 当排序操作失败时抛出错误
 * 
 * @example
 * dispatch(reorderProducts({
 *   sourceIndex: 0,
 *   targetIndex: 5
 * }))
 */
export const reorderProducts = createAsyncThunk(
  'products/reorderProducts',
  async (reorderData) => {
    const response = await productAPI.reorderProducts(reorderData)
    return response
  }
)

/**
 * 批量操作产品
 * 
 * @async
 * @function batchOperateProducts
 * @param {Object} params - 批量操作参数
 * @param {string} params.operation - 操作类型: 'delete' | 'update' | 'export'
 * @param {Array<string|number>} params.productIds - 要操作的产品ID数组
 * @param {Object} [params.updates] - 当operation为'update'时的更新数据
 * @returns {Promise<{operation: string, productIds: Array, result: Object}>} 批量操作结果
 * @throws {Error} 当批量操作失败时抛出错误
 * 
 * @example
 * // 批量删除
 * dispatch(batchOperateProducts({
 *   operation: 'delete',
 *   productIds: [1, 2, 3]
 * }))
 * 
 * @example
 * // 批量更新
 * dispatch(batchOperateProducts({
 *   operation: 'update',
 *   productIds: [1, 2, 3],
 *   updates: { status: 'inactive' }
 * }))
 */
export const batchOperateProducts = createAsyncThunk(
  'products/batchOperateProducts',
  async ({ operation, productIds }) => {
    const response = await productAPI.batchOperateProducts(operation, productIds)
    return response
  }
)

// ==================== 初始状态 (Initial State) ====================

/**
 * 产品切片的初始状态定义
 * 
 * @typedef {Object} ProductState
 * @property {Array<Object>} items - 产品列表数据
 * @property {number} total - 产品总数
 * @property {boolean} loading - 加载状态标识
 * @property {string|null} error - 错误信息
 * @property {number} currentPage - 当前页码
 * @property {number} pageSize - 每页数量
 * @property {Object} filter - 筛选条件对象
 * @property {Array<string|number>} selectedItems - 已选中的产品ID列表
 * @property {Object} dragState - 拖拽状态管理
 * @property {boolean} dragState.isDragging - 是否正在拖拽
 * @property {Object|null} dragState.dragItem - 被拖拽的产品对象
 * @property {Object|null} dragState.dropTarget - 放置目标对象
 * @property {Object} virtualScroll - 虚拟滚动配置
 * @property {number} virtualScroll.startIndex - 可见区域起始索引
 * @property {number} virtualScroll.endIndex - 可见区域结束索引
 * @property {number} virtualScroll.visibleHeight - 可见区域高度（像素）
 */
const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  currentPage: 1,
  pageSize: 20,
  filter: {},
  selectedItems: [],
  dragState: {
    isDragging: false,
    dragItem: null,
    dropTarget: null,
  },
  virtualScroll: {
    startIndex: 0,
    endIndex: 19,
    visibleHeight: 800,
  },
}

// ==================== Slice 定义 (Slice Definition) ====================

/**
 * 产品状态切片
 * 
 * 包含产品数据管理的所有 reducers 和 actions
 * 
 * @constant
 * @type {Slice}
 */
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    /**
     * 设置筛选条件
     * 
     * @function setFilter
     * @param {ProductState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 要设置的筛选条件（与现有筛选条件合并）
     * 
     * @example
     * dispatch(setFilter({ category: '电子产品', status: 'active' }))
     */
    setFilter: (state, action) => {
      state.filter = { ...state.filter, ...action.payload }
    },
    
    /**
     * 清空筛选条件
     * 
     * @function clearFilter
     * @param {ProductState} state - 当前状态
     * 
     * @example
     * dispatch(clearFilter())
     */
    clearFilter: (state) => {
      state.filter = {}
    },
    
    /**
     * 设置选中的产品列表
     * 
     * @function setSelectedItems
     * @param {ProductState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Array<string|number>} action.payload - 产品ID数组
     * 
     * @example
     * dispatch(setSelectedItems([1, 2, 3]))
     */
    setSelectedItems: (state, action) => {
      state.selectedItems = action.payload
    },
    
    /**
     * 切换单个产品的选中状态
     * 
     * @function toggleSelectedItem
     * @param {ProductState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {string|number} action.payload - 产品ID
     * 
     * @example
     * dispatch(toggleSelectedItem(123))
     */
    toggleSelectedItem: (state, action) => {
      const itemId = action.payload
      const index = state.selectedItems.indexOf(itemId)
      if (index > -1) {
        state.selectedItems.splice(index, 1)
      } else {
        state.selectedItems.push(itemId)
      }
    },
    
    /**
     * 全选/取消全选
     * 
     * @function toggleSelectAll
     * @param {ProductState} state - 当前状态
     * 
     * @description
     * 如果当前已全选，则取消全选；否则选中所有产品
     * 
     * @example
     * dispatch(toggleSelectAll())
     */
    toggleSelectAll: (state) => {
      if (state.selectedItems.length === state.items.length) {
        state.selectedItems = []
      } else {
        state.selectedItems = state.items.map(item => item.id)
      }
    },
    
    /**
     * 设置拖拽状态
     * 
     * @function setDragState
     * @param {ProductState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 拖拽状态更新对象
     * @param {boolean} [action.payload.isDragging] - 是否正在拖拽
     * @param {Object} [action.payload.dragItem] - 被拖拽的产品
     * @param {Object} [action.payload.dropTarget] - 放置目标
     * 
     * @example
     * dispatch(setDragState({ isDragging: true, dragItem: product }))
     */
    setDragState: (state, action) => {
      state.dragState = { ...state.dragState, ...action.payload }
    },
    
    /**
     * 设置虚拟滚动状态
     * 
     * @function setVirtualScrollState
     * @param {ProductState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 虚拟滚动状态更新对象
     * @param {number} [action.payload.startIndex] - 可见区域起始索引
     * @param {number} [action.payload.endIndex] - 可见区域结束索引
     * @param {number} [action.payload.visibleHeight] - 可见区域高度
     * 
     * @example
     * dispatch(setVirtualScrollState({ startIndex: 10, endIndex: 30 }))
     */
    setVirtualScrollState: (state, action) => {
      state.virtualScroll = { ...state.virtualScroll, ...action.payload }
    },
    
    /**
     * 本地重新排序产品（乐观更新）
     * 
     * @function reorderItemsLocally
     * @param {ProductState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {Object} action.payload - 排序参数
     * @param {number} action.payload.sourceIndex - 源索引位置
     * @param {number} action.payload.targetIndex - 目标索引位置
     * 
     * @description
     * 在本地立即更新产品顺序，提供乐观UI更新。
     * 等待服务器确认后通过 reorderProducts thunk 同步最终状态。
     * 
     * @example
     * dispatch(reorderItemsLocally({ sourceIndex: 0, targetIndex: 5 }))
     */
    reorderItemsLocally: (state, action) => {
      const { sourceIndex, targetIndex } = action.payload
      const items = [...state.items]
      const [movedItem] = items.splice(sourceIndex, 1)
      items.splice(targetIndex, 0, movedItem)
      
      // 更新排序权重
      items.forEach((item, index) => {
        item.sortOrder = index
      })
      
      state.items = items
    },
    
    /**
     * 设置当前页码
     * 
     * @function setPage
     * @param {ProductState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {number} action.payload - 页码号（从1开始）
     * 
     * @example
     * dispatch(setPage(2))
     */
    setPage: (state, action) => {
      state.currentPage = action.payload
    },
    
    /**
     * 设置每页显示数量
     * 
     * @function setPageSize
     * @param {ProductState} state - 当前状态
     * @param {Object} action - Redux action
     * @param {number} action.payload - 每页数量
     * 
     * @example
     * dispatch(setPageSize(50))
     */
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    },
  },
  
  // ==================== 异步操作处理 (Extra Reducers) ====================
  
  /**
   * 处理异步 thunk 的状态更新
   * 
   * @description
   * 使用 builder 模式处理各个异步操作的 pending/fulfilled/rejected 状态
   */
  extraReducers: (builder) => {
    // 获取产品列表 - pending 状态
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      // 获取产品列表 - fulfilled 状态
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
        state.currentPage = action.payload.page
      })
      // 获取产品列表 - rejected 状态
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
    
    // 创建产品 - fulfilled 状态
    builder
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
        state.total += 1
      })
    
    // 更新产品 - fulfilled 状态
    builder
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
    
    // 删除产品 - fulfilled 状态
    builder
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload)
        state.total -= 1
        state.selectedItems = state.selectedItems.filter(id => id !== action.payload)
      })
    
    // 重新排序 - fulfilled 状态
    builder
      .addCase(reorderProducts.fulfilled, (state, action) => {
        // 服务器确认后的最终状态
        state.items = action.payload.items
      })
    
    // 批量操作 - fulfilled 状态
    builder
      .addCase(batchOperateProducts.fulfilled, (state, action) => {
        const { operation, productIds, result } = action.payload
        
        if (operation === 'delete') {
          state.items = state.items.filter(item => !productIds.includes(item.id))
          state.total -= productIds.length
          state.selectedItems = []
        } else if (operation === 'update') {
          productIds.forEach(id => {
            const index = state.items.findIndex(item => item.id === id)
            if (index !== -1) {
              state.items[index] = { ...state.items[index], ...result.updates }
            }
          })
        }
      })
  },
})

// ==================== 导出 Actions 和 Reducer ====================

/**
 * 导出所有同步 action creators
 * 
 * @exports
 */
export const {
  setFilter,
  clearFilter,
  setSelectedItems,
  toggleSelectedItem,
  toggleSelectAll,
  setDragState,
  setVirtualScrollState,
  reorderItemsLocally,
  setPage,
  setPageSize,
} = productSlice.actions

/**
 * 导出产品切片的 reducer 函数
 * 
 * @exports
 * @default
 */
export default productSlice.reducer