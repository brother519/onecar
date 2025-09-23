import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { VirtualScrollConfig, VirtualScrollState, Product } from '@/types';

interface VirtualScrollContainerProps {
  items: Product[];
  renderItem: (item: Product, index: number) => React.ReactNode;
  config?: Partial<VirtualScrollConfig>;
  onScroll?: (scrollTop: number) => void;
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface VirtualScrollRef {
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToTop: () => void;
  getScrollPosition: () => number;
  refresh: () => void;
}

const DEFAULT_CONFIG: VirtualScrollConfig = {
  itemHeight: 80,
  bufferSize: 5,
  containerHeight: 600,
  threshold: 0.8,
};

/**
 * 虚拟滚动容器组件
 * 
 * 功能特性：
 * - 仅渲染可视区域内的商品项
 * - 动态计算滚动位置和项目高度
 * - 支持不同高度的商品项渲染
 * - 维护滚动位置状态
 * - 支持滚动到指定位置
 * - 性能优化的大数据集处理
 */
export const VirtualScrollContainer = forwardRef<VirtualScrollRef, VirtualScrollContainerProps>(
  ({ 
    items, 
    renderItem, 
    config = {}, 
    onScroll, 
    onVisibleRangeChange,
    className = '',
    style = {},
  }, ref) => {
    const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollElementRef = useRef<HTMLDivElement>(null);
    
    const [state, setState] = useState<VirtualScrollState>({
      visibleStartIndex: 0,
      visibleEndIndex: 0,
      scrollTop: 0,
      totalHeight: 0,
    });

    // 项目高度缓存
    const itemHeights = useRef<Map<number, number>>(new Map());
    const itemOffsets = useRef<number[]>([]);
    
    // 计算项目偏移量
    const calculateOffsets = useCallback(() => {
      const offsets: number[] = [0];
      let totalHeight = 0;
      
      for (let i = 0; i < items.length; i++) {
        const height = itemHeights.current.get(i) || mergedConfig.itemHeight;
        totalHeight += height;
        offsets.push(totalHeight);
      }
      
      itemOffsets.current = offsets;
      
      setState(prev => ({
        ...prev,
        totalHeight,
      }));
    }, [items.length, mergedConfig.itemHeight]);

    // 计算可见范围
    const calculateVisibleRange = useCallback((scrollTop: number) => {
      const { bufferSize, containerHeight } = mergedConfig;
      const offsets = itemOffsets.current;
      
      // 二分查找开始索引
      let startIndex = 0;
      let endIndex = offsets.length - 1;
      
      while (startIndex < endIndex) {
        const midIndex = Math.floor((startIndex + endIndex) / 2);
        if (offsets[midIndex] < scrollTop) {
          startIndex = midIndex + 1;
        } else {
          endIndex = midIndex;
        }
      }
      
      // 调整为可见范围的开始
      const visibleStartIndex = Math.max(0, startIndex - 1 - bufferSize);
      
      // 计算结束索引
      let visibleEndIndex = startIndex;
      const bottomPosition = scrollTop + containerHeight;
      
      while (
        visibleEndIndex < offsets.length - 1 && 
        offsets[visibleEndIndex] < bottomPosition
      ) {
        visibleEndIndex++;
      }
      
      visibleEndIndex = Math.min(
        items.length - 1,
        visibleEndIndex + bufferSize
      );

      return { visibleStartIndex, visibleEndIndex };
    }, [mergedConfig, items.length]);

    // 滚动事件处理
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const { visibleStartIndex, visibleEndIndex } = calculateVisibleRange(scrollTop);
      
      setState(prev => ({
        ...prev,
        scrollTop,
        visibleStartIndex,
        visibleEndIndex,
      }));

      onScroll?.(scrollTop);
      onVisibleRangeChange?.(visibleStartIndex, visibleEndIndex);
    }, [calculateVisibleRange, onScroll, onVisibleRangeChange]);

    // 项目高度测量
    const measureItemHeight = useCallback((index: number, height: number) => {
      if (itemHeights.current.get(index) !== height) {
        itemHeights.current.set(index, height);
        calculateOffsets();
      }
    }, [calculateOffsets]);

