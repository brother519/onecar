import React, { createContext, useState, useContext, ReactNode } from 'react';

// 地址接口
export interface Address {
  id: string;
  recipient: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  zipCode: string;
  isDefault: boolean;
}

// 用户信息接口
export interface User {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  addresses: Address[];
}

// 用户上下文接口
interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  addAddress: (address: Address) => void;
  updateAddress: (addressId: string, address: Partial<Address>) => void;
  removeAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;
}

// 创建用户上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 用户提供者属性接口
interface UserProviderProps {
  children: ReactNode;
}

// 用户提供者组件
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // 用户是否已登录
  const isLoggedIn = user !== null;

  // 用户登录
  const login = (userData: User) => {
    setUser(userData);
  };

  // 用户登出
  const logout = () => {
    setUser(null);
  };

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // 添加地址
  const addAddress = (address: Address) => {
    if (user) {
      const updatedAddresses = [...user.addresses, address];
      setUser({ ...user, addresses: updatedAddresses });
    }
  };

  // 更新地址
  const updateAddress = (addressId: string, addressData: Partial<Address>) => {
    if (user) {
      const updatedAddresses = user.addresses.map(addr => 
        addr.id === addressId ? { ...addr, ...addressData } : addr
      );
      setUser({ ...user, addresses: updatedAddresses });
    }
  };

  // 移除地址
  const removeAddress = (addressId: string) => {
    if (user) {
      const updatedAddresses = user.addresses.filter(addr => addr.id !== addressId);
      setUser({ ...user, addresses: updatedAddresses });
    }
  };

  // 设置默认地址
  const setDefaultAddress = (addressId: string) => {
    if (user) {
      const updatedAddresses = user.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }));
      setUser({ ...user, addresses: updatedAddresses });
    }
  };

  // 提供上下文值
  const value = {
    user,
    isLoggedIn,
    login,
    logout,
    updateUser,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// 使用用户上下文的自定义钩子
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser必须在UserProvider内部使用');
  }
  return context;
};