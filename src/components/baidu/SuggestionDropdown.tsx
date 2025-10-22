import React from 'react';
import { Suggestion } from '../../types/baidu';
import './SuggestionDropdown.css';

interface SuggestionDropdownProps {
  suggestions: Suggestion[];
  selectedIndex: number;
  onSelect: (suggestion: Suggestion, index: number) => void;
  onMouseEnter: (index: number) => void;
  keyword: string;
}

const SuggestionDropdown: React.FC<SuggestionDropdownProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onMouseEnter,
  keyword
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  const highlightKeyword = (text: string, range?: [number, number]) => {
    if (!range || !keyword) {
      return text;
    }

    const [start, end] = range;
    const before = text.slice(0, start);
    const highlight = text.slice(start, end);
    const after = text.slice(end);

    return (
      <>
        {before}
        <span className="suggestion-highlight">{highlight}</span>
        {after}
      </>
    );
  };

  const getTypeLabel = (type: Suggestion['type']) => {
    switch (type) {
      case 'history':
        return '历史';
      case 'hot':
        return '热搜';
      case 'suggest':
        return '搜索';
      default:
        return '';
    }
  };

  const formatSearchVolume = (volume?: number) => {
    if (!volume) return '';
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(1)}千万`;
    }
    if (volume >= 10000) {
      return `${(volume / 10000).toFixed(1)}万`;
    }
    return volume.toString();
  };

  return (
    <ul 
      className="suggestion-dropdown" 
      role="listbox"
      aria-label="搜索建议列表"
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={`${suggestion.keyword}-${index}`}
          className={`suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
          role="option"
          aria-selected={selectedIndex === index}
          onClick={() => onSelect(suggestion, index)}
          onMouseEnter={() => onMouseEnter(index)}
        >
          <span className="suggestion-icon">
            {suggestion.type === 'history' && '🕐'}
            {suggestion.type === 'hot' && '🔥'}
            {suggestion.type === 'suggest' && '🔍'}
          </span>
          <span className="suggestion-text">
            {highlightKeyword(suggestion.keyword, suggestion.highlightRange)}
          </span>
          {suggestion.searchVolume && (
            <span className="suggestion-volume">
              {formatSearchVolume(suggestion.searchVolume)}
            </span>
          )}
          <span className="suggestion-type">{getTypeLabel(suggestion.type)}</span>
        </li>
      ))}
    </ul>
  );
};

export default SuggestionDropdown;
