import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useProductStore, 
  useUserStore, 
  useUIStore,
  useProductActions,
  useNotifications 
} from '../index';
import { Product, User } from '@/types';

const mockProduct: Product = {
  id: '1',
  name: '测试商品',
  description: '测试描述',
  price: 100,
  category: '电子产品',
  images: ['test.jpg'],
  tags: ['测试'],
  status: 'active',
  sortOrder: 0,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
  sku: 'TEST001',
  stock: 10,
};

const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  permissions: [
    { id: '1', name: 'create_product', resource: 'product', action: 'create' },
    { id: '2', name: 'edit_product', resource: 'product', action: 'edit' },
  ],
};

describe('useProductStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useProductStore.setState({
      products: [],
      currentProduct: null,
      selectedProducts: [],
      loading: {
        isLoading: false,
        hasMore: true,
        error: null,
        currentPage: 0,
      },
    });
  });

  it('应该初始化空的产品状态', () => {
    const { result } = renderHook(() => useProductStore());

    expect(result.current.products).toEqual([]);
    expect(result.current.currentProduct).toBeNull();
    expect(result.current.selectedProducts).toEqual([]);
    expect(result.current.loading.isLoading).toBe(false);
  });

  it('应该设置产品列表', () => {
    const { result } = renderHook(() => useProductStore());
    const products = [mockProduct];

    act(() => {
      result.current.setProducts(products);
    });

    expect(result.current.products).toEqual(products);
  });

  it('应该添加产品', () => {
    const { result } = renderHook(() => useProductStore());

    act(() => {
      result.current.addProduct(mockProduct);
    });

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0]).toEqual(mockProduct);
  });

  it('应该更新产品', () => {
    const { result } = renderHook(() => useProductStore());

    act(() => {
      result.current.setProducts([mockProduct]);
    });

    const updates = { name: '更新的产品', price: 200 };

    act(() => {
      result.current.updateProduct('1', updates);
    });

    expect(result.current.products[0].name).toBe('更新的产品');
    expect(result.current.products[0].price).toBe(200);
  });

  it('应该删除产品', () => {
    const { result } = renderHook(() => useProductStore());

    act(() => {
      result.current.setProducts([mockProduct]);
    });

    act(() => {
      result.current.removeProduct('1');
    });

    expect(result.current.products).toHaveLength(0);
  });

  it('应该设置当前产品', () => {
    const { result } = renderHook(() => useProductStore());

    act(() => {
      result.current.setCurrentProduct(mockProduct);
    });

    expect(result.current.currentProduct).toEqual(mockProduct);
  });

  it('应该管理产品选择状态', () => {
    const { result } = renderHook(() => useProductStore());

    act(() => {
      result.current.setSelectedProducts(['1', '2']);
    });

    expect(result.current.selectedProducts).toEqual(['1', '2']);
  });

  it('应该切换产品选择状态', () => {
    const { result } = renderHook(() => useProductStore());

    act(() => {
      result.current.toggleProductSelection('1');
    });

    expect(result.current.selectedProducts).toContain('1');

    act(() => {
      result.current.toggleProductSelection('1');
    });

    expect(result.current.selectedProducts).not.toContain('1');
  });

  it('应该清除选择', () => {
    const { result } = renderHook(() => useProductStore());

    act(() => {
      result.current.setSelectedProducts(['1', '2', '3']);
    });

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedProducts).toEqual([]);
  });

  it('应该重新排序产品', () => {
    const { result } = renderHook(() => useProductStore());
    const product2 = { ...mockProduct, id: '2', name: '产品2' };
    const products = [mockProduct, product2];

    act(() => {
      result.current.setProducts(products);
    });

    const reorderedProducts = [product2, mockProduct];

    act(() => {
      result.current.reorderProducts(reorderedProducts);
    });

    expect(result.current.products[0].id).toBe('2');
    expect(result.current.products[1].id).toBe('1');
  });

  it('应该管理加载状态', () => {
    const { result } = renderHook(() => useProductStore());

    act(() => {
      result.current.startLoading();
    });

    expect(result.current.loading.isLoading).toBe(true);
    expect(result.current.loading.error).toBeNull();

    act(() => {
      result.current.stopLoading();
    });

    expect(result.current.loading.isLoading).toBe(false);
  });

  it('应该设置错误状态', () => {
    const { result } = renderHook(() => useProductStore());
    const errorMessage = '加载失败';

    act(() => {
      result.current.setError(errorMessage);
    });

    expect(result.current.loading.error).toBe(errorMessage);
    expect(result.current.loading.isLoading).toBe(false);
  });
});

