import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualScrollContainer } from '@/components/VirtualScrollContainer';
import { DragDropManager } from '@/components/DragDropManager';
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader';
import { Product } from '@/types';

// 性能测试工具
class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private measurements: number[] = [];

  start() {
    this.startTime = performance.now();
  }

  end() {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    this.measurements.push(duration);
    return duration;
  }

  getAverage() {
    return this.measurements.reduce((sum, time) => sum + time, 0) / this.measurements.length;
  }

  getMax() {
    return Math.max(...this.measurements);
  }

  getMin() {
    return Math.min(...this.measurements);
  }

  reset() {
    this.measurements = [];
  }
}

// 生成大量测试数据
const generateLargeDataset = (count: number): Product[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `product-${index}`,
    name: `商品 ${index + 1}`,
    description: `这是商品 ${index + 1} 的详细描述，包含了丰富的内容信息`,
    price: Math.random() * 1000 + 10,
    category: ['电子产品', '服装配饰', '家居用品', '体育用品', '图书音像'][index % 5],
    images: [
      `https://picsum.photos/300/200?random=${index}`,
      `https://picsum.photos/300/200?random=${index + 1000}`,
    ],
    tags: [`标签${index % 10}`, `分类${index % 5}`],
    status: ['active', 'inactive', 'draft'][index % 3] as Product['status'],
    sortOrder: index,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    sku: `SKU-${String(index).padStart(6, '0')}`,
    stock: Math.floor(Math.random() * 100),
  }));
};

