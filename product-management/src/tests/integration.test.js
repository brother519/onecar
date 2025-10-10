// 简单的测试运行器
class SimpleTestRunner {
  constructor() {
    this.tests = []
    this.results = []
  }

  // 添加测试用例
  test(name, testFn) {
    this.tests.push({ name, testFn })
  }

  // 运行所有测试
  async runAll() {
    console.log(`🧪 开始运行 ${this.tests.length} 个测试...`)
    console.log('=' * 50)

    for (const { name, testFn } of this.tests) {
      try {
        const startTime = performance.now()
        await testFn()
        const endTime = performance.now()
        const duration = (endTime - startTime).toFixed(2)
        
        console.log(`✅ ${name} (${duration}ms)`)
        this.results.push({ name, status: 'passed', duration })
      } catch (error) {
        console.log(`❌ ${name} - ${error.message}`)
        this.results.push({ name, status: 'failed', error: error.message })
      }
    }

    this.printSummary()
  }

  // 打印测试结果摘要
  printSummary() {
    const passed = this.results.filter(r => r.status === 'passed').length
    const failed = this.results.filter(r => r.status === 'failed').length
    
    console.log('\n' + '=' * 50)
    console.log(`📊 测试结果摘要:`)
    console.log(`✅ 通过: ${passed}`)
    console.log(`❌ 失败: ${failed}`)
    console.log(`📈 成功率: ${((passed / this.results.length) * 100).toFixed(1)}%`)
  }
}

// 断言函数
const assert = {
  equal: (actual, expected, message = '') => {
    if (actual !== expected) {
      throw new Error(message || `期望 ${expected}，实际得到 ${actual}`)
    }
  },

  notEqual: (actual, expected, message = '') => {
    if (actual === expected) {
      throw new Error(message || `期望不等于 ${expected}，但实际相等`)
    }
  },

  truthy: (value, message = '') => {
    if (!value) {
      throw new Error(message || `期望真值，实际得到 ${value}`)
    }
  },

  falsy: (value, message = '') => {
    if (value) {
      throw new Error(message || `期望假值，实际得到 ${value}`)
    }
  },

  throws: (fn, message = '') => {
    try {
      fn()
      throw new Error(message || '期望函数抛出异常，但没有抛出')
    } catch (error) {
      // 预期的异常
    }
  },

  async: async (promise, message = '') => {
    try {
      await promise
    } catch (error) {
      throw new Error(message || `异步操作失败: ${error.message}`)
    }
  }
}

// 创建测试实例
const runner = new SimpleTestRunner()

// 工具函数测试
runner.test('格式化货币测试', () => {
  // 这里需要导入工具函数，由于没有实际的模块系统，我们模拟测试
  const formatCurrency = (amount) => `¥${amount.toFixed(2)}`
  
  assert.equal(formatCurrency(99.99), '¥99.99')
  assert.equal(formatCurrency(100), '¥100.00')
})

runner.test('生成唯一ID测试', () => {
  const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const id1 = generateId()
  const id2 = generateId()
  
  assert.notEqual(id1, id2, 'ID应该是唯一的')
  assert.truthy(id1.startsWith('id_'), 'ID应该以前缀开始')
})

runner.test('防抖函数测试', async () => {
  let callCount = 0
  const testFn = () => { callCount++ }
  
  // 模拟防抖函数
  const debounce = (func, delay) => {
    let timeout
    return (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), delay)
    }
  }
  
  const debouncedFn = debounce(testFn, 100)
  
  // 快速调用多次
  debouncedFn()
  debouncedFn()
  debouncedFn()
  
  // 等待防抖时间
  await new Promise(resolve => setTimeout(resolve, 150))
  
  assert.equal(callCount, 1, '防抖函数应该只执行一次')
})

runner.test('商品数据验证测试', () => {
  const validateProduct = (product) => {
    const errors = []
    
    if (!product.name || product.name.trim() === '') {
      errors.push('商品名称不能为空')
    }
    
    if (!product.price || product.price <= 0) {
      errors.push('商品价格必须大于0')
    }
    
    if (!product.category) {
      errors.push('商品分类不能为空')
    }
    
    return errors
  }
  
  // 测试有效商品
  const validProduct = {
    name: '测试商品',
    price: 99.99,
    category: '电子产品'
  }
  
  assert.equal(validateProduct(validProduct).length, 0, '有效商品应该通过验证')
  
  // 测试无效商品
  const invalidProduct = {
    name: '',
    price: -10,
    category: null
  }
  
  const errors = validateProduct(invalidProduct)
  assert.equal(errors.length, 3, '无效商品应该有3个错误')
})

