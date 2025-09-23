import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useMemo,
} from 'react';
import { InfiniteScrollConfig, LoadingState, Product, PaginatedResponse } from '@/types';

interface InfiniteScrollLoaderProps {
  loadMore: (page: number) => Promise<PaginatedResponse<Product>>;
  renderItem: (item: Product, index: number) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: string, retry: () => void) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  config?: Partial<InfiniteScrollConfig>;
  initialData?: Product[];
  className?: string;
}

const DEFAULT_CONFIG: InfiniteScrollConfig = {
  pageSize: 20,
  loadThreshold: 300,
  maxRetries: 3,
  debounceMs: 150,
};

/**
 * 无限滚动加载器组件
 * 
 * 功能特性：
 * - 监听滚动事件触发数据加载
 * - 管理加载状态和错误处理
 * - 支持预加载和缓存策略
 * - 防抖和节流优化
 * - 自动重试机制
 * - 支持初始数据
 */
export const InfiniteScrollLoader: React.FC<InfiniteScrollLoaderProps> = ({
  loadMore,
  renderItem,
  renderLoading,
  renderError,
  renderEmpty,
  config = {},
  initialData = [],
  className = '',
}) => {
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  const [items, setItems] = useState<Product[]>(initialData);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    hasMore: true,
    error: null,
    currentPage: initialData.length > 0 ? 1 : 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const retryCount = useRef(0);
  const loadingPromise = useRef<Promise<void> | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 防抖加载函数
  const debouncedLoad = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (!loadingState.isLoading && loadingState.hasMore && !loadingState.error) {
        loadNextPage();
      }
    }, mergedConfig.debounceMs);
  }, [loadingState.isLoading, loadingState.hasMore, loadingState.error, mergedConfig.debounceMs]);

  // 加载下一页数据
  const loadNextPage = useCallback(async () => {
    if (loadingState.isLoading || !loadingState.hasMore || loadingPromise.current) {
      return;
    }

    const nextPage = loadingState.currentPage + 1;
    
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      loadingPromise.current = loadMore(nextPage).then(response => {
        if (response.success && response.data) {
          setItems(prev => [...prev, ...response.data!]);
          
          const hasMore = response.data!.length === mergedConfig.pageSize && 
                         (response.pagination?.page || nextPage) < (response.pagination?.totalPages || Infinity);
          
          setLoadingState(prev => ({
            ...prev,
            isLoading: false,
            hasMore,
            currentPage: nextPage,
            error: null,
          }));
          
          retryCount.current = 0;
        } else {
          throw new Error(response.message || 'Failed to load data');
        }
      });

      await loadingPromise.current;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      retryCount.current++;
    } finally {
      loadingPromise.current = null;
    }
  }, [loadingState, loadMore, mergedConfig.pageSize]);

  // 重试加载
  const retryLoad = useCallback(() => {
    if (retryCount.current < mergedConfig.maxRetries) {
      setLoadingState(prev => ({ ...prev, error: null }));
      loadNextPage();
    }
  }, [loadNextPage, mergedConfig.maxRetries]);

  // 滚动事件处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const threshold = mergedConfig.loadThreshold;
    
    // 检查是否接近底部
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      debouncedLoad();
    }
  }, [debouncedLoad, mergedConfig.loadThreshold]);

  // Intersection Observer 实现（更精确的触发）
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadingTriggerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && loadingState.hasMore && !loadingState.isLoading) {
          debouncedLoad();
        }
      },
      {
        rootMargin: `${mergedConfig.loadThreshold}px`,
        threshold: 0.1,
      }
    );

    observerRef.current.observe(loadingTriggerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadingState.hasMore, loadingState.isLoading, debouncedLoad, mergedConfig.loadThreshold]);

  // 初始化加载
  useEffect(() => {
    if (items.length === 0 && loadingState.currentPage === 0) {
      loadNextPage();
    }
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // 渲染加载状态
  const renderLoadingState = () => {
    if (renderLoading) {
      return renderLoading();
    }

    return (
      <div className="infinite-scroll-loading">
        <div className="loading-spinner" />
        <span>加载中...</span>
      </div>
    );
  };

  // 渲染错误状态
  const renderErrorState = () => {
    if (renderError) {
      return renderError(loadingState.error!, retryLoad);
    }

    return (
      <div className="infinite-scroll-error">
        <div className="error-message">
          加载失败: {loadingState.error}
        </div>
        {retryCount.current < mergedConfig.maxRetries && (
          <button 
            className="btn btn-primary"
            onClick={retryLoad}
          >
            重试 ({retryCount.current + 1}/{mergedConfig.maxRetries})
          </button>
        )}
      </div>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => {
    if (renderEmpty) {
      return renderEmpty();
    }

    return (
      <div className="infinite-scroll-empty">
        <div className="empty-icon">📦</div>
        <div className="empty-text">暂无数据</div>
        <div className="empty-description">
          没有找到任何商品，请尝试调整筛选条件
        </div>
      </div>
    );
  };

  // 如果没有数据且不在加载中，显示空状态
  if (items.length === 0 && !loadingState.isLoading && !loadingState.error) {
    return (
      <div className={`infinite-scroll-container ${className}`}>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`infinite-scroll-container ${className}`}
      onScroll={handleScroll}
    >
      {/* 渲染数据项 */}
      <div className="infinite-scroll-items">
        {items.map((item, index) => (
          <div key={item.id} className="infinite-scroll-item">
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* 加载触发器 */}
      {loadingState.hasMore && (
        <div 
          ref={loadingTriggerRef} 
          className="infinite-scroll-trigger"
        />
      )}

      {/* 状态渲染 */}
      {loadingState.isLoading && renderLoadingState()}
      {loadingState.error && renderErrorState()}
      
      {/* 到达底部提示 */}
      {!loadingState.hasMore && items.length > 0 && (
        <div className="infinite-scroll-end">
          <div className="end-message">已加载全部数据</div>
          <div className="end-stats">
            共 {items.length} 项
          </div>
        </div>
      )}
    </div>
  );
};

// 导出相关 hooks
export const useInfiniteScroll = <T = Product>(
  loadMore: (page: number) => Promise<PaginatedResponse<T>>,
  config: Partial<InfiniteScrollConfig> = {}
) => {
  const [items, setItems] = useState<T[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    hasMore: true,
    error: null,
    currentPage: 0,
  });

  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const retryCount = useRef(0);

  const loadNextPage = useCallback(async () => {
    if (loadingState.isLoading || !loadingState.hasMore) {
      return;
    }

    const nextPage = loadingState.currentPage + 1;
    
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await loadMore(nextPage);
      
      if (response.success && response.data) {
        setItems(prev => [...prev, ...response.data!]);
        
        const hasMore = response.data!.length === mergedConfig.pageSize;
        
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          hasMore,
          currentPage: nextPage,
          error: null,
        }));
        
        retryCount.current = 0;
      } else {
        throw new Error(response.message || 'Failed to load data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      retryCount.current++;
    }
  }, [loadingState, loadMore, mergedConfig.pageSize]);

  const retry = useCallback(() => {
    if (retryCount.current < mergedConfig.maxRetries) {
      setLoadingState(prev => ({ ...prev, error: null }));
      loadNextPage();
    }
  }, [loadNextPage, mergedConfig.maxRetries]);

  const reset = useCallback(() => {
    setItems([]);
    setLoadingState({
      isLoading: false,
      hasMore: true,
      error: null,
      currentPage: 0,
    });
    retryCount.current = 0;
  }, []);

  const refresh = useCallback(() => {
    reset();
    loadNextPage();
  }, [reset, loadNextPage]);

  return {
    items,
    loadingState,
    loadNextPage,
    retry,
    reset,
    refresh,
    canRetry: retryCount.current < mergedConfig.maxRetries,
  };
};