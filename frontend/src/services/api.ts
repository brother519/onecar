/**
 * API 服务模块
 * 
 * 这个模块提供了与后端 API 交互的所有方法，包括：
 * - HTTP 客户端配置和拦截器
 * - 产品管理相关的 API 接口
 * - 验证码服务 API
 * - 文件上传服务 API
 * - 水印处理 API
 * - 二维码生成 API
 * - 通用请求方法和错误处理
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Product, ApiResponse, PaginatedResponse, CaptchaResponse } from '@/types';

/**
 * API 基础配置
 * 从环境变量中获取 API 基础 URL，如果未设置则使用默认的本地开发地址
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * 创建配置好的 Axios 实例
 * 
 * 该函数创建一个预配置的 HTTP 客户端实例，包含：
 * - 基础 URL 配置
 * - 超时设置（30秒）
 * - 默认请求头
 * - 请求和响应拦截器
 * 
 * @returns {AxiosInstance} 配置完成的 Axios 实例
 */
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * 请求拦截器
   * 
   * 在每个请求发送前执行以下操作：
   * 1. 从本地存储中获取认证 token 并添加到请求头
   * 2. 生成唯一的请求 ID 用于调试追踪
   * 3. 记录请求日志
   */
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

  /**
   * 响应拦截器
   * 
   * 处理所有 API 响应：
   * 1. 记录成功响应的日志
   * 2. 统一处理错误响应
   * 3. 处理 401 未授权错误（自动跳转登录页）
   */
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

/**
 * 产品管理 API 接口
 * 
 * 提供产品的增删改查和批量操作功能
 * 支持分页、排序、筛选和搜索功能
 */
