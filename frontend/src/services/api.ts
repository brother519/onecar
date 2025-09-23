import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Product, ApiResponse, PaginatedResponse, CaptchaResponse } from '@/types';

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 创建 axios 实例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 添加认证 token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 添加请求 ID（用于调试）
      config.headers['X-Request-ID'] = Math.random().toString(36).substring(2);

      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });

      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });

      return response;
    },
    (error) => {
      console.error('❌ Response Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          method: error.config?.method,
          url: error.config?.url,
        },
      });

      // 处理特定错误
      if (error.response?.status === 401) {
        // Token 过期或无效
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// API 实例
const api = createApiInstance();

// 产品 API
export const productApi = {
  // 获取产品列表
  getProducts: async (params: {
    page?: number;
    size?: number;
    category?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // 获取单个产品
  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // 创建产品
  createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> => {
    const response = await api.post('/products', product);
    return response.data;
  },

  // 更新产品
  updateProduct: async (id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> => {
    const response = await api.put(`/products/${id}`, updates);
    return response.data;
  },

  // 删除产品
  deleteProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // 更新产品排序
  updateProductSort: async (sortOrder: string[]): Promise<ApiResponse<void>> => {
    const response = await api.put('/products/sort', { sortOrder });
    return response.data;
  },

  // 批量操作产品
  batchOperation: async (params: {
    action: 'delete' | 'update';
    productIds: string[];
    updateData?: Partial<Product>;
  }): Promise<ApiResponse<Product[]>> => {
    const response = await api.post('/products/batch', params);
    return response.data;
  },
};

// 验证码 API
export const captchaApi = {
  // 获取验证码
  getCaptcha: async (): Promise<ApiResponse<CaptchaResponse>> => {
    const response = await api.get('/captcha');
    return response.data;
  },

  // 验证验证码
  verifyCaptcha: async (token: string, value: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/captcha/verify', { token, value });
    return response.data;
  },

  // 刷新验证码
  refreshCaptcha: async (token: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/captcha/refresh', { token });
    return response.data;
  },
};

// 文件上传 API
export const uploadApi = {
  // 上传单个文件
  uploadFile: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ url: string; filename: string; size: number }>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  // 批量上传文件
  uploadFiles: async (
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<Array<{ url: string; filename: string; size: number }>>> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    const response = await api.post('/upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },
};

// 水印 API
export const watermarkApi = {
  // 添加水印
  addWatermark: async (params: {
    imageUrl: string;
    watermarkConfig: any;
  }): Promise<ApiResponse<{ watermarkedImageUrl: string }>> => {
    const response = await api.post('/watermark', params);
    return response.data;
  },

  // 批量添加水印
  batchWatermark: async (params: {
    imageUrls: string[];
    watermarkConfig: any;
  }): Promise<ApiResponse<Array<{ imageUrl: string; watermarkedImageUrl: string }>>> => {
    const response = await api.post('/watermark/batch', params);
    return response.data;
  },
};

// 二维码 API
export const qrcodeApi = {
  // 生成二维码
  generateQRCode: async (params: {
    data: string;
    config?: any;
  }): Promise<ApiResponse<{ qrCodeUrl: string }>> => {
    const response = await api.post('/qrcode', params);
    return response.data;
  },

  // 批量生成二维码
  batchGenerateQRCode: async (
    items: Array<{ id: string; data: string }>
  ): Promise<ApiResponse<Array<{ id: string; qrCodeUrl: string }>>> => {
    const response = await api.post('/qrcode/batch', { items });
    return response.data;
  },
};

// 通用请求方法
export const apiRequest = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get(url, config);
    return response.data;
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete(url, config);
    return response.data;
  },

  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.patch(url, data, config);
    return response.data;
  },
};

// 错误处理工具
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return '发生未知错误';
};

// API 状态检查
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'ok';
  } catch {
    return false;
  }
};

// 导出默认 API 实例
export default api;