describe('useUserStore', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
    
    // 重置 store 状态
    useUserStore.setState({
      user: null,
      isAuthenticated: false,
      permissions: [],
    });
  });

  it('应该初始化空的用户状态', () => {
    const { result } = renderHook(() => useUserStore());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.permissions).toEqual([]);
  });

  it('应该设置用户', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.permissions).toEqual(['create_product', 'edit_product']);
  });

  it('应该处理登录', () => {
    const { result } = renderHook(() => useUserStore());
    const token = 'mock-token';

    act(() => {
      result.current.login(mockUser, token);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe(token);
  });

  it('应该处理登出', () => {
    const { result } = renderHook(() => useUserStore());

    // 先登录
    act(() => {
      result.current.login(mockUser, 'mock-token');
    });

    // 然后登出
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.permissions).toEqual([]);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('应该更新权限', () => {
    const { result } = renderHook(() => useUserStore());
    const newPermissions = ['view_product', 'delete_product'];

    act(() => {
      result.current.updatePermissions(newPermissions);
    });

    expect(result.current.permissions).toEqual(newPermissions);
  });
});

describe('useUIStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useUIStore.setState({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'light',
      modals: {},
      notifications: [],
    });
  });

  it('应该初始化UI状态', () => {
    const { result } = renderHook(() => useUIStore());

    expect(result.current.sidebarOpen).toBe(true);
    expect(result.current.sidebarCollapsed).toBe(false);
    expect(result.current.theme).toBe('light');
    expect(result.current.modals).toEqual({});
    expect(result.current.notifications).toEqual([]);
  });

  it('应该切换侧边栏状态', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.sidebarOpen).toBe(false);

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.sidebarOpen).toBe(true);
  });

  it('应该设置侧边栏折叠状态', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setSidebarCollapsed(true);
    });

    expect(result.current.sidebarCollapsed).toBe(true);
  });

  it('应该切换主题', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
  });

  it('应该管理弹窗状态', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.openModal('testModal');
    });

    expect(result.current.modals.testModal).toBe(true);

    act(() => {
      result.current.closeModal('testModal');
    });

    expect(result.current.modals.testModal).toBe(false);
  });

  it('应该切换弹窗状态', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.toggleModal('testModal');
    });

    expect(result.current.modals.testModal).toBe(true);

    act(() => {
      result.current.toggleModal('testModal');
    });

    expect(result.current.modals.testModal).toBe(false);
  });

  it('应该添加通知', () => {
    const { result } = renderHook(() => useUIStore());

    const notification = {
      type: 'success' as const,
      title: '成功',
      message: '操作成功',
    };

    act(() => {
      result.current.addNotification(notification);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject(notification);
    expect(result.current.notifications[0].id).toBeDefined();
  });

  it('应该移除通知', () => {
    const { result } = renderHook(() => useUIStore());

    const notification = {
      type: 'info' as const,
      title: '信息',
      message: '测试信息',
    };

    act(() => {
      result.current.addNotification(notification);
    });

    const notificationId = result.current.notifications[0].id;

    act(() => {
      result.current.removeNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('应该清除所有通知', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.addNotification({ type: 'success', title: '1', message: '1' });
      result.current.addNotification({ type: 'error', title: '2', message: '2' });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });
});

describe('useProductActions', () => {
  it('应该返回产品操作方法', () => {
    const { result } = renderHook(() => useProductActions());

    expect(typeof result.current.addProduct).toBe('function');
    expect(typeof result.current.updateProduct).toBe('function');
    expect(typeof result.current.removeProduct).toBe('function');
    expect(typeof result.current.reorderProducts).toBe('function');
    expect(typeof result.current.setCurrentProduct).toBe('function');
    expect(typeof result.current.setSelectedProducts).toBe('function');
    expect(typeof result.current.toggleProductSelection).toBe('function');
    expect(typeof result.current.clearSelection).toBe('function');
  });
});

describe('useNotifications', () => {
  beforeEach(() => {
    useUIStore.setState({ notifications: [] });
  });

  it('应该提供通知方法', () => {
    const { result } = renderHook(() => useNotifications());

    expect(typeof result.current.showSuccess).toBe('function');
    expect(typeof result.current.showError).toBe('function');
    expect(typeof result.current.showWarning).toBe('function');
    expect(typeof result.current.showInfo).toBe('function');
    expect(typeof result.current.removeNotification).toBe('function');
    expect(typeof result.current.clearNotifications).toBe('function');
  });

  it('应该显示成功通知', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.showSuccess('成功', '操作成功');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('success');
    expect(result.current.notifications[0].title).toBe('成功');
    expect(result.current.notifications[0].message).toBe('操作成功');
  });

  it('应该显示错误通知', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.showError('错误', '操作失败');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('error');
  });

  it('应该显示警告通知', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.showWarning('警告', '注意事项');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('warning');
  });

  it('应该显示信息通知', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.showInfo('信息', '提示信息');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('info');
  });
});