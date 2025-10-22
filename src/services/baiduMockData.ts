import { Suggestion, HotWord } from '../types/baidu';

// Mock 搜索建议数据
const mockSuggestions: Record<string, Suggestion[]> = {
  'react': [
    { keyword: 'react教程', type: 'hot', highlightRange: [0, 5], searchVolume: 1200000 },
    { keyword: 'react hooks', type: 'hot', highlightRange: [0, 5], searchVolume: 980000 },
    { keyword: 'react native', type: 'suggest', highlightRange: [0, 5], searchVolume: 850000 },
    { keyword: 'react router', type: 'suggest', highlightRange: [0, 5], searchVolume: 720000 },
    { keyword: 'react typescript', type: 'suggest', highlightRange: [0, 5], searchVolume: 650000 }
  ],
  '天气': [
    { keyword: '天气预报', type: 'hot', searchVolume: 5000000 },
    { keyword: '天气预报15天', type: 'hot', searchVolume: 3200000 },
    { keyword: '天气预报一周', type: 'suggest', searchVolume: 2800000 },
    { keyword: '天气查询', type: 'suggest', searchVolume: 1500000 }
  ],
  '新闻': [
    { keyword: '新闻联播', type: 'hot', searchVolume: 8000000 },
    { keyword: '新闻头条', type: 'hot', searchVolume: 6500000 },
    { keyword: '新闻网', type: 'suggest', searchVolume: 4200000 },
    { keyword: '新闻最新消息', type: 'suggest', searchVolume: 3800000 }
  ],
  'typescript': [
    { keyword: 'typescript教程', type: 'hot', highlightRange: [0, 10] },
    { keyword: 'typescript类型', type: 'suggest', highlightRange: [0, 10] },
    { keyword: 'typescript interface', type: 'suggest', highlightRange: [0, 10] },
    { keyword: 'typescript泛型', type: 'suggest', highlightRange: [0, 10] }
  ]
};

// Mock 热词数据
export const mockHotWords: HotWord[] = [
  { id: 'hw_001', word: '新闻联播', rank: 1, trend: 'up', url: '/s?wd=新闻联播' },
  { id: 'hw_002', word: '天气预报', rank: 2, trend: 'stable', url: '/s?wd=天气预报' },
  { id: 'hw_003', word: '百度翻译', rank: 3, trend: 'new', url: '/s?wd=百度翻译' },
  { id: 'hw_004', word: '在线课程', rank: 4, trend: 'up', url: '/s?wd=在线课程' },
  { id: 'hw_005', word: '电影推荐', rank: 5, trend: 'down', url: '/s?wd=电影推荐' },
  { id: 'hw_006', word: '疫情最新消息', rank: 6, trend: 'stable', url: '/s?wd=疫情最新消息' },
  { id: 'hw_007', word: 'AI技术', rank: 7, trend: 'new', url: '/s?wd=AI技术' },
  { id: 'hw_008', word: '旅游攻略', rank: 8, trend: 'up', url: '/s?wd=旅游攻略' },
  { id: 'hw_009', word: '美食推荐', rank: 9, trend: 'stable', url: '/s?wd=美食推荐' },
  { id: 'hw_010', word: '股票行情', rank: 10, trend: 'down', url: '/s?wd=股票行情' }
];

// 生成模糊匹配的建议
const generateSuggestions = (keyword: string): Suggestion[] => {
  const trimmed = keyword.trim().toLowerCase();
  
  if (!trimmed) return [];
  
  // 精确匹配
  if (mockSuggestions[trimmed]) {
    return mockSuggestions[trimmed];
  }
  
  // 部分匹配
  const partialMatches: Suggestion[] = [];
  Object.keys(mockSuggestions).forEach(key => {
    if (key.includes(trimmed) || trimmed.includes(key)) {
      partialMatches.push(...mockSuggestions[key]);
    }
  });
  
  if (partialMatches.length > 0) {
    return partialMatches.slice(0, 5);
  }
  
  // 默认建议
  return [
    { keyword: `${keyword}教程`, type: 'suggest' },
    { keyword: `${keyword}是什么`, type: 'suggest' },
    { keyword: `${keyword}怎么用`, type: 'suggest' },
    { keyword: `${keyword}下载`, type: 'suggest' }
  ];
};

export { generateSuggestions };
