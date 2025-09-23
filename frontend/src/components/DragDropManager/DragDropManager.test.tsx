import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DragDropManager, useDragDropManager } from '../index';
import { Product } from '@/types';

// Mock @dnd-kit modules
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => (
    <div data-testid="dnd-context" onDrop={() => onDragEnd?.({ active: { id: '1' }, over: { id: '2' } })}>
      {children}
    </div>
  ),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: 'vertical',
  arrayMove: (array: any[], fromIndex: number, toIndex: number) => {
    const result = [...array];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  },
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: (transform: any) => transform ? 'transform' : '',
    },
  },
}));

const mockProducts: Product[] = [
  {
    id: '1',
    name: '商品1',
    description: '描述1',
    price: 100,
    category: '电子产品',
    images: ['image1.jpg'],
    tags: ['tag1'],
    status: 'active',
    sortOrder: 0,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    sku: 'SKU001',
    stock: 10,
  },
  {
    id: '2',
    name: '商品2',
    description: '描述2',
    price: 200,
    category: '服装配饰',
    images: ['image2.jpg'],
    tags: ['tag2'],
    status: 'active',
    sortOrder: 1,
    createdAt: '2023-01-02',
    updatedAt: '2023-01-02',
    sku: 'SKU002',
    stock: 20,
  },
];

describe('DragDropManager', () => {
  const mockOnReorder = vi.fn();
  const mockRenderItem = vi.fn((item: Product) => (
    <div data-testid={`item-${item.id}`}>{item.name}</div>
  ));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染所有产品项目', () => {
    render(
      <DragDropManager
        items={mockProducts}
        onReorder={mockOnReorder}
        renderItem={mockRenderItem}
      />
    );

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
  });

  it('应该在禁用状态下不显示拖拽功能', () => {
    render(
      <DragDropManager
        items={mockProducts}
        onReorder={mockOnReorder}
        renderItem={mockRenderItem}
        disabled={true}
      />
    );

    expect(screen.queryByTestId('dnd-context')).not.toBeInTheDocument();
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
  });

  it('应该应用自定义 className', () => {
    const { container } = render(
      <DragDropManager
        items={mockProducts}
        onReorder={mockOnReorder}
        renderItem={mockRenderItem}
        className="custom-class"
      />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('应该正确调用 renderItem 函数', () => {
    render(
      <DragDropManager
        items={mockProducts}
        onReorder={mockOnReorder}
        renderItem={mockRenderItem}
      />
    );

    expect(mockRenderItem).toHaveBeenCalledWith(mockProducts[0], false);
    expect(mockRenderItem).toHaveBeenCalledWith(mockProducts[1], false);
  });
});

describe('useDragDropManager', () => {
  it('应该初始化产品列表', () => {
    let hookResult: any;
    
    function TestComponent() {
      hookResult = useDragDropManager(mockProducts);
      return null;
    }

    render(<TestComponent />);

    expect(hookResult.items).toEqual(mockProducts);
  });

  it('应该正确处理重新排序', () => {
    let hookResult: any;
    
    function TestComponent() {
      hookResult = useDragDropManager(mockProducts);
      return null;
    }

    render(<TestComponent />);

    const newOrder = [mockProducts[1], mockProducts[0]];
    hookResult.handleReorder(newOrder);

    expect(hookResult.items).toEqual(newOrder);
  });

  it('应该正确添加产品', () => {
    let hookResult: any;
    
    function TestComponent() {
      hookResult = useDragDropManager(mockProducts);
      return null;
    }

    render(<TestComponent />);

    const newProduct: Product = {
      id: '3',
      name: '商品3',
      description: '描述3',
      price: 300,
      category: '家居用品',
      images: ['image3.jpg'],
      tags: ['tag3'],
      status: 'active',
      sortOrder: 2,
      createdAt: '2023-01-03',
      updatedAt: '2023-01-03',
      sku: 'SKU003',
      stock: 30,
    };

    hookResult.addItem(newProduct);

    expect(hookResult.items).toHaveLength(3);
    expect(hookResult.items[2]).toEqual(newProduct);
  });

  it('应该正确移除产品', () => {
    let hookResult: any;
    
    function TestComponent() {
      hookResult = useDragDropManager(mockProducts);
      return null;
    }

    render(<TestComponent />);

    hookResult.removeItem('1');

    expect(hookResult.items).toHaveLength(1);
    expect(hookResult.items[0].id).toBe('2');
  });

  it('应该正确更新产品', () => {
    let hookResult: any;
    
    function TestComponent() {
      hookResult = useDragDropManager(mockProducts);
      return null;
    }

    render(<TestComponent />);

    const updates = { name: '更新的商品1', price: 150 };
    hookResult.updateItem('1', updates);

    const updatedItem = hookResult.items.find((item: Product) => item.id === '1');
    expect(updatedItem.name).toBe('更新的商品1');
    expect(updatedItem.price).toBe(150);
  });

  it('应该正确移动产品位置', () => {
    let hookResult: any;
    
    function TestComponent() {
      hookResult = useDragDropManager(mockProducts);
      return null;
    }

    render(<TestComponent />);

    hookResult.moveItem(0, 1);

    expect(hookResult.items[0].id).toBe('2');
    expect(hookResult.items[1].id).toBe('1');
  });
});