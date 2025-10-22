import React, { useEffect, useState } from 'react';
import { useHotWordsStore } from '../../store/baiduStore';
import { fetchHotWords } from '../../services/baiduAPI';
import { useSearchStore } from '../../store/baiduStore';
import './HotWordTags.css';

interface HotWordTagsProps {
  displayCount?: number;
  enableAutoRotate?: boolean;
  rotateInterval?: number;
}

const HotWordTags: React.FC<HotWordTagsProps> = ({
  displayCount = 8,
  enableAutoRotate = false,
  rotateInterval = 5000
}) => {
  const { hotWords, currentBatch, setHotWords, nextBatch } = useHotWordsStore();
  const { setSearchKeyword } = useSearchStore();
  const [isLoading, setIsLoading] = useState(true);

  // 加载热词数据
  useEffect(() => {
    const loadHotWords = async () => {
      try {
        const response = await fetchHotWords({ count: 20 });
        if (response.success) {
          setHotWords(response.data);
        }
      } catch (error) {
        console.error('Failed to load hot words:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHotWords();
  }, [setHotWords]);

  // 自动轮播
  useEffect(() => {
    if (!enableAutoRotate || hotWords.length === 0) return;

    const timer = setInterval(() => {
      nextBatch();
    }, rotateInterval);

    return () => clearInterval(timer);
  }, [enableAutoRotate, rotateInterval, hotWords.length, nextBatch]);

  // 点击热词
  const handleClickHotWord = (word: string, url: string) => {
    setSearchKeyword(word);
    // 可以选择直接跳转或触发搜索
    window.open(`https://www.baidu.com${url}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="hot-words-container">
        <div className="hot-words-loading">加载中...</div>
      </div>
    );
  }

  if (hotWords.length === 0) {
    return null;
  }

  // 计算当前显示的热词
  const totalBatches = Math.ceil(hotWords.length / displayCount);
  const currentIndex = currentBatch % totalBatches;
  const displayWords = hotWords.slice(
    currentIndex * displayCount,
    (currentIndex + 1) * displayCount
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'new':
        return '🆕';
      default:
        return '';
    }
  };

  const getRankClass = (rank: number) => {
    if (rank <= 3) return 'top-rank';
    if (rank <= 5) return 'mid-rank';
    return 'normal-rank';
  };

  return (
    <div className="hot-words-container">
      <div className="hot-words-header">
        <span className="hot-words-title">🔥 热搜</span>
        {totalBatches > 1 && enableAutoRotate && (
          <span className="hot-words-indicator">
            {currentIndex + 1} / {totalBatches}
          </span>
        )}
      </div>
      
      <div className="hot-words-list">
        {displayWords.map((hotWord) => (
          <div
            key={hotWord.id}
            className={`hot-word-tag ${getRankClass(hotWord.rank)}`}
            onClick={() => handleClickHotWord(hotWord.word, hotWord.url)}
          >
            <span className="hot-word-rank">{hotWord.rank}</span>
            <span className="hot-word-text">{hotWord.word}</span>
            {hotWord.trend !== 'stable' && (
              <span className="hot-word-trend">{getTrendIcon(hotWord.trend)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotWordTags;