export const productApi = {
  /**
   * 获取产品列表
   * 
   * @param params 查询参数
   * @param params.page 页码（从 1 开始）
   * @param params.size 每页数量
   * @param params.category 产品分类筛选
   * @param params.status 产品状态筛选（active/inactive）
   * @param params.search 搜索关键词（支持名称、描述搜索）
   * @param params.sortBy 排序字段（name/price/createdAt）
   * @param params.sortOrder 排序方向（asc/desc）
   * @returns {Promise<PaginatedResponse<Product>>} 分页的产品列表数据
   */
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

  /**
   * 获取单个产品详情
   * 
   * @param id 产品 ID
   * @returns {Promise<ApiResponse<Product>>} 产品详情数据
   */
  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * 创建新产品
   * 
   * @param product 产品数据（不包含 id、createdAt、updatedAt）
   * @returns {Promise<ApiResponse<Product>>} 创建成功的产品数据
   */
  createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> => {
    const response = await api.post('/products', product);
    return response.data;
  },

  /**
   * 更新产品信息
   * 
   * @param id 产品 ID
   * @param updates 要更新的字段数据（部分更新）
   * @returns {Promise<ApiResponse<Product>>} 更新后的产品数据
   */
  updateProduct: async (id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> => {
    const response = await api.put(`/products/${id}`, updates);
    return response.data;
  },

  /**
   * 删除产品
   * 
   * @param id 产品 ID
   * @returns {Promise<ApiResponse<Product>>} 删除的产品数据
   */
  deleteProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * 更新产品排序
   * 
   * 用于拖拽排序后更新产品的显示顺序
   * @param sortOrder 排序后的产品 ID 数组
   * @returns {Promise<ApiResponse<void>>} 更新结果
   */
  updateProductSort: async (sortOrder: string[]): Promise<ApiResponse<void>> => {
    const response = await api.put('/products/sort', { sortOrder });
    return response.data;
  },

  /**
   * 批量操作产品
   * 
   * 支持批量删除和批量更新操作
   * @param params 批量操作参数
   * @param params.action 操作类型（delete 或 update）
   * @param params.productIds 要操作的产品 ID 数组
   * @param params.updateData 更新数据（仅在 action 为 update 时必填）
   * @returns {Promise<ApiResponse<Product[]>>} 操作结果
   */
  batchOperation: async (params: {
    action: 'delete' | 'update';
    productIds: string[];
    updateData?: Partial<Product>;
  }): Promise<ApiResponse<Product[]>> => {
    const response = await api.post('/products/batch', params);
    return response.data;
  },
};

/**
 * 验证码服务 API
 * 
 * 提供验证码的生成、验证和刷新功能
 * 用于表单提交的安全性验证
 */
export const captchaApi = {
  /**
   * 获取验证码
   * 
   * 生成一个新的验证码图片和对应的 token
   * @returns {Promise<ApiResponse<CaptchaResponse>>} 验证码数据（包含图片 base64 和 token）
   */
  getCaptcha: async (): Promise<ApiResponse<CaptchaResponse>> => {
    const response = await api.get('/captcha');
    return response.data;
  },

  /**
   * 验证验证码
   * 
   * 验证用户输入的验证码是否正确
   * @param token 验证码 token（由 getCaptcha 接口返回）
   * @param value 用户输入的验证码值
   * @returns {Promise<ApiResponse<void>>} 验证结果
   */
  verifyCaptcha: async (token: string, value: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/captcha/verify', { token, value });
    return response.data;
  },

  /**
   * 刷新验证码
   * 
   * 使当前验证码 token 失效，要求前端重新获取验证码
   * @param token 当前验证码 token
   * @returns {Promise<ApiResponse<void>>} 刷新结果
   */
  refreshCaptcha: async (token: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/captcha/refresh', { token });
    return response.data;
  },
};

/**
 * 文件上传 API
 * 
 * 提供单文件和多文件上传功能
 * 支持上传进度追踪，返回文件 URL 和元数据
 */
export const uploadApi = {
  /**
   * 上传单个文件
   * 
   * @param file 要上传的文件对象
   * @param onProgress 上传进度回调函数（参数为 0-100 的进度百分比）
   * @returns {Promise<ApiResponse<{url: string, filename: string, size: number}>>} 上传结果
   */
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

  /**
   * 批量上传文件
   * 
   * @param files 要上传的文件数组
   * @param onProgress 上传进度回调函数（参数为 0-100 的进度百分比）
   * @returns {Promise<ApiResponse<Array<{url: string, filename: string, size: number}>>>} 批量上传结果
   */
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

/**
 * 水印处理 API
 * 
 * 提供图片水印添加功能
 * 支持单张和批量水印处理
 */
export const watermarkApi = {
  /**
   * 添加水印
   * 
   * 为单张图片添加水印
   * @param params 水印参数
   * @param params.imageUrl 原始图片 URL
   * @param params.watermarkConfig 水印配置（位置、透明度、大小等）
   * @returns {Promise<ApiResponse<{watermarkedImageUrl: string}>>} 水印处理结果
   */
  addWatermark: async (params: {
    imageUrl: string;
    watermarkConfig: any; // WatermarkConfig type
  }): Promise<ApiResponse<{ watermarkedImageUrl: string }>> => {
    const response = await api.post('/watermark', params);
    return response.data;
  },

  /**
   * 批量添加水印
   * 
   * 为多张图片批量添加相同的水印
   * @param params 批量水印参数
   * @param params.imageUrls 原始图片 URL 数组
   * @param params.watermarkConfig 水印配置（应用于所有图片）
   * @returns {Promise<ApiResponse<Array<{imageUrl: string, watermarkedImageUrl: string}>>>} 批量水印处理结果
   */
  batchWatermark: async (params: {
    imageUrls: string[];
    watermarkConfig: any; // WatermarkConfig type
  }): Promise<ApiResponse<Array<{ imageUrl: string; watermarkedImageUrl: string }>>> => {
    const response = await api.post('/watermark/batch', params);
    return response.data;
  },
};

/**
 * 二维码生成 API
 * 
 * 提供二维码生成和批量生成功能
 * 支持自定义二维码样式和大小
 */
export const qrcodeApi = {
  /**
   * 生成二维码
   * 
   * 为指定数据生成二维码图片
   * @param params 二维码参数
   * @param params.data 要编码的数据（文本、URL 等）
   * @param params.config 二维码配置（可选）如大小、颜色、错误纠正级别等
   * @returns {Promise<ApiResponse<{qrCodeUrl: string}>>} 二维码生成结果
   */
  generateQRCode: async (params: {
    data: string;
    config?: any; // QRCodeConfig type
  }): Promise<ApiResponse<{ qrCodeUrl: string }>> => {
    const response = await api.post('/qrcode', params);
    return response.data;
  },

  /**
   * 批量生成二维码
   * 
   * 为多个数据批量生成二维码
   * @param items 要生成二维码的数据项数组
   * @param items[].id 数据项的唯一标识符
   * @param items[].data 要编码的数据
   * @returns {Promise<ApiResponse<Array<{id: string, qrCodeUrl: string}>>>} 批量生成结果
   */
  batchGenerateQRCode: async (
    items: Array<{ id: string; data: string }>
  ): Promise<ApiResponse<Array<{ id: string; qrCodeUrl: string }>>> => {
    const response = await api.post('/qrcode/batch', { items });
    return response.data;
  },
};

/**
 * 通用请求方法
 * 
 * 封装了基本的 HTTP 请求方法，提供更简洁的 API 调用方式
 * 自动带有认证信息和错误处理
 */
export const apiRequest = {
  /**
   * GET 请求
   * 
   * @template T 响应数据类型
   * @param url 请求 URL
   * @param config 额外的 axios 配置
   * @returns {Promise<T>} 请求响应数据
   */
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get(url, config);
    return response.data;
  },

  /**
   * POST 请求
   * 
   * @template T 响应数据类型
   * @param url 请求 URL
   * @param data 请求数据
   * @param config 额外的 axios 配置
   * @returns {Promise<T>} 请求响应数据
   */
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  /**
   * PUT 请求
   * 
   * @template T 响应数据类型
   * @param url 请求 URL
   * @param data 请求数据
   * @param config 额外的 axios 配置
   * @returns {Promise<T>} 请求响应数据
   */
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  /**
   * DELETE 请求
   * 
   * @template T 响应数据类型
   * @param url 请求 URL
   * @param config 额外的 axios 配置
   * @returns {Promise<T>} 请求响应数据
   */
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete(url, config);
    return response.data;
  },

  /**
   * PATCH 请求
   * 
   * @template T 响应数据类型
   * @param url 请求 URL
   * @param data 请求数据
   * @param config 额外的 axios 配置
   * @returns {Promise<T>} 请求响应数据
   */
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.patch(url, data, config);
    return response.data;
  },
};

/**
 * 错误处理工具函数
 * 
 * 提取和格式化 API 请求错误信息
 * 优先使用服务器返回的错误消息，否则使用默认错误信息
 * 
 * @param error 错误对象（通常是 AxiosError）
 * @returns {string} 格式化后的错误信息
 */
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return '发生未知错误';
};

/**
 * API 服务健康状态检查
 * 
 * 检查后端 API 服务是否正常运行
 * 可用于应用初始化时的连接性检查
 * 
 * @returns {Promise<boolean>} true 表示 API 服务正常，false 表示服务不可用
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'ok';
  } catch {
    return false;
  }
};

/**
 * 默认导出的 API 实例
 * 
 * 已配置好的 axios 实例，包含：
 * - 基础 URL 和超时设置
 * - 认证信息自动添加
 * - 请求和响应日志
 * - 错误处理和重定向
 * 
 * 可直接使用该实例进行自定义 API 调用
 */
export default api;