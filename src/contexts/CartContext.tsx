import React, { createContext, useState, useContext, ReactNode } from 'react';

// 购物车项目接口定义
export interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  specs?: {
    [key: string]: string;
  };
}

// 购物车上下文接口
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

// 创建购物车上下文
const CartContext = createContext<CartContextType | undefined>(undefined);

// 购物车提供者属性接口
interface CartProviderProps {
  children: ReactNode;
}

// 购物车提供者组件
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // 计算购物车中的总商品数量
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // 计算购物车中的总金额
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 添加商品到购物车
  const addItem = (item: CartItem) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id);
      if (existingItem) {
        // 如果商品已存在，则更新数量
        return prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        // 如果商品不存在，则添加新商品
        return [...prevItems, item];
      }
    });
  };

  // 从购物车移除商品
  const removeItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // 更新购物车中商品的数量
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // 清空购物车
  const clearCart = () => {
    setItems([]);
  };

  // 提供上下文值
  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// 使用购物车上下文的自定义钩子
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart必须在CartProvider内部使用');
  }
  return context;
};