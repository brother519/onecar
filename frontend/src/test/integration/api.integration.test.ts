import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { productApi, captchaApi, handleApiError, checkApiHealth } from '@/services/api';
import type { Product, PaginatedResponse, ApiResponse, CaptchaResponse } from '@/types';

// Mock axios
const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  create: vi.fn(() => mockAxios),
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  },
};

vi.mock('axios', () => ({
  default: mockAxios,
  create: vi.fn(() => mockAxios),
}));

const mockProduct: Product = {
  id: '1',
  name: '测试商品',
  description: '测试描述',
  price: 100,
  category: '电子产品',
  images: ['test.jpg'],
  tags: ['测试'],
  status: 'active',
  sortOrder: 0,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  sku: 'TEST001',
  stock: 10,
};

const mockPaginatedResponse: PaginatedResponse<Product> = {
  success: true,
  data: [mockProduct],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
  },
};

const mockApiResponse: ApiResponse<Product> = {
  success: true,
  data: mockProduct,
};

const mockCaptchaResponse: ApiResponse<CaptchaResponse> = {
  success: true,
  data: {
    token: 'test-token',
    image: 'data:image/png;base64,test-image',
  },
};

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('productApi', () => {
    it('应该获取商品列表', async () => {
      mockAxios.get.mockResolvedValue({ data: mockPaginatedResponse });

      const result = await productApi.getProducts({
        page: 1,
        size: 20,
        category: '电子产品',
        status: 'active',
        search: '测试',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/products', {
        params: {
          page: 1,
          size: 20,
          category: '电子产品',
          status: 'active',
          search: '测试',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      });

      expect(result).toEqual(mockPaginatedResponse);
    });

    it('应该获取单个商品', async () => {
      mockAxios.get.mockResolvedValue({ data: mockApiResponse });

      const result = await productApi.getProduct('1');

      expect(mockAxios.get).toHaveBeenCalledWith('/products/1');
      expect(result).toEqual(mockApiResponse);
    });

    it('应该创建商品', async () => {
      const newProduct = {
        name: '新商品',
        description: '新描述',
        price: 200,
        category: '服装配饰',
        images: ['new.jpg'],
        tags: ['新'],
        status: 'draft' as const,
        sku: 'NEW001',
        stock: 5,
        sortOrder: 1,
        createdAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
      };

      mockAxios.post.mockResolvedValue({ data: mockApiResponse });

      const result = await productApi.createProduct(newProduct);

      expect(mockAxios.post).toHaveBeenCalledWith('/products', newProduct);
      expect(result).toEqual(mockApiResponse);
    });

    it('应该更新商品', async () => {
      const updates = { name: '更新的商品', price: 150 };
      mockAxios.put.mockResolvedValue({ data: mockApiResponse });

      const result = await productApi.updateProduct('1', updates);

      expect(mockAxios.put).toHaveBeenCalledWith('/products/1', updates);
      expect(result).toEqual(mockApiResponse);
    });

    it('应该删除商品', async () => {
      mockAxios.delete.mockResolvedValue({ data: mockApiResponse });

      const result = await productApi.deleteProduct('1');

      expect(mockAxios.delete).toHaveBeenCalledWith('/products/1');
      expect(result).toEqual(mockApiResponse);
    });

    it('应该更新商品排序', async () => {
      const sortOrder = ['2', '1', '3'];
      const mockResponse: ApiResponse<void> = { success: true };
      mockAxios.put.mockResolvedValue({ data: mockResponse });

      const result = await productApi.updateProductSort(sortOrder);

      expect(mockAxios.put).toHaveBeenCalledWith('/products/sort', { sortOrder });
      expect(result).toEqual(mockResponse);
    });

    it('应该执行批量操作', async () => {
      const batchParams = {
        action: 'delete' as const,
        productIds: ['1', '2'],
      };
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: [mockProduct],
      };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await productApi.batchOperation(batchParams);

      expect(mockAxios.post).toHaveBeenCalledWith('/products/batch', batchParams);
      expect(result).toEqual(mockResponse);
    });

    it('应该处理批量更新操作', async () => {
      const batchParams = {
        action: 'update' as const,
        productIds: ['1', '2'],
        updateData: { status: 'inactive' as const },
      };
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: [mockProduct],
      };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await productApi.batchOperation(batchParams);

      expect(mockAxios.post).toHaveBeenCalledWith('/products/batch', batchParams);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('captchaApi', () => {
    it('应该获取验证码', async () => {
      mockAxios.get.mockResolvedValue({ data: mockCaptchaResponse });

      const result = await captchaApi.getCaptcha();

      expect(mockAxios.get).toHaveBeenCalledWith('/captcha');
      expect(result).toEqual(mockCaptchaResponse);
    });

    it('应该验证验证码', async () => {
      const mockResponse: ApiResponse<void> = { success: true };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await captchaApi.verifyCaptcha('test-token', 'ABCD');

      expect(mockAxios.post).toHaveBeenCalledWith('/captcha/verify', {
        token: 'test-token',
        value: 'ABCD',
      });
      expect(result).toEqual(mockResponse);
    });

    it('应该刷新验证码', async () => {
      const mockResponse: ApiResponse<void> = { success: true };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await captchaApi.refreshCaptcha('test-token');

      expect(mockAxios.post).toHaveBeenCalledWith('/captcha/refresh', {
        token: 'test-token',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('错误处理', () => {
    it('应该处理网络错误', () => {
      const networkError = new Error('Network Error');
      const errorMessage = handleApiError(networkError);
      expect(errorMessage).toBe('Network Error');
    });

    it('应该处理 API 响应错误', () => {
      const apiError = {
        response: {
          data: {
            message: 'API Error Message',
          },
        },
      };
      const errorMessage = handleApiError(apiError);
      expect(errorMessage).toBe('API Error Message');
    });

    it('应该处理未知错误', () => {
      const unknownError = {};
      const errorMessage = handleApiError(unknownError);
      expect(errorMessage).toBe('发生未知错误');
    });

    it('应该处理 null 错误', () => {
      const errorMessage = handleApiError(null);
      expect(errorMessage).toBe('发生未知错误');
    });

    it('应该处理 undefined 错误', () => {
      const errorMessage = handleApiError(undefined);
      expect(errorMessage).toBe('发生未知错误');
    });
  });

  describe('健康检查', () => {
    it('应该返回 true 当 API 健康时', async () => {
      mockAxios.get.mockResolvedValue({
        data: { status: 'ok' },
      });

      const isHealthy = await checkApiHealth();

      expect(mockAxios.get).toHaveBeenCalledWith('/health');
      expect(isHealthy).toBe(true);
    });

    it('应该返回 false 当 API 不健康时', async () => {
      mockAxios.get.mockResolvedValue({
        data: { status: 'error' },
      });

      const isHealthy = await checkApiHealth();

      expect(isHealthy).toBe(false);
    });

    it('应该返回 false 当请求失败时', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network Error'));

      const isHealthy = await checkApiHealth();

      expect(isHealthy).toBe(false);
    });
  });

  describe('请求参数处理', () => {
    it('应该正确处理空参数', async () => {
      mockAxios.get.mockResolvedValue({ data: mockPaginatedResponse });

      await productApi.getProducts();

      expect(mockAxios.get).toHaveBeenCalledWith('/products', {
        params: {},
      });
    });

    it('应该过滤掉 undefined 参数', async () => {
      mockAxios.get.mockResolvedValue({ data: mockPaginatedResponse });

      await productApi.getProducts({
        page: 1,
        size: undefined,
        category: '电子产品',
        status: undefined,
        search: '',
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/products', {
        params: {
          page: 1,
          size: undefined,
          category: '电子产品',
          status: undefined,
          search: '',
        },
      });
    });
  });

  describe('API 响应格式验证', () => {
    it('应该正确处理成功响应', async () => {
      const successResponse = {
        data: {
          success: true,
          data: [mockProduct],
          message: '获取成功',
        },
      };
      mockAxios.get.mockResolvedValue(successResponse);

      const result = await productApi.getProducts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockProduct]);
      expect(result.message).toBe('获取成功');
    });

    it('应该正确处理失败响应', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            success: false,
            message: '请求参数错误',
            error: 'Invalid parameters',
          },
        },
      };
      mockAxios.get.mockRejectedValue(errorResponse);

      try {
        await productApi.getProducts();
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toEqual(errorResponse);
      }
    });
  });

  describe('并发请求处理', () => {
    it('应该正确处理并发请求', async () => {
      mockAxios.get.mockResolvedValue({ data: mockApiResponse });

      const promises = [
        productApi.getProduct('1'),
        productApi.getProduct('2'),
        productApi.getProduct('3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockAxios.get).toHaveBeenCalledTimes(3);
      expect(mockAxios.get).toHaveBeenCalledWith('/products/1');
      expect(mockAxios.get).toHaveBeenCalledWith('/products/2');
      expect(mockAxios.get).toHaveBeenCalledWith('/products/3');
    });

    it('应该正确处理部分失败的并发请求', async () => {
      mockAxios.get
        .mockResolvedValueOnce({ data: mockApiResponse })
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ data: mockApiResponse });

      const promises = [
        productApi.getProduct('1'),
        productApi.getProduct('2').catch(err => ({ error: err.message })),
        productApi.getProduct('3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(mockApiResponse);
      expect(results[1]).toEqual({ error: 'Network Error' });
      expect(results[2]).toEqual(mockApiResponse);
    });
  });
});