    // 初始化计算
    useEffect(() => {
      calculateOffsets();
      const { visibleStartIndex, visibleEndIndex } = calculateVisibleRange(0);
      setState(prev => ({
        ...prev,
        visibleStartIndex,
        visibleEndIndex,
      }));
    }, [calculateOffsets, calculateVisibleRange]);

    // 暴露的方法
    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number, align: 'start' | 'center' | 'end' = 'start') => {
        if (!scrollElementRef.current || index < 0 || index >= items.length) {
          return;
        }

        const targetOffset = itemOffsets.current[index];
        let scrollTop = targetOffset;

        if (align === 'center') {
          scrollTop = targetOffset - mergedConfig.containerHeight / 2;
        } else if (align === 'end') {
          scrollTop = targetOffset - mergedConfig.containerHeight + mergedConfig.itemHeight;
        }

        scrollTop = Math.max(0, Math.min(scrollTop, state.totalHeight - mergedConfig.containerHeight));
        
        scrollElementRef.current.scrollTop = scrollTop;
      },
      
      scrollToTop: () => {
        if (scrollElementRef.current) {
          scrollElementRef.current.scrollTop = 0;
        }
      },
      
      getScrollPosition: () => state.scrollTop,
      
      refresh: () => {
        itemHeights.current.clear();
        calculateOffsets();
      },
    }), [items.length, mergedConfig, state.scrollTop, state.totalHeight, calculateOffsets]);

    // 渲染可见项目
    const visibleItems = useMemo(() => {
      const items_to_render = [];
      
      for (let i = state.visibleStartIndex; i <= state.visibleEndIndex; i++) {
        if (i >= 0 && i < items.length) {
          const item = items[i];
          const top = itemOffsets.current[i];
          
          items_to_render.push(
            <VirtualScrollItem
              key={item.id}
              index={i}
              item={item}
              top={top}
              onHeightChange={measureItemHeight}
              renderItem={renderItem}
            />
          );
        }
      }
      
      return items_to_render;
    }, [
      state.visibleStartIndex, 
      state.visibleEndIndex, 
      items, 
      renderItem, 
      measureItemHeight
    ]);

    return (
      <div
        ref={containerRef}
        className={`virtual-scroll-container ${className}`}
        style={{
          height: mergedConfig.containerHeight,
          overflow: 'auto',
          ...style,
        }}
        onScroll={handleScroll}
      >
        <div
          ref={scrollElementRef}
          className="virtual-scroll-viewport"
          style={{
            height: state.totalHeight,
            position: 'relative',
          }}
        >
          {visibleItems}
        </div>
      </div>
    );
  }
);

VirtualScrollContainer.displayName = 'VirtualScrollContainer';

// 虚拟滚动项目组件
interface VirtualScrollItemProps {
  index: number;
  item: Product;
  top: number;
  onHeightChange: (index: number, height: number) => void;
  renderItem: (item: Product, index: number) => React.ReactNode;
}

const VirtualScrollItem: React.FC<VirtualScrollItemProps> = ({
  index,
  item,
  top,
  onHeightChange,
  renderItem,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  // 测量高度
  useEffect(() => {
    if (itemRef.current) {
      const height = itemRef.current.offsetHeight;
      onHeightChange(index, height);
    }
  }, [index, onHeightChange]);

  return (
    <div
      ref={itemRef}
      className="virtual-scroll-item"
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
      }}
    >
      {renderItem(item, index)}
    </div>
  );
};

// 导出相关 hooks
export const useVirtualScroll = (
  items: Product[],
  config: Partial<VirtualScrollConfig> = {}
) => {
  const scrollRef = useRef<VirtualScrollRef>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);

  const scrollToIndex = useCallback((index: number, align?: 'start' | 'center' | 'end') => {
    scrollRef.current?.scrollToIndex(index, align);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollToTop();
  }, []);

  const refresh = useCallback(() => {
    scrollRef.current?.refresh();
  }, []);

  const handleVisibleRangeChange = useCallback((start: number, end: number) => {
    setVisibleRange({ start, end });
  }, []);

  const handleScroll = useCallback((scrollTop: number) => {
    setScrollPosition(scrollTop);
  }, []);

  return {
    scrollRef,
    visibleRange,
    scrollPosition,
    scrollToIndex,
    scrollToTop,
    refresh,
    handleVisibleRangeChange,
    handleScroll,
  };
};