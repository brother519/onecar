import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as productAPI from '../api/productAPI'

// 异步操作
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 1, size = 20, filter = {} }) => {
    const response = await productAPI.getProducts({ page, size, filter })
    return response
  }
)

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData) => {
    const response = await productAPI.createProduct(productData)
    return response
  }
)

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }) => {
    const response = await productAPI.updateProduct(id, data)
    return response
  }
)

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id) => {
    await productAPI.deleteProduct(id)
    return id
  }
)

export const reorderProducts = createAsyncThunk(
  'products/reorderProducts',
  async (reorderData) => {
    const response = await productAPI.reorderProducts(reorderData)
    return response
  }
)

export const batchOperateProducts = createAsyncThunk(
  'products/batchOperateProducts',
  async ({ operation, productIds }) => {
    const response = await productAPI.batchOperateProducts(operation, productIds)
    return response
  }
)

// 初始状态
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

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // 设置过滤条件
    setFilter: (state, action) => {
      state.filter = { ...state.filter, ...action.payload }
    },
    
    // 清空过滤条件
    clearFilter: (state) => {
      state.filter = {}
    },
    
    // 设置选中项
    setSelectedItems: (state, action) => {
      state.selectedItems = action.payload
    },
    
    // 切换选中项
    toggleSelectedItem: (state, action) => {
      const itemId = action.payload
      const index = state.selectedItems.indexOf(itemId)
      if (index > -1) {
        state.selectedItems.splice(index, 1)
      } else {
        state.selectedItems.push(itemId)
      }
    },
    
    // 全选/取消全选
    toggleSelectAll: (state) => {
      if (state.selectedItems.length === state.items.length) {
        state.selectedItems = []
      } else {
        state.selectedItems = state.items.map(item => item.id)
      }
    },
    
    // 拖拽状态管理
    setDragState: (state, action) => {
      state.dragState = { ...state.dragState, ...action.payload }
    },
    
    // 虚拟滚动状态管理
    setVirtualScrollState: (state, action) => {
      state.virtualScroll = { ...state.virtualScroll, ...action.payload }
    },
    
    // 本地排序（乐观更新）
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
    
    // 设置分页
    setPage: (state, action) => {
      state.currentPage = action.payload
    },
    
    // 设置页面大小
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    },
  },
  
  extraReducers: (builder) => {
    // 获取商品列表
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
        state.currentPage = action.payload.page
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
    
    // 创建商品
    builder
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
        state.total += 1
      })
    
    // 更新商品
    builder
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
    
    // 删除商品
    builder
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload)
        state.total -= 1
        state.selectedItems = state.selectedItems.filter(id => id !== action.payload)
      })
    
    // 重新排序
    builder
      .addCase(reorderProducts.fulfilled, (state, action) => {
        // 服务器确认后的最终状态
        state.items = action.payload.items
      })
    
    // 批量操作
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

export default productSlice.reducer