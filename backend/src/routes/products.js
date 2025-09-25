import express from 'express';

const router = express.Router();

// 简单的内存存储（实际项目中应该使用数据库）
let products = [
  {
    id: '1',
    name: '示例产品1',
    description: '这是一个示例产品',
    price: 99.99,
    category: '电子产品',
    stock: 100,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * 获取产品列表
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, category, status } = req.query;
    
    let filteredProducts = [...products];
    
    // 搜索过滤
    if (search) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // 分类过滤
    if (category) {
      filteredProducts = filteredProducts.filter(product => product.category === category);
    }
    
    // 状态过滤
    if (status) {
      filteredProducts = filteredProducts.filter(product => product.status === status);
    }
    
    // 分页
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        products: paginatedProducts,
        total: filteredProducts.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取产品列表失败',
      error: error.message
    });
  }
});

/**
 * 获取单个产品
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取产品详情失败',
      error: error.message
    });
  }
});

/**
 * 创建产品
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, price, category, stock, status = 'active' } = req.body;
    
    const newProduct = {
      id: Date.now().toString(),
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    
    res.status(201).json({
      success: true,
      message: '产品创建成功',
      data: newProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '产品创建失败',
      error: error.message
    });
  }
});

/**
 * 更新产品
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }
    
    products[productIndex] = {
      ...products[productIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: '产品更新成功',
      data: products[productIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '产品更新失败',
      error: error.message
    });
  }
});

/**
 * 删除产品
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }
    
    products.splice(productIndex, 1);
    
    res.json({
      success: true,
      message: '产品删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '产品删除失败',
      error: error.message
    });
  }
});

/**
 * 批量操作
 */
router.post('/batch', async (req, res) => {
  try {
    const { action, ids, data } = req.body;
    
    switch (action) {
      case 'delete':
        products = products.filter(p => !ids.includes(p.id));
        break;
      case 'update':
        products = products.map(p => 
          ids.includes(p.id) 
            ? { ...p, ...data, updatedAt: new Date().toISOString() }
            : p
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的批量操作'
        });
    }
    
    res.json({
      success: true,
      message: `批量${action === 'delete' ? '删除' : '更新'}成功`,
      data: { affectedCount: ids.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
});

export default router;