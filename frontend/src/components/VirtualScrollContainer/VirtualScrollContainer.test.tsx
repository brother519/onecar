import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualScrollContainer, useVirtualScroll } from '../index';
import { Product } from '@/types';

const generateMockProducts = (count: number): Product[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${index + 1}`,
    name: `商品${index + 1}`,
    description: `描述${index + 1}`,
    price: (index + 1) * 100,
    category: '电子产品',
    images: [`image${index + 1}.jpg`],
    tags: [`tag${index + 1}`],
    status: 'active' as const,
    sortOrder: index,
    createdAt: `2023-01-${String(index + 1).padStart(2, '0')}`,
    updatedAt: `2023-01-${String(index + 1).padStart(2, '0')}`,
    sku: `SKU${String(index + 1).padStart(3, '0')}`,
    stock: (index + 1) * 10,
  }));

describe('VirtualScrollContainer', () => {
  const mockProducts = generateMockProducts(100);
  const mockRenderItem = vi.fn((item: Product, index: number) => (
    <div data-testid={`item-${item.id}`} key={item.id}>
      {item.name} - Index: {index}
    </div>
  ));
  const mockOnScroll = vi.fn();
  const mockOnVisibleRangeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染虚拟滚动容器', () => {
    render(
      <VirtualScrollContainer
        items={mockProducts}
        renderItem={mockRenderItem}
        onScroll={mockOnScroll}
        onVisibleRangeChange={mockOnVisibleRangeChange}
      />
    );

    expect(screen.getByTestId('virtual-scroll-viewport')).toBeInTheDocument();
  });

  it('应该应用自定义配置', () => {
    const customConfig = {
      itemHeight: 120,
      containerHeight: 800,
      bufferSize: 10,
    };

    const { container } = render(
      <VirtualScrollContainer
        items={mockProducts}
        renderItem={mockRenderItem}
        config={customConfig}
        className="custom-virtual-scroll"
      />
    );

    const scrollContainer = container.querySelector('.virtual-scroll-container');
    expect(scrollContainer).toHaveClass('custom-virtual-scroll');
    expect(scrollContainer).toHaveStyle({ height: '800px' });
  });

  it('应该应用自定义样式', () => {
    const customStyle = {
      backgroundColor: 'red',
      border: '1px solid blue',
    };

    const { container } = render(
      <VirtualScrollContainer
        items={mockProducts}
        renderItem={mockRenderItem}
        style={customStyle}
      />
    );

    const scrollContainer = container.querySelector('.virtual-scroll-container');
    expect(scrollContainer).toHaveStyle(customStyle);
  });

  it('应该正确处理滚动事件', () => {
    const { container } = render(
      <VirtualScrollContainer
        items={mockProducts}
        renderItem={mockRenderItem}
        onScroll={mockOnScroll}
        onVisibleRangeChange={mockOnVisibleRangeChange}
      />
    );

    const scrollContainer = container.querySelector('.virtual-scroll-container');
    
    fireEvent.scroll(scrollContainer!, { target: { scrollTop: 100 } });

    expect(mockOnScroll).toHaveBeenCalledWith(100);
  });

  it('应该只渲染可见范围内的项目', () => {
    render(
      <VirtualScrollContainer
        items={mockProducts.slice(0, 10)}
        renderItem={mockRenderItem}
        config={{ itemHeight: 80, containerHeight: 400, bufferSize: 2 }}
      />
    );

    // 由于 bufferSize 为 2，应该渲染更多项目以确保缓冲
    const renderedItems = screen.getAllByTestId(/^item-/);
    expect(renderedItems.length).toBeGreaterThan(0);
    expect(renderedItems.length).toBeLessThanOrEqual(10);
  });

  it('应该正确处理空数据', () => {
    render(
      <VirtualScrollContainer
        items={[]}
        renderItem={mockRenderItem}
        onScroll={mockOnScroll}
        onVisibleRangeChange={mockOnVisibleRangeChange}
      />
    );

    expect(screen.getByTestId('virtual-scroll-viewport')).toBeInTheDocument();
    expect(screen.queryByTestId(/^item-/)).not.toBeInTheDocument();
  });

  it('应该处理项目高度测量', () => {
    const { container } = render(
      <VirtualScrollContainer
        items={mockProducts.slice(0, 5)}
        renderItem={mockRenderItem}
      />
    );

    const scrollContainer = container.querySelector('.virtual-scroll-container');
    expect(scrollContainer).toBeInTheDocument();
    
    // 模拟测量高度的过程
    const viewport = container.querySelector('.virtual-scroll-viewport');
    expect(viewport).toBeInTheDocument();
  });
});

describe('useVirtualScroll', () => {
  const mockProducts = generateMockProducts(50);
  let hookResult: any;

  function TestComponent() {
    hookResult = useVirtualScroll(mockProducts, {
      itemHeight: 100,
      containerHeight: 500,
    });
    return null;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该初始化虚拟滚动状态', () => {
    render(<TestComponent />);

    expect(hookResult.scrollRef).toBeDefined();
    expect(hookResult.visibleRange).toEqual({ start: 0, end: 0 });
    expect(hookResult.scrollPosition).toBe(0);
  });

  it('应该提供滚动控制方法', () => {
    render(<TestComponent />);

    expect(typeof hookResult.scrollToIndex).toBe('function');
    expect(typeof hookResult.scrollToTop).toBe('function');
    expect(typeof hookResult.refresh).toBe('function');
  });

  it('应该正确处理可见范围变化', () => {
    render(<TestComponent />);

    hookResult.handleVisibleRangeChange(5, 15);

    expect(hookResult.visibleRange).toEqual({ start: 5, end: 15 });
  });

  it('应该正确处理滚动位置变化', () => {
    render(<TestComponent />);

    hookResult.handleScroll(200);

    expect(hookResult.scrollPosition).toBe(200);
  });

  it('应该调用 scrollToTop 方法', () => {
    render(<TestComponent />);

    // 模拟 scrollRef.current 存在
    const mockScrollToTop = vi.fn();
    hookResult.scrollRef.current = {
      scrollToTop: mockScrollToTop,
    };

    hookResult.scrollToTop();
    expect(mockScrollToTop).toHaveBeenCalled();
  });

  it('应该调用 scrollToIndex 方法', () => {
    render(<TestComponent />);

    // 模拟 scrollRef.current 存在
    const mockScrollToIndex = vi.fn();
    hookResult.scrollRef.current = {
      scrollToIndex: mockScrollToIndex,
    };

    hookResult.scrollToIndex(10, 'center');
    expect(mockScrollToIndex).toHaveBeenCalledWith(10, 'center');
  });

  it('应该调用 refresh 方法', () => {
    render(<TestComponent />);

    // 模拟 scrollRef.current 存在
    const mockRefresh = vi.fn();
    hookResult.scrollRef.current = {
      refresh: mockRefresh,
    };

    hookResult.refresh();
    expect(mockRefresh).toHaveBeenCalled();
  });
});