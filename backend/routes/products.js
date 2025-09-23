import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 模拟数据存储（实际项目中应使用数据库）
let products = [];

// 生成示例数据
const generateSampleProducts = (count = 50) => {
  const categories = ['电子产品', '服装配饰', '家居用品', '体育用品', '图书音像'];
  const statuses = ['active', 'inactive', 'draft'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: uuidv4(),
    name: `商品 ${index + 1}`,
    description: `这是商品 ${index + 1} 的详细描述`,
    price: Math.random() * 1000 + 10,
    category: categories[Math.floor(Math.random() * categories.length)],
    images: [
      `https://picsum.photos/300/200?random=${index + 1}`,
      `https://picsum.photos/300/200?random=${index + 100}`,
    ],
    tags: [`标签${index % 5 + 1}`, `标签${index % 3 + 6}`],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    sortOrder: index,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    sku: `SKU-${String(index + 1).padStart(4, '0')}`,
    stock: Math.floor(Math.random() * 100),
  }));
};

// 初始化示例数据
products = generateSampleProducts();

/**
 * GET /api/products
 * 获取商品列表（支持分页、筛选、排序）
 */
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.size) || 20;
    const category = req.query.category;
    const status = req.query.status;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'sortOrder';
    const sortOrder = req.query.sortOrder || 'asc';

    // 筛选
    let filteredProducts = [...products];
    
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    if (status) {
      filteredProducts = filteredProducts.filter(p => p.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower)
      );
    }

    // 排序
    filteredProducts.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });

    // 分页
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
});

/**
 * GET /api/products/:id
 * 获取单个商品详情
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
    });
  }
});

/**
 * POST /api/products
 * 创建新商品
 */
router.post('/', (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      images = [],
      tags = [],
      status = 'draft',
      sku,
      stock = 0,
    } = req.body;

    // 基本验证
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required',
      });
    }

    const newProduct = {
      id: uuidv4(),
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      images,
      tags,
      status,
      sortOrder: products.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sku: sku || `SKU-${Date.now()}`,
      stock: parseInt(stock),
    };

    products.push(newProduct);

    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
});

/**
 * PUT /api/products/:id
 * 更新商品
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // 更新商品
    products[productIndex] = {
      ...products[productIndex],
      ...updateData,
      id, // 确保 ID 不被修改
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: products[productIndex],
      message: 'Product updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/products/:id
 * 删除商品
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const deletedProduct = products.splice(productIndex, 1)[0];

    res.json({
      success: true,
      data: deletedProduct,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
});

/**
 * PUT /api/products/sort
 * 更新商品排序
 */
router.put('/sort', (req, res) => {
  try {
    const { sortOrder } = req.body;
    
    if (!Array.isArray(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: 'sortOrder must be an array',
      });
    }

    // 更新排序
    sortOrder.forEach((id, index) => {
      const product = products.find(p => p.id === id);
      if (product) {
        product.sortOrder = index;
        product.updatedAt = new Date().toISOString();
      }
    });

    // 重新排序产品数组
    products.sort((a, b) => a.sortOrder - b.sortOrder);

    res.json({
      success: true,
      message: 'Products reordered successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reorder products',
      error: error.message,
    });
  }
});

/**
 * POST /api/products/batch
 * 批量操作商品
 */
router.post('/batch', (req, res) => {
  try {
    const { action, productIds, updateData } = req.body;
    
    if (!action || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'action and productIds are required',
      });
    }

    let affectedProducts = [];

    switch (action) {
      case 'delete':
        affectedProducts = products.filter(p => productIds.includes(p.id));
        products = products.filter(p => !productIds.includes(p.id));
        break;
        
      case 'update':
        if (!updateData) {
          return res.status(400).json({
            success: false,
            message: 'updateData is required for update action',
          });
        }
        
        products.forEach(product => {
          if (productIds.includes(product.id)) {
            Object.assign(product, updateData, {
              updatedAt: new Date().toISOString(),
            });
            affectedProducts.push(product);
          }
        });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action',
        });
    }

    res.json({
      success: true,
      data: affectedProducts,
      message: `Batch ${action} completed successfully`,
      count: affectedProducts.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to perform batch operation',
      error: error.message,
    });
  }
});

export default router;