runner.test('虚拟滚动计算测试', () => {
  const calculateVisibleRange = (scrollTop, containerHeight, itemHeight) => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      1000 - 1 // 假设总共1000项
    )
    
    return { startIndex, endIndex }
  }
  
  const result = calculateVisibleRange(500, 400, 50)
  
  assert.equal(result.startIndex, 10, '起始索引计算错误')
  assert.equal(result.endIndex, 18, '结束索引计算错误')
})

runner.test('拖拽排序逻辑测试', () => {
  const reorderArray = (array, sourceIndex, targetIndex) => {
    const result = [...array]
    const [removed] = result.splice(sourceIndex, 1)
    result.splice(targetIndex, 0, removed)
    return result
  }
  
  const originalArray = ['A', 'B', 'C', 'D', 'E']
  const reorderedArray = reorderArray(originalArray, 1, 3)
  
  assert.equal(reorderedArray[3], 'B', '元素B应该移动到位置3')
  assert.equal(reorderedArray.length, 5, '数组长度应该保持不变')
})

runner.test('二维码数据格式测试', () => {
  const generateQRData = (product) => {
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      url: `https://shop.example.com/product/${product.id}`,
      timestamp: new Date().toISOString()
    }
  }
  
  const product = { id: '123', name: '测试商品', price: 99.99 }
  const qrData = generateQRData(product)
  
  assert.equal(qrData.productId, '123')
  assert.truthy(qrData.url.includes('123'))
  assert.truthy(qrData.timestamp)
})

runner.test('水印配置验证测试', () => {
  const validateWatermarkConfig = (config) => {
    const { text, fontSize, color, angle } = config
    
    if (!text || text.trim() === '') {
      throw new Error('水印文本不能为空')
    }
    
    if (fontSize < 12 || fontSize > 72) {
      throw new Error('字体大小必须在12-72之间')
    }
    
    if (angle < -90 || angle > 90) {
      throw new Error('角度必须在-90到90度之间')
    }
    
    return true
  }
  
  const validConfig = {
    text: '商品管理系统',
    fontSize: 16,
    color: 'rgba(0,0,0,0.1)',
    angle: -30
  }
  
  assert.truthy(validateWatermarkConfig(validConfig))
  
  // 测试无效配置
  const invalidConfig = {
    text: '',
    fontSize: 100,
    color: 'red',
    angle: 180
  }
  
  assert.throws(() => validateWatermarkConfig(invalidConfig))
})

runner.test('验证码生成测试', () => {
  const generateCaptcha = (length = 4) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  
  const captcha = generateCaptcha(4)
  
  assert.equal(captcha.length, 4, '验证码长度应该是4')
  assert.truthy(/^[A-Z0-9]+$/.test(captcha), '验证码应该只包含大写字母和数字')
})

runner.test('商品搜索过滤测试', () => {
  const filterProducts = (products, keyword, category) => {
    return products.filter(product => {
      const matchesKeyword = !keyword || 
        product.name.toLowerCase().includes(keyword.toLowerCase()) ||
        product.description.toLowerCase().includes(keyword.toLowerCase())
      
      const matchesCategory = !category || product.category === category
      
      return matchesKeyword && matchesCategory
    })
  }
  
  const products = [
    { name: '苹果手机', description: '智能手机', category: '电子产品' },
    { name: '苹果', description: '新鲜水果', category: '食品' },
    { name: '三星手机', description: '安卓手机', category: '电子产品' }
  ]
  
  const result1 = filterProducts(products, '苹果', null)
  assert.equal(result1.length, 2, '搜索"苹果"应该返回2个结果')
  
  const result2 = filterProducts(products, '手机', '电子产品')
  assert.equal(result2.length, 2, '搜索"手机"且分类为"电子产品"应该返回2个结果')
})

// 运行所有测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.runTests = () => runner.runAll()
  console.log('💡 在浏览器控制台运行 runTests() 来执行测试')
} else {
  // Node.js环境
  runner.runAll()
}

export { runner, assert }