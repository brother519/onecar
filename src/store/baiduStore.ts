/**
 * 百度首页状态管理
 * 使用 Zustand 管理搜索、UI、热词、用户等状态
 * 分离成多个 Store 便于管理和复用
 */
import { create } from 'zustand';
import { Suggestion, HotWord, SearchHistoryItem, UserInfo } from '../types/baidu';

/**
 * 搜索相关状态接口
 * 管理搜索关键词、搜索建议、搜索历史
 */
interface SearchState {
  searchKeyword: string;
  suggestions: Suggestion[];
  searchHistory: SearchHistoryItem[];
  setSearchKeyword: (keyword: string) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  addSearchHistory: (keyword: string) => void;
  clearSearchHistory: () => void;
}

/**
 * UI交互状态接口
 * 管理搜索建议显示、键盘选择等交互状态
 */
interface UIState {
  showSuggestions: boolean;
  selectedIndex: number;
  setShowSuggestions: (show: boolean) => void;
  setSelectedIndex: (index: number) => void;
  moveSelection: (direction: 'up' | 'down', maxIndex: number) => void;
}

/**
 * 热词状态接口
 * 管理热词数据和切换逻辑
 */
interface HotWordsState {
  hotWords: HotWord[];
  currentBatch: number;
  setHotWords: (words: HotWord[]) => void;
  nextBatch: () => void;
  prevBatch: () => void;
}

/**
 * 用户状态接口
 * 管理用户登录信息
 */
interface UserState {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo | null) => void;
}

/**
 * 搜索Store
 * 管理搜索关键词、搜索建议和搜索历史
 */
export const useSearchStore = create<SearchState>((set) => ({
  searchKeyword: '',
  suggestions: [],
  searchHistory: [],
  
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  
  setSuggestions: (suggestions) => set({ suggestions }),
  
  addSearchHistory: (keyword) => set((state) => {
    if (!keyword.trim()) return state;
    
    // 避免重复,移除已存在的相同关键词
    const filtered = state.searchHistory.filter(item => item.keyword !== keyword);
    
    // 添加新记录到开头,最多保留10条
    const newHistory: SearchHistoryItem[] = [
      { keyword, timestamp: Date.now() },
      ...filtered
    ].slice(0, 10);
    
    // 保存到localStorage
    localStorage.setItem('baidu_search_history', JSON.stringify(newHistory));
    
    return { searchHistory: newHistory };
  }),
  
  clearSearchHistory: () => {
    localStorage.removeItem('baidu_search_history');
    set({ searchHistory: [] });
  }
}));

/**
 * UI Store
 * 管理搜索建议框显示和键盘选择状态
 */
export const useUIStore = create<UIState>((set) => ({
  showSuggestions: false,
  selectedIndex: -1,
  
  setShowSuggestions: (show) => set({ showSuggestions: show }),
  
  setSelectedIndex: (index) => set({ selectedIndex: index }),
  
  moveSelection: (direction, maxIndex) => set((state) => {
    let newIndex = state.selectedIndex;
    
    if (direction === 'down') {
      newIndex = newIndex >= maxIndex - 1 ? 0 : newIndex + 1;
    } else {
      newIndex = newIndex <= 0 ? maxIndex - 1 : newIndex - 1;
    }
    
    return { selectedIndex: newIndex };
  })
}));

/**
 * 热词Store
 * 管理热搜词数据和切换逻辑
 */
export const useHotWordsStore = create<HotWordsState>((set) => ({
  hotWords: [],
  currentBatch: 0,
  
  setHotWords: (words) => set({ hotWords: words, currentBatch: 0 }),
  
  nextBatch: () => set((state) => ({
    currentBatch: state.currentBatch + 1
  })),
  
  prevBatch: () => set((state) => ({
    currentBatch: Math.max(0, state.currentBatch - 1)
  }))
}));

/**
 * 用户Store
 * 管理用户登录信息状态
 */
export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  
  setUserInfo: (info) => set({ userInfo: info })
}));

/**
 * 初始化搜索历史
 * 从 localStorage 加载并恢复之前保存的搜索历史
 */
export const initSearchHistory = () => {
  try {
    const stored = localStorage.getItem('baidu_search_history');
    if (stored) {
      const history: SearchHistoryItem[] = JSON.parse(stored);
      useSearchStore.setState({ searchHistory: history });
    }
  } catch (error) {
    console.error('Failed to load search history:', error);
  }
};
