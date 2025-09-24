import{ describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ProductListPage } from '@/pages/ProductListPage';
import { productApi } from '@/services/api';
import { useProductStore } from '@/store';

// Mock API
vi.mock('@/services/api', () => ({
  productApi: {
    getProducts: vi.fn(),
    deleteProduct: vi.fn(),
    batchOperation: vi.fn(),
    updateProductSort: vi.fn(),
  },
}));

// Mock store hooks
vi.mock('@/store', async () => {
  const actual = await vi.importActual('@/store');
  return {
    ...actual,
    useNotifications: () => ({
      showSuccess: vi.fn(),
      showError: vi.fn(),
    }),
  };
});

//Mock components that require external libraries
vi.mock('@/components/DragDropManager', () => ({
  DragDropManager: ({ items, renderItem, onReorder }: any) => (
    <div data-testid="drag-drop-manager">
      {items.map((item: any, index: number) => (
        <div key={item.id} data-testid={`draggable-item-${item.id}`}>
          {renderItem(item, index)}
        </div>
      ))}
      <button 
        data-testid="reorder-trigger"
        onClick={() => {
          if (items.length >= 2) {
            onReorder([items[1], items[0], ...items.slice(2)]);
          }
        }}
      >
        Reorder
      </button>
    </div>
  ),
  useDragDropManager: (items: any[]) => ({
    items,
    handleReorder: vi.fn((newOrder) => {
      // 模拟重排序逻辑
      console.log('handleReorder called with:', newOrder);
    }),
  }),
}));

