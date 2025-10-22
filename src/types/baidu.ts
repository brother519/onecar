// 搜索建议类型定义
export type SuggestionType = 'history' | 'hot' | 'suggest';

// 搜索建议数据结构
export interface Suggestion {
  keyword: string;
  type: SuggestionType;
  highlightRange?: [number, number];
  searchVolume?: number;
}

// 热词数据模型
export interface HotWord {
  id: string;
  word: string;
  rank: number;
  trend: 'up' | 'down' | 'new' | 'stable';
  url: string;
}

// 导航项配置
export interface NavItem {
  name: string;
  url: string;
  displayCondition: boolean;
  requireAuth: boolean;
  children?: NavItem[];
}

// 产品导航配置
export interface ProductLink {
  name: string;
  url: string;
  category: 'company' | 'business' | 'legal' | 'service';
}

// 搜索建议API请求参数
export interface SearchSuggestionRequest {
  keyword: string;
  limit?: number;
}

// 搜索建议API响应
export interface SearchSuggestionResponse {
  success: boolean;
  data: Suggestion[];
  timestamp: number;
}

// 热词获取API请求参数
export interface HotWordsRequest {
  count?: number;
  category?: string;
}

// 热词获取API响应
export interface HotWordsResponse {
  success: boolean;
  data: HotWord[];
  updateTime: string;
}

// 用户信息
export interface UserInfo {
  id: string;
  username: string;
  avatar?: string;
  isLogin: boolean;
}

// 搜索历史记录项
export interface SearchHistoryItem {
  keyword: string;
  timestamp: number;
}
