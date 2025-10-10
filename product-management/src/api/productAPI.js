import api from './index'

// 模拟数据生成器
const generateMockProducts = (count = 1000) => {
  const categories = ['电子产品', '服装', '家居用品', '食品', '图书', '运动器材', '美妆', '汽车用品']
  const statuses = ['active', 'inactive', 'draft', 'discontinued']
  
  return Array.from({ length: count }, (_, index) => ({
    id: `product_${index + 1}`,
    name: `商品 ${index + 1}`,
    description: `这是商品 ${index + 1} 的详细描述，包含了产品的特性和优势。`,
    price: Math.floor(Math.random() * 10000) / 100 + 1,
    category: categories[Math.floor(Math.random() * categories.length)],
    stock: Math.floor(Math.random() * 1000),
    images: [
      `https://picsum.photos/400/300?random=${index + 1}`,
      `https://picsum.photos/400/300?random=${index + 1001}`,
    ],
    attributes: {
      brand: `品牌${Math.floor(Math.random() * 50) + 1}`,
      model: `型号${Math.floor(Math.random() * 100) + 1}`,
      weight: `${Math.floor(Math.random() * 5000) / 100}kg`,
      dimensions: `${Math.floor(Math.random() * 100)}x${Math.floor(Math.random() * 100)}x${Math.floor(Math.random() * 100)}cm`,
    },
    sortOrder: index,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
  }))
}

// 模拟数据存储
let mockData = {
  products: generateMockProducts(1000),
  totalCount: 1000,
}

// 模拟网络延迟
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// 获取商品列表
export const getProducts = async ({ page = 1, size = 20, filter = {} }) => {
  await delay()
  
  let filteredProducts = [...mockData.products]
  
  // 应用过滤条件
  if (filter.keyword) {
    const keyword = filter.keyword.toLowerCase()
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(keyword) ||
      product.description.toLowerCase().includes(keyword) ||
      product.category.toLowerCase().includes(keyword)
    )
  }
  
  if (filter.category) {
    filteredProducts = filteredProducts.filter(product =>
      product.category === filter.category
    )
  }
  
  if (filter.status) {
    filteredProducts = filteredProducts.filter(product =>
      product.status === filter.status
    )
  }
  
  if (filter.priceRange) {
    const [min, max] = filter.priceRange
    filteredProducts = filteredProducts.filter(product =>
      product.price >= min && product.price <= max
    )
  }
  
  // 排序
  const sortField = filter.sortField || 'createdAt'
  const sortOrder = filter.sortOrder || 'desc'
  
  filteredProducts.sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1
    } else {
      return aValue > bValue ? 1 : -1
    }
  })
  
  // 分页
  const startIndex = (page - 1) * size
  const endIndex = startIndex + size
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
  
  return {
    items: paginatedProducts,
    total: filteredProducts.length,
    page,
    size,
    hasMore: endIndex < filteredProducts.length,
  }
}

// 获取单个商品
export const getProduct = async (id) => {
  await delay()
  
  const product = mockData.products.find(p => p.id === id)
  if (!product) {
    throw new Error('商品不存在')
  }
  
  return product
}

// 创建商品
export const createProduct = async (productData) => {
  await delay()
  
  const newProduct = {
    id: `product_${Date.now()}`,
    ...productData,
    sortOrder: mockData.products.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  mockData.products.unshift(newProduct)
  mockData.totalCount += 1
  
  return newProduct
}

// 更新商品
export const updateProduct = async (id, updateData) => {
  await delay()
  
  const index = mockData.products.findIndex(p => p.id === id)
  if (index === -1) {
    throw new Error('商品不存在')
  }
  
  mockData.products[index] = {
    ...mockData.products[index],
    ...updateData,
    updatedAt: new Date().toISOString(),
  }
  
  return mockData.products[index]
}

// 删除商品
export const deleteProduct = async (id) => {
  await delay()
  
  const index = mockData.products.findIndex(p => p.id === id)
  if (index === -1) {
    throw new Error('商品不存在')
  }
  
  mockData.products.splice(index, 1)
  mockData.totalCount -= 1
  
  return { success: true }
}

// 重新排序商品
export const reorderProducts = async (reorderData) => {
  await delay()
  
  const { sourceId, targetId, sourceIndex, targetIndex } = reorderData
  
  // 找到源商品和目标位置
  const products = [...mockData.products]
  const sourceProduct = products.find(p => p.id === sourceId)
  
  if (!sourceProduct) {
    throw new Error('源商品不存在')
  }
  
  // 移除源商品
  const filteredProducts = products.filter(p => p.id !== sourceId)
  
  // 插入到目标位置
  filteredProducts.splice(targetIndex, 0, sourceProduct)
  
  // 更新排序权重
  filteredProducts.forEach((product, index) => {
    product.sortOrder = index
    product.updatedAt = new Date().toISOString()
  })
  
  mockData.products = filteredProducts
  
  return {
    success: true,
    items: filteredProducts,
  }
}

// 批量操作商品
export const batchOperateProducts = async (operation, productIds) => {
  await delay()
  
  switch (operation) {
    case 'delete':
      mockData.products = mockData.products.filter(p => !productIds.includes(p.id))
      mockData.totalCount -= productIds.length
      return { success: true, deletedCount: productIds.length }
    
    case 'activate':
      productIds.forEach(id => {
        const product = mockData.products.find(p => p.id === id)
        if (product) {
          product.status = 'active'
          product.updatedAt = new Date().toISOString()
        }
      })
      return { success: true, updatedCount: productIds.length }
    
    case 'deactivate':
      productIds.forEach(id => {
        const product = mockData.products.find(p => p.id === id)
        if (product) {
          product.status = 'inactive'
          product.updatedAt = new Date().toISOString()
        }
      })
      return { success: true, updatedCount: productIds.length }
    
    case 'updateCategory':
      const { category } = arguments[2] || {}
      productIds.forEach(id => {
        const product = mockData.products.find(p => p.id === id)
        if (product) {
          product.category = category
          product.updatedAt = new Date().toISOString()
        }
      })
      return { success: true, updatedCount: productIds.length }
    
    default:
      throw new Error('不支持的批量操作类型')
  }
}

// 导出商品数据
export const exportProducts = async (filter = {}) => {
  await delay(2000) // 模拟导出处理时间
  
  const { items } = await getProducts({ page: 1, size: 10000, filter })
  
  return {
    data: items,
    filename: `products_export_${new Date().toISOString().slice(0, 10)}.csv`,
    url: '/api/exports/products.csv',
  }
}

// 上传商品图片
export const uploadProductImage = async (file) => {
  await delay(1000)
  
  // 模拟上传
  const mockUrl = `https://picsum.photos/400/300?random=${Date.now()}`
  
  return {
    success: true,
    url: mockUrl,
    size: file.size,
    name: file.name,
  }
}