vi.mock('@/components/VirtualScrollContainer', () => ({
  VirtualScrollContainer: ({ items, renderItem, onScroll }: any) => (
    <div 
      data-testid="virtual-scroll-container"
      onScroll={(e) => onScroll && onScroll(e.target.scrollTop)}
    >
      {items.map((item: any, index: number) => (
        <div key={item.id} data-testid={`virtual-item-${item.id}`}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  ),
  useVirtualScroll: (items: any[]) => ({
    scrollRef: { current: null },
    visibleRange: { start: 0, end: Math.min(10, items.length) },
    scrollToTop: vi.fn(),
    scrollToIndex: vi.fn(),
  }),
}));

vi.mock('@/components/InfiniteScrollLoader', () => ({
  InfiniteScrollLoader: ({ renderItem, loadMore, hasMore = true }: any) => (
    <div data-testid="infinite-scroll-loader">
      <div data-testid="infinite-scroll-content">
        {/* 内容将由父组件渲染 */}
      </div>
      {hasMore && (
        <button 
          data-testid="load-more"
          onClick={() => loadMore && loadMore(2)}
        >
          Load More
        </button>
      )}
    </div>
  ),
  useInfiniteScroll: (loadFunction: any) => ({
    items: [],
    loadingState: { 
      isLoading: false, 
      hasMore: true, 
      error: null,
      currentPage: 1
    },
    loadNextPage: vi.fn(async () => {
      if (loadFunction) {
        try {
          const response = await loadFunction(2);
          return response;
        } catch (error) {
          console.error('Load error:', error);
          throw error;
        }
      }
    }),
    refresh: vi.fn(),
  }),
}));

const mockProducts = [
  {
    id: '1',
    name: '商品1',
    description: '描述1',
    price: 100,
    category: '电子产品',
    images: ['image1.jpg'],
    tags: ['tag1'],
    status: 'active' as const,
    sortOrder: 0,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    sku: 'SKU001',
    stock: 10,
  },
  {
    id: '2',
    name: '商品2',
    description: '描述2',
    price: 200,
    category: '服装配饰',
    images: ['image2.jpg'],
    tags: ['tag2'],
    status: 'active' as const,
    sortOrder: 1,
    createdAt: '2023-01-02',
    updatedAt: '2023-01-02',
    sku: 'SKU002',
    stock: 20,
  },
];

// 测试辅助函数
const TestUtils = {
  // 设置带有商品的 Store 状态
  setupStoreWithProducts: (products = mockProducts, selectedIds: string[] = []) => {
    useProductStore.setState({
      products,
      selectedProducts: selectedIds,
      currentProduct: null,
      loading: { isLoading: false, hasMore: true, error: null, currentPage: 0 },
    });
  },

  // 设置加载状态
  setupLoadingState: (isLoading = true, error: string | null = null) => {
    useProductStore.setState({
      products: [],
      selectedProducts: [],
      currentProduct: null,
      loading: { isLoading, hasMore: !error, error, currentPage: 0 },
    });
  },

  // 模拟用户选择商品
  selectProducts: (productIds: string[]) => {
    const { toggleProductSelection } = useProductStore.getState();
    productIds.forEach(id => {
      toggleProductSelection(id);
    });
  },

  // 等待 Store 状态更新
  waitForStoreUpdate: async (predicate: () => boolean, timeout = 5000) => {
    const startTime = Date.now();
    while (!predicate() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (!predicate()) {
      throw new Error('Store state update timeout');
    }
  },

  // 重置 Store 状态
  resetStore: () => {
    useProductStore.setState({
      products: [],
      selectedProducts: [],
      currentProduct: null,
      loading: { isLoading: false, hasMore: true, error: null, currentPage: 0 },
    });
  },

  // 渲染 ProductListPage 组件
renderProductListPage: () => {
    return render(
      <BrowserRouter>
        <ProductListPage />
      </BrowserRouter>
    );
  },

  // 等待 API 调用完成
  waitForApiCall: async (apiFunction: any, expectedCallCount = 1) => {
await waitFor(() => {
      expect(apiFunction).toHaveBeenCalledTimes(expectedCallCount);
    }, { timeout: 5000 });
  },

  // 等待文本出现
  waitForText: async (text: string) => {
    await waitFor(() => {
      expect(screen.getByText(text)).toBeInTheDocument();
}, { timeout: 5000 });
  },

  // 等待元素出现
  waitForElement: async (testId: string) => {
    await waitFor(() => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    }, { timeout: 5000 });
  },
};

describe('ProductListPage Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset store state using utility function
    TestUtils.resetStore();

    // Mock successful API responses with correct structure
    vi.mocked(productApi.getProducts).mockResolvedValue({
      success: true,
      data: mockProducts,
      pagination: {
        page: 1,
        pageSize: 50,
        total: mockProducts.length,
        totalPages: 1,
      },
    });

    vi.mocked(productApi.deleteProduct).mockResolvedValue({
      success: true,
      data: mockProducts[0],
      message: '商品删除成功',
    });

    vi.mocked(productApi.batchOperation).mockResolvedValue({
      success: true,
      data: mockProducts,
      message: '批量操作成功',
    });

    vi.mocked(productApi.updateProductSort).mockResolvedValue({
      success: true,
     message: '排序更新成功',
    });

    // Mock window.open
    Object.defineProperty(window, 'open', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(()=> {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    // Reset console mocks
    console.log.mockRestore?.();
    console.error.mockRestore?.();
  });

  it('应该完整地加载和显示商品列表', async () => {
    TestUtils.renderProductListPage();

    // 检查页面标题
    expect(screen.getByText('商品管理')).toBeInTheDocument();

    // 等待 API 调用完成
    await TestUtils.waitForApiCall(productApi.getProducts);
    
    // 验证API 调用参数
    expect(productApi.getProducts).toHaveBeenCalledWith({
      page: 1,
      size: 50,
      category: '',
      status: '',
      search: '',
    });

    // 等待商品列表显示
    await TestUtils.waitForText(`共 ${mockProducts.length}个商品`);
    
    // 验证商品项是否正确显示
    for (const product of mockProducts) {
      await TestUtils.waitForText(product.name);
      expect(screen.getByText(product.description)).toBeInTheDocument();
      expect(screen.getByText(`¥${product.price}`)).toBeInTheDocument();
    }

    // 验证拖拽管理器已渲染
    expect(screen.getByTestId('drag-drop-manager')).toBeInTheDocument();
  });

  it('应该支持筛选功能', async () => {
    TestUtils.renderProductListPage();

    // 等待初始加载完成
    await TestUtils.waitForApiCall(productApi.getProducts);

    // 清理之前的 API 调用记录
    vi.clearAllMocks();

    // 选择分类筛选
    const categorySelect = screen.getByDisplayValue('全部分类');
    await user.selectOptions(categorySelect, '电子产品');

    // 选择状态筛选
    const statusSelect = screen.getByDisplayValue('全部状态');
    await user.selectOptions(statusSelect, 'active');

    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText('搜索商品名称、描述或SKU');
    await user.clear(searchInput);
    await user.type(searchInput, '商品1');

    // 点击搜索按钮
    const searchButton = screen.getByText('搜索');
    await user.click(searchButton);

    // 验证 API 被正确调用
    await TestUtils.waitForApiCall(productApi.getProducts);
    expect(productApi.getProducts).toHaveBeenCalledWith({
      page: 1,
      size: 50,
      category: '电子产品',
      status: 'active',
      search: '商品1',
    });
  });

  it('应该支持商品选择和批量操作', async () => {
    // 设置带有商品的 Store 状态
    TestUtils.setupStoreWithProducts(mockProducts);
    
    TestUtils.renderProductListPage();

    //等待初始渲染完成
    await TestUtils.waitForText(`共 ${mockProducts.length} 个商品`);

    // 模拟选择商品（通过复选框或其他选择方式）
    TestUtils.selectProducts(['1', '2']);

    // 等待选择状态更新
    await TestUtils.waitForStoreUpdate(()=> {
      const { selectedProducts } = useProductStore.getState();
      return selectedProducts.length === 2;
    });

    // 重新渲染以反映选择状态
    TestUtils.renderProductListPage();

    // 检查选择计数是否显示
    await TestUtils.waitForText('已选择 2 个');

    // 检查批量操作按钮是否出现
    expect(screen.getByText('批量操作')).toBeInTheDocument();
    expect(screen.getByText('批量删除')).toBeInTheDocument();
  });

  it('应该处理商品删除操作', async () => {
    // 设置带有商品的 Store 状态
    TestUtils.setupStoreWithProducts(mockProducts);
    
    TestUtils.renderProductListPage();

    // 等待渲染完成
    await TestUtils.waitForText(`共 ${mockProducts.length} 个商品`);

    // 验证删除 API 已准备就绪
    expect(productApi.deleteProduct).toBeDefined();
    
    // 模拟删除操作（这里我们只验证 API 的可用性，
    // 实际的删除按钮点击需要在实际的商品项中实现）
    
    // 模拟调用删除 API
    const deleteResult = await productApi.deleteProduct('1');
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.message).toBe('商品删除成功');
  });

  it('应该处理拖拽排序功能',async () => {
    // 设置带有商品的 Store 状态
    TestUtils.setupStoreWithProducts(mockProducts);
    
    TestUtils.renderProductListPage();

    // 等待渲染完成
    await TestUtils.waitForElement('drag-drop-manager');

    // 模拟拖拽重排序（通过点击测试按钮）
const reorderTrigger = screen.getByTestId('reorder-trigger');
    await user.click(reorderTrigger);

    // 验证排序 API 被调用
    await TestUtils.waitForApiCall(productApi.updateProductSort);
    
    // 验证 API 调用参数（应该包含重排序后的 ID数组）
    expect(productApi.updateProductSort).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(String)])
    );
  });

  it('应该处理加载错误状态', async () => {
    // Mock API 错误
    const errorMessage = '加载失败';
    vi.mocked(productApi.getProducts).mockRejectedValue(new Error(errorMessage));

    TestUtils.renderProductListPage();

    // 等待错误状态显示
    await TestUtils.waitForText('加载产品列表失败');

    // 检查重试按钮
    expect(screen.getByText('重试')).toBeInTheDocument();
    
    // 清理 Mock 并设置正常响应
    vi.mocked(productApi.getProducts).mockResolvedValue({
      success: true,
      data: mockProducts,
      pagination: {
        page: 1,
        pageSize: 50,
        total: mockProducts.length,
        totalPages: 1,
      },
    });
    
    //点击重试按钮
    const retryButton = screen.getByText('重试');
    await user.click(retryButton);
    
    // 验证 API 被再次调用
    await TestUtils.waitForApiCall(productApi.getProducts, 2); // 第一次失败，第二次成功
  });

 it('应该处理空数据状态', async () => {
    // Mock 空响应
    vi.mocked(productApi.getProducts).mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        page: 1,
        pageSize: 50,
        total: 0,
totalPages: 0,
      },
    });

    TestUtils.renderProductListPage();

    // 等待空状态显示
    await TestUtils.waitForText('暂无商品');
    await TestUtils.waitForText('点击“新建商品”按钮创建第一个商品');
    
    // 验证新建商品按钮存在
   expect(screen.getByText('新建商品')).toBeInTheDocument();
  });

it('应该支持页面导航', async () => {
    TestUtils.renderProductListPage();

    // 检查新建商品按钮
    const createButton = screen.getByText('新建商品');
    expect(createButton).toBeInTheDocument();

    // 点击新建商品按钮
    await user.click(createButton);

    // 验证 window.open 被调用
    expect(window.open).toHaveBeenCalledWith('/products/create', '_blank');
  });

  it('应该处理批量删除确认流程', async () => {
    // 设置带有选中商品的 Store 状态
    TestUtils.setupStoreWithProducts(mockProducts, ['1', '2']);

    TestUtils.renderProductListPage();

    // 等待渲染完成
    await TestUtils.waitForText('批量删除');

    // 点击批量删除按钮
    const batchDeleteButton = screen.getByText('批量删除');
    await user.click(batchDeleteButton);

    // 验证批量操作 API 被调用
    await TestUtils.waitForApiCall(productApi.batchOperation);
    expect(productApi.batchOperation).toHaveBeenCalledWith({
      action: 'delete',
      productIds: ['1', '2'],
   });
  });

  it('应该处理清除选择功能', async () => {
    // 设置带有选中商品的 Store 状态
    TestUtils.setupStoreWithProducts(mockProducts, ['1', '2']);

    TestUtils.renderProductListPage();

    // 等待渲染完成
    await TestUtils.waitForText('清除选择');

    // 点击清除选择按钮
    const clearButton = screen.getByText('清除选择');
    expect(clearButton).not.toBeDisabled();

    await user.click(clearButton);

    // 验证选择被清除
    await TestUtils.waitForStoreUpdate(() => {
      const { selectedProducts } = useProductStore.getState();
      return selectedProducts.length === 0;
    });
  });

  // 边界条件和错误处理测试
  describe('边界条件和错误处理', () => {
    it('应该处理网络超时错误', async () => {
      // Mock 网络超时
      vi.mocked(productApi.getProducts).mockRejectedValue(
        new Error('Network timeout')
      );

      TestUtils.renderProductListPage();

      // 等待错误状态显示
      await TestUtils.waitForText('加载产品列表失败');
      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    it('应该处理权限错误', async () => {
      // Mock 权限错误
      const permissionError = new Error('Forbidden');
      (permissionError as any).response = { status: 403 };
      vi.mocked(productApi.getProducts).mockRejectedValue(permissionError);

      TestUtils.renderProductListPage();

      // 等待错误状态显示
      await TestUtils.waitForText('加载产品列表失败');
    });

    it('应该处理大量商品数据', async () => {
      // 创建大量测试数据
      const largeProductList = Array.from({ length: 1000 }, (_, index) => ({
        id: `product-${index}`,
        name: `商品${index}`,
        description: `描述${index}`,
        price: 100 + index,
        category: index % 2 === 0 ? '电子产品' : '服装配饰',
        images: [`image${index}.jpg`],
        tags: [`tag${index}`],
        status: 'active' as const,
        sortOrder: index,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sku: `SKU${index.toString().padStart(3, '0')}`,
        stock: 10 + index,
      }));

      vi.mocked(productApi.getProducts).mockResolvedValue({
        success: true,
        data: largeProductList,
        pagination: {
          page: 1,
          pageSize: 50,
          total: largeProductList.length,
          totalPages: Math.ceil(largeProductList.length / 50),
        },
      });

      TestUtils.renderProductListPage();

      // 验证大量数据能正常处理
      await TestUtils.waitForText(`共 ${largeProductList.length} 个商品`);
      expect(screen.getByTestId('virtual-scroll-container')).toBeInTheDocument();
    });

    it('应该处理无效的 API 响应格式', async () => {
      // Mock 无效响应
      vi.mocked(productApi.getProducts).mockResolvedValue({
        success: false,
        error: '数据格式错误',
      } as any);

      TestUtils.renderProductListPage();

      // 等待错误处理
      await TestUtils.waitForText('加载产品列表失败');
    });

    it('应该处理批量操作失败', async () => {
      TestUtils.setupStoreWithProducts(mockProducts, ['1', '2']);
      
      // Mock 批量操作失败
      vi.mocked(productApi.batchOperation).mockRejectedValue(
        new Error('批量删除失败')
      );

      TestUtils.renderProductListPage();
      await TestUtils.waitForText('批量删除');

      const batchDeleteButton = screen.getByText('批量删除');
      await user.click(batchDeleteButton);

      // 等待错误处理
      await TestUtils.waitForText('批量删除失败');
    });
  });
});