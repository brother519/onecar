import React, { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product, DragDropState } from '@/types';

interface DragDropManagerProps {
  items: Product[];
  onReorder: (newOrder: Product[]) => void;
  renderItem: (item: Product, isDragging?: boolean) => React.ReactNode;
  disabled?: boolean;
  className?: string;
}

interface DragDropManagerState extends DragDropState {
  activeId: string | null;
}

/**
 * 拖拽排序管理组件
 * 
 * 功能特性：
 * - 支持商品项目的拖拽移动
 * - 实时更新排序位置
 * - 提供视觉反馈和拖拽预览
 * - 支持触摸设备操作
 * - 无障碍访问支持
 */
export const DragDropManager: React.FC<DragDropManagerProps> = ({
  items,
  onReorder,
  renderItem,
  disabled = false,
  className = '',
}) => {
  const [state, setState] = useState<DragDropManagerState>({
    draggedItem: null,
    dropZones: [],
    isDragging: false,
    sortOrder: items.map(item => item.id),
    activeId: null,
  });

  // 配置传感器，支持鼠标和触摸
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8, // 8px 移动距离后才开始拖拽
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // 250ms 长按后才开始拖拽
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  // 拖拽开始处理
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const draggedItem = items.find(item => item.id === active.id);

    setState(prev => ({
      ...prev,
      activeId: active.id as string,
      draggedItem: draggedItem || null,
      isDragging: true,
    }));
  }, [items]);

  // 拖拽过程中处理
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    // 实时预览排序变化
    setState(prev => {
      const oldIndex = prev.sortOrder.indexOf(active.id as string);
      const newIndex = prev.sortOrder.indexOf(over.id as string);
      
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      const newSortOrder = arrayMove(prev.sortOrder, oldIndex, newIndex);
      
      return {
        ...prev,
        sortOrder: newSortOrder,
      };
    });
  }, []);

  // 拖拽结束处理
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setState(prev => ({
      ...prev,
      activeId: null,
      draggedItem: null,
      isDragging: false,
    }));

    if (!over || active.id === over.id) {
      return;
    }

    // 更新最终排序
    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      
      // 更新 sortOrder 字段
      const updatedItems = reorderedItems.map((item, index) => ({
        ...item,
        sortOrder: index,
      }));

      onReorder(updatedItems);
    }
  }, [items, onReorder]);

  // 渲染拖拽中的项目
  const renderDragOverlay = useCallback(() => {
    if (!state.activeId) {
      return null;
    }

    const activeItem = items.find(item => item.id === state.activeId);
    if (!activeItem) {
      return null;
    }

    return (
      <div className="drag-overlay">
        {renderItem(activeItem, true)}
      </div>
    );
  }, [state.activeId, items, renderItem]);

  if (disabled) {
    return (
      <div className={`drag-drop-disabled ${className}`}>
        {items.map(item => (
          <div key={item.id}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={state.sortOrder} 
        strategy={verticalListSortingStrategy}
      >
        <div className={`drag-drop-container ${className}`}>
          {state.sortOrder.map(itemId => {
            const item = items.find(p => p.id === itemId);
            if (!item) return null;

            return (
              <DragDropItem
                key={item.id}
                item={item}
                renderItem={renderItem}
                isDragging={state.activeId === item.id}
              />
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {renderDragOverlay()}
      </DragOverlay>
    </DndContext>
  );
};

// 可拖拽项目组件
interface DragDropItemProps {
  item: Product;
  renderItem: (item: Product, isDragging?: boolean) => React.ReactNode;
  isDragging: boolean;
}

const DragDropItem: React.FC<DragDropItemProps> = ({
  item,
  renderItem,
  isDragging,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`drag-drop-item ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      {renderItem(item, isDragging)}
    </div>
  );
};

// 导出相关 hooks
export const useDragDropManager = (initialItems: Product[]) => {
  const [items, setItems] = useState<Product[]>(initialItems);
  
  const handleReorder = useCallback((newOrder: Product[]) => {
    setItems(newOrder);
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setItems(prev => arrayMove(prev, fromIndex, toIndex));
  }, []);

  const addItem = useCallback((item: Product, index?: number) => {
    setItems(prev => {
      if (index !== undefined) {
        return [...prev.slice(0, index), item, ...prev.slice(index)];
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateItem = useCallback((itemId: string, updates: Partial<Product>) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, []);

  return {
    items,
    setItems,
    handleReorder,
    moveItem,
    addItem,
    removeItem,
    updateItem,
  };
};