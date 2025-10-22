import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSearchStore, useUIStore } from '../../store/baiduStore';
import { fetchSearchSuggestionsWithCache } from '../../services/baiduAPI';
import SuggestionDropdown from './SuggestionDropdown';
import { Suggestion } from '../../types/baidu';
import './SearchBox.css';

interface SearchBoxProps {
  onSearch?: (keyword: string) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  
  const { 
    searchKeyword, 
    suggestions, 
    searchHistory,
    setSearchKeyword, 
    setSuggestions,
    addSearchHistory 
  } = useSearchStore();
  
  const { 
    showSuggestions, 
    selectedIndex,
    setShowSuggestions, 
    setSelectedIndex,
    moveSelection 
  } = useUIStore();

  const [isFocused, setIsFocused] = useState(false);

  // 防抖搜索建议
  const fetchSuggestions = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      // 空输入显示搜索历史
      if (searchHistory.length > 0) {
        const historySuggestions: Suggestion[] = searchHistory.map(item => ({
          keyword: item.keyword,
          type: 'history' as const
        }));
        setSuggestions(historySuggestions);
      } else {
        setSuggestions([]);
      }
      return;
    }

    try {
      const response = await fetchSearchSuggestionsWithCache({ keyword });
      if (response.success) {
        setSuggestions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    }
  }, [searchHistory, setSuggestions]);

  // 输入变化处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);
    setSelectedIndex(-1);

    // 防抖处理
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // 执行搜索
  const performSearch = (keyword: string) => {
    if (!keyword.trim()) return;

    addSearchHistory(keyword);
    setShowSuggestions(false);
    
    if (onSearch) {
      onSearch(keyword);
    } else {
      // 默认跳转到百度搜索
      window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`, '_blank');
    }
  };

  // 搜索按钮点击
  const handleSearch = () => {
    performSearch(searchKeyword);
  };

  // 选择建议项
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setSearchKeyword(suggestion.keyword);
    performSearch(suggestion.keyword);
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveSelection('down', suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveSelection('up', suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 焦点处理
  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    
    if (!searchKeyword && searchHistory.length > 0) {
      const historySuggestions: Suggestion[] = searchHistory.map(item => ({
        keyword: item.keyword,
        type: 'history' as const
      }));
      setSuggestions(historySuggestions);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // 延迟关闭,允许点击建议项
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // 清空输入
  const handleClear = () => {
    setSearchKeyword('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions, setSelectedIndex]);

  return (
    <div 
      className={`search-box ${isFocused ? 'focused' : ''}`}
      ref={containerRef}
    >
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="请输入搜索关键词"
          value={searchKeyword}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label="请输入搜索关键词"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestions}
          role="searchbox"
        />
        
        {searchKeyword && (
          <button
            className="search-clear-btn"
            onClick={handleClear}
            aria-label="清空输入"
            type="button"
          >
            ✕
          </button>
        )}
        
        <button
          className="search-btn"
          onClick={handleSearch}
          aria-label="百度搜索"
          type="button"
        >
          百度一下
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <SuggestionDropdown
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={handleSelectSuggestion}
          onMouseEnter={setSelectedIndex}
          keyword={searchKeyword}
        />
      )}
    </div>
  );
};

export default SearchBox;
