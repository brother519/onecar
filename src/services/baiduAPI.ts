import { 
  SearchSuggestionRequest, 
  SearchSuggestionResponse,
  HotWordsRequest,
  HotWordsResponse
} from '../types/baidu';
import { generateSuggestions, mockHotWords } from './baiduMockData';

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 搜索建议API
export const fetchSearchSuggestions = async (
  params: SearchSuggestionRequest
): Promise<SearchSuggestionResponse> => {
  // 模拟网络延迟
  await delay(100 + Math.random() * 100);
  
  const suggestions = generateSuggestions(params.keyword);
  const limited = suggestions.slice(0, params.limit || 10);
  
  return {
    success: true,
    data: limited,
    timestamp: Date.now()
  };
};

// 获取热词API
export const fetchHotWords = async (
  params: HotWordsRequest = {}
): Promise<HotWordsResponse> => {
  // 模拟网络延迟
  await delay(200);
  
  const count = params.count || 10;
  const words = mockHotWords.slice(0, count);
  
  return {
    success: true,
    data: words,
    updateTime: new Date().toISOString()
  };
};

// 请求缓存
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class APICache {
  private cache = new Map<string, CacheItem<any>>();
  private maxAge = 5 * 60 * 1000; // 5分钟缓存
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new APICache();

// 带缓存的搜索建议
export const fetchSearchSuggestionsWithCache = async (
  params: SearchSuggestionRequest
): Promise<SearchSuggestionResponse> => {
  const cacheKey = `suggestions_${params.keyword}`;
  const cached = apiCache.get<SearchSuggestionResponse>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetchSearchSuggestions(params);
  apiCache.set(cacheKey, response);
  
  return response;
};
