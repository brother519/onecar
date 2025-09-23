// 产品相关类型定义
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  tags: string[];
  status: 'active' | 'inactive' | 'draft';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  sku: string;
  stock: number;
  watermark?: WatermarkConfig;
  qrCode?: string;
}

// 拖拽排序相关类型
export interface DragDropState {
  draggedItem: Product | null;
  dropZones: DropZone[];
  isDragging: boolean;
  sortOrder: string[];
}

export interface DropZone {
  id: string;
  type: string;
  accepts: string[];
}

// 虚拟滚动相关类型
export interface VirtualScrollConfig {
  itemHeight: number;
  bufferSize: number;
  containerHeight: number;
  threshold: number;
}

export interface VirtualScrollState {
  visibleStartIndex: number;
  visibleEndIndex: number;
  scrollTop: number;
  totalHeight: number;
}

// 无限滚动相关类型
export interface InfiniteScrollConfig {
  pageSize: number;
  loadThreshold: number;
  maxRetries: number;
  debounceMs: number;
}

export interface LoadingState {
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  currentPage: number;
}

// 验证码相关类型
export interface CaptchaConfig {
  width: number;
  height: number;
  length: number;
  noise: number;
  color: boolean;
}

export interface CaptchaResponse {
  token: string;
  image: string; // base64 encoded
  audio?: string; // base64 encoded for accessibility
}

// 代码编辑器相关类型
export type CodeLanguage = 'json' | 'html' | 'markdown' | 'javascript';

export interface CodeEditorConfig {
  language: CodeLanguage;
  theme: 'light' | 'dark';
  fontSize: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  minimap: boolean;
}

// 水印相关类型
export type WatermarkPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WatermarkConfig {
  content: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  color: string;
  rotation: number;
  type: 'text' | 'image';
  imageUrl?: string;
}

// 二维码相关类型
export type QRErrorLevel = 'L' | 'M' | 'Q' | 'H';

export interface QRCodeConfig {
  data: string;
  size: number;
  errorLevel: QRErrorLevel;
  margin: number;
  colorDark: string;
  colorLight: string;
  logo?: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 用户和权限相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: Permission[];
  avatar?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

// 系统配置类型
export interface SystemConfig {
  maxFileSize: number;
  supportedImageTypes: string[];
  supportedVideoTypes: string[];
  watermarkTemplates: WatermarkConfig[];
  qrCodeTemplates: QRCodeConfig[];
}

// 错误处理类型
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'PERMISSION_ERROR'
  | 'SERVER_ERROR'
  | 'NOT_FOUND_ERROR';

// 表单状态类型
export interface FormState<T = any> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}