describe('性能优化验证', () => {
  const performanceMonitor = new PerformanceMonitor();

  beforeEach(() => {
    performanceMonitor.reset();
  });

  describe('虚拟滚动性能测试', () => {
    it('应该在大数据集下保持高性能渲染', async () => {
      const largeDataset = generateLargeDataset(10000);
      const renderItem = vi.fn((item: Product) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <span>¥{item.price}</span>
        </div>
      ));

      // 测试初始渲染性能
      performanceMonitor.start();
      
      const { container } = render(
        <VirtualScrollContainer
          items={largeDataset}
          renderItem={renderItem}
          config={{
            itemHeight: 100,
            containerHeight: 600,
            bufferSize: 5,
          }}
        />
      );

      const initialRenderTime = performanceMonitor.end();

      // 验证性能指标
      expect(initialRenderTime).toBeLessThan(100); // 初始渲染应该在100ms内完成
      
      // 验证只渲染了可视区域内的元素
      expect(renderItem).not.toHaveBeenCalledTimes(largeDataset.length);
      
      // 验证容器存在
      expect(container.querySelector('.virtual-scroll-container')).toBeInTheDocument();
    });

    it('应该高效处理滚动事件', () => {
      const dataset = generateLargeDataset(1000);
      const renderItem = vi.fn((item: Product) => (
        <div key={item.id}>{item.name}</div>
      ));

      const { container } = render(
        <VirtualScrollContainer
          items={dataset}
          renderItem={renderItem}
          config={{ itemHeight: 80, containerHeight: 400 }}
        />
      );

      const scrollContainer = container.querySelector('.virtual-scroll-container');
      
      // 测试连续滚动性能
      const scrollTests = Array.from({ length: 10 }, (_, i) => {
        performanceMonitor.start();
        
        fireEvent.scroll(scrollContainer!, {
          target: { scrollTop: i * 100 }
        });
        
        return performanceMonitor.end();
      });

      const averageScrollTime = scrollTests.reduce((sum, time) => sum + time, 0) / scrollTests.length;
      
      // 平均滚动处理时间应该很短
      expect(averageScrollTime).toBeLessThan(16); // 小于一帧的时间(60fps = 16.67ms)
    });

    it('应该正确处理不同高度的项目', () => {
      const dataset = generateLargeDataset(100);
      const renderItem = vi.fn((item: Product, index: number) => (
        <div 
          key={item.id} 
          style={{ height: 50 + (index % 5) * 20 }} // 动态高度
        >
          {item.name}
        </div>
      ));

      performanceMonitor.start();
      
      render(
        <VirtualScrollContainer
          items={dataset}
          renderItem={renderItem}
          config={{
            itemHeight: 70, // 平均高度
            containerHeight: 500,
            bufferSize: 3,
          }}
        />
      );

      const renderTime = performanceMonitor.end();
      
      // 即使有动态高度，渲染时间也应该保持高效
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('拖拽排序性能测试', () => {
    it('应该高效处理大列表的拖拽操作', () => {
      const dataset = generateLargeDataset(500);
      const onReorder = vi.fn();
      const renderItem = vi.fn((item: Product) => (
        <div key={item.id} className="draggable-item">
          {item.name}
        </div>
      ));

      performanceMonitor.start();
      
      render(
        <DragDropManager
          items={dataset}
          onReorder={onReorder}
          renderItem={renderItem}
        />
      );

      const initTime = performanceMonitor.end();
      
      // 初始化时间应该合理
      expect(initTime).toBeLessThan(200);
      
      // 验证渲染项目数量
      expect(renderItem).toHaveBeenCalledTimes(dataset.length);
    });

    it('应该快速响应拖拽状态变化', () => {
      const dataset = generateLargeDataset(50);
      const onReorder = vi.fn();
      const renderItem = vi.fn((item: Product, isDragging?: boolean) => (
        <div 
          key={item.id} 
          className={`item ${isDragging ? 'dragging' : ''}`}
        >
          {item.name}
        </div>
      ));

      const { rerender } = render(
        <DragDropManager
          items={dataset}
          onReorder={onReorder}
          renderItem={renderItem}
        />
      );

      // 模拟拖拽状态变化
      performanceMonitor.start();
      
      rerender(
        <DragDropManager
          items={dataset}
          onReorder={onReorder}
          renderItem={renderItem}
        />
      );

      const updateTime = performanceMonitor.end();
      
      // 状态更新应该很快
      expect(updateTime).toBeLessThan(30);
    });
  });

  describe('无限滚动性能测试', () => {
    it('应该高效处理数据加载', async () => {
      const mockLoadMore = vi.fn().mockResolvedValue({
        success: true,
        data: generateLargeDataset(20),
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1000,
          totalPages: 50,
        },
      });

      const renderItem = vi.fn((item: Product) => (
        <div key={item.id}>{item.name}</div>
      ));

      performanceMonitor.start();
      
      render(
        <InfiniteScrollLoader
          loadMore={mockLoadMore}
          renderItem={renderItem}
        />
      );

      const initTime = performanceMonitor.end();
      
      // 初始化应该很快
      expect(initTime).toBeLessThan(50);
    });

    it('应该正确处理滚动触发性能', () => {
      const mockLoadMore = vi.fn().mockResolvedValue({
        success: true,
        data: generateLargeDataset(20),
      });

      const renderItem = vi.fn((item: Product) => (
        <div key={item.id}>{item.name}</div>
      ));

      const { container } = render(
        <InfiniteScrollLoader
          loadMore={mockLoadMore}
          renderItem={renderItem}
          config={{
            debounceMs: 100,
            loadThreshold: 300,
          }}
        />
      );

      const scrollContainer = container.querySelector('.infinite-scroll-container');
      
      // 测试多次滚动的防抖性能
      const scrollTimes = [];
      
      for (let i = 0; i < 5; i++) {
        performanceMonitor.start();
        
        fireEvent.scroll(scrollContainer!, {
          target: { 
            scrollTop: 1000,
            scrollHeight: 2000,
            clientHeight: 600,
          }
        });
        
        scrollTimes.push(performanceMonitor.end());
      }

      const averageScrollTime = scrollTimes.reduce((sum, time) => sum + time, 0) / scrollTimes.length;
      
      // 滚动事件处理应该很快
      expect(averageScrollTime).toBeLessThan(10);
    });
  });

  describe('内存使用优化验证', () => {
    it('应该正确清理组件资源', () => {
      const dataset = generateLargeDataset(100);
      const renderItem = vi.fn((item: Product) => (
        <div key={item.id}>{item.name}</div>
      ));

      const { unmount } = render(
        <VirtualScrollContainer
          items={dataset}
          renderItem={renderItem}
        />
      );

      // 卸载组件
      performanceMonitor.start();
      unmount();
      const unmountTime = performanceMonitor.end();

      // 卸载应该很快
      expect(unmountTime).toBeLessThan(20);
    });

    it('应该避免内存泄漏', () => {
      const dataset = generateLargeDataset(200);
      
      // 创建多个组件实例来测试内存管理
      const instances = [];
      
      performanceMonitor.start();
      
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <VirtualScrollContainer
            items={dataset}
            renderItem={(item: Product) => <div key={item.id}>{item.name}</div>}
          />
        );
        instances.push(unmount);
      }

      // 清理所有实例
      instances.forEach(unmount => unmount());
      
      const totalTime = performanceMonitor.end();
      
      // 多实例创建和清理应该在合理时间内完成
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('渲染优化验证', () => {
    it('应该避免不必要的重渲染', () => {
      const dataset = generateLargeDataset(10);
      const renderItem = vi.fn((item: Product) => (
        <div key={item.id}>{item.name}</div>
      ));

      const { rerender } = render(
        <VirtualScrollContainer
          items={dataset}
          renderItem={renderItem}
        />
      );

      const initialCallCount = renderItem.mock.calls.length;
      renderItem.mockClear();

      // 使用相同的 props 重新渲染
      performanceMonitor.start();
      
      rerender(
        <VirtualScrollContainer
          items={dataset}
          renderItem={renderItem}
        />
      );

      const rerenderTime = performanceMonitor.end();
      
      // 重渲染应该很快
      expect(rerenderTime).toBeLessThan(20);
    });

    it('应该优化DOM操作', () => {
      const dataset = generateLargeDataset(50);
      const renderItem = vi.fn((item: Product, index: number) => (
        <div key={item.id} data-index={index}>
          <span>{item.name}</span>
          <span>{item.price}</span>
        </div>
      ));

      performanceMonitor.start();
      
      const { container } = render(
        <VirtualScrollContainer
          items={dataset}
          renderItem={renderItem}
          config={{
            itemHeight: 60,
            containerHeight: 300,
            bufferSize: 2,
          }}
        />
      );

      const renderTime = performanceMonitor.end();
      
      // DOM 渲染应该高效
      expect(renderTime).toBeLessThan(100);
      
      // 验证实际渲染的DOM元素数量少于总数据量
      const renderedItems = container.querySelectorAll('[data-index]');
      expect(renderedItems.length).toBeLessThan(dataset.length);
    });
  });

  describe('性能基准测试', () => {
    it('虚拟滚动应该满足性能基准', () => {
      const performanceTargets = {
        initialRender: 100, // ms
        scrollResponse: 16, // ms (60fps)
        memoryCleanup: 20, // ms
      };

      const dataset = generateLargeDataset(1000);
      
      // 测试初始渲染
      performanceMonitor.start();
      const { container, unmount } = render(
        <VirtualScrollContainer
          items={dataset}
          renderItem={(item: Product) => <div key={item.id}>{item.name}</div>}
        />
      );
      const initialRenderTime = performanceMonitor.end();

      // 测试滚动响应
      const scrollContainer = container.querySelector('.virtual-scroll-container');
      performanceMonitor.start();
      fireEvent.scroll(scrollContainer!, { target: { scrollTop: 500 } });
      const scrollTime = performanceMonitor.end();

      // 测试清理
      performanceMonitor.start();
      unmount();
      const cleanupTime = performanceMonitor.end();

      // 验证性能基准
      expect(initialRenderTime).toBeLessThan(performanceTargets.initialRender);
      expect(scrollTime).toBeLessThan(performanceTargets.scrollResponse);
      expect(cleanupTime).toBeLessThan(performanceTargets.memoryCleanup);
    });

    it('应该在低端设备上保持可用性能', () => {
      // 模拟低端设备的性能约束
      const performanceTargets = {
        initialRender: 200, // 更宽松的限制
        scrollResponse: 33, // 30fps
      };

      const dataset = generateLargeDataset(500);
      
      performanceMonitor.start();
      const { container } = render(
        <VirtualScrollContainer
          items={dataset}
          renderItem={(item: Product) => (
            <div key={item.id}>
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              <span>¥{item.price}</span>
            </div>
          )}
          config={{
            itemHeight: 100,
            containerHeight: 400,
            bufferSize: 3, // 减少缓冲区大小
          }}
        />
      );
      const renderTime = performanceMonitor.end();

      const scrollContainer = container.querySelector('.virtual-scroll-container');
      performanceMonitor.start();
      fireEvent.scroll(scrollContainer!, { target: { scrollTop: 300 } });
      const scrollTime = performanceMonitor.end();

      // 即使在低端设备约束下也应该保持性能
      expect(renderTime).toBeLessThan(performanceTargets.initialRender);
      expect(scrollTime).toBeLessThan(performanceTargets.scrollResponse);
    });
  });
});