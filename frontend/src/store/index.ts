import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Product, User, LoadingState } from '@/types';

// 产品状态接口
interface ProductState {
  // 产品数据
  products: Product[];
  currentProduct: Product | null;
  selectedProducts: string[];
  
  // 加载状态
  loading: LoadingState;
  
  // 操作方法
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  setCurrentProduct: (product: Product | null) => void;
  setSelectedProducts: (ids: string[]) => void;
  toggleProductSelection: (id: string) => void;
  clearSelection: () => void;
  reorderProducts: (newOrder: Product[]) => void;
  
  // 加载状态管理
  setLoading: (loading: Partial<LoadingState>) => void;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: string | null) => void;
}

// 用户状态接口
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
  
  setUser: (user: User | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updatePermissions: (permissions: string[]) => void;
}

// UI 状态接口
interface UIState {
  // 侧边栏状态
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // 主题设置
  theme: 'light' | 'dark';
  
  // 弹窗状态
  modals: Record<string, boolean>;
  
  // 通知状态
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }>;
  
  // 操作方法
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

// 创建产品状态存储
export const useProductStore = create<ProductState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      products: [],
      currentProduct: null,
      selectedProducts: [],
      loading: {
        isLoading: false,
        hasMore: true,
        error: null,
        currentPage: 0,
      },
      
      // 产品数据操作
      setProducts: (products) =>
        set({ products }, false, 'setProducts'),
      
      addProduct: (product) =>
        set(
          (state) => ({ products: [...state.products, product] }),
          false,
          'addProduct'
        ),
      
      updateProduct: (id, updates) =>
        set(
          (state) => ({
            products: state.products.map((product) =>
              product.id === id ? { ...product, ...updates } : product
            ),
            currentProduct:
              state.currentProduct?.id === id
                ? { ...state.currentProduct, ...updates }
                : state.currentProduct,
          }),
          false,
          'updateProduct'
        ),
      
      removeProduct: (id) =>
        set(
          (state) => ({
            products: state.products.filter((product) => product.id !== id),
            selectedProducts: state.selectedProducts.filter((selectedId) => selectedId !== id),
            currentProduct: state.currentProduct?.id === id ? null : state.currentProduct,
          }),
          false,
          'removeProduct'
        ),
      
      setCurrentProduct: (product) =>
        set({ currentProduct: product }, false, 'setCurrentProduct'),
      
      // 选择操作
      setSelectedProducts: (ids) =>
        set({ selectedProducts: ids }, false, 'setSelectedProducts'),
      
      toggleProductSelection: (id) =>
        set(
          (state) => ({
            selectedProducts: state.selectedProducts.includes(id)
              ? state.selectedProducts.filter((selectedId) => selectedId !== id)
              : [...state.selectedProducts, id],
          }),
          false,
          'toggleProductSelection'
        ),
      
      clearSelection: () =>
        set({ selectedProducts: [] }, false, 'clearSelection'),
      
      reorderProducts: (newOrder) =>
        set({ products: newOrder }, false, 'reorderProducts'),
      
      // 加载状态管理
      setLoading: (loading) =>
        set(
          (state) => ({ loading: { ...state.loading, ...loading } }),
          false,
          'setLoading'
        ),
      
      startLoading: () =>
        set(
          (state) => ({ loading: { ...state.loading, isLoading: true, error: null } }),
          false,
          'startLoading'
        ),
      
      stopLoading: () =>
        set(
          (state) => ({ loading: { ...state.loading, isLoading: false } }),
          false,
          'stopLoading'
        ),
      
      setError: (error) =>
        set(
          (state) => ({ loading: { ...state.loading, error, isLoading: false } }),
          false,
          'setError'
        ),
    }),
    {
      name: 'product-store',
    }
  )
);

// 创建用户状态存储
export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        permissions: [],
        
        setUser: (user) =>
          set(
            {
              user,
              isAuthenticated: !!user,
              permissions: user?.permissions?.map(p => p.name) || [],
            },
            false,
            'setUser'
          ),
        
        login: (user, token) => {
          localStorage.setItem('token', token);
          set(
            {
              user,
              isAuthenticated: true,
              permissions: user?.permissions?.map(p => p.name) || [],
            },
            false,
            'login'
          );
        },
        
        logout: () => {
          localStorage.removeItem('token');
          set(
            {
              user: null,
              isAuthenticated: false,
              permissions: [],
            },
            false,
            'logout'
          );
        },
        
        updatePermissions: (permissions) =>
          set({ permissions }, false, 'updatePermissions'),
      }),
      {
        name: 'user-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          permissions: state.permissions,
        }),
      }
    ),
    {
      name: 'user-store',
    }
  )
);

// 创建 UI 状态存储
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        sidebarOpen: true,
        sidebarCollapsed: false,
        theme: 'light',
        modals: {},
        notifications: [],
        
        // 侧边栏操作
        setSidebarOpen: (open) =>
          set({ sidebarOpen: open }, false, 'setSidebarOpen'),
        
        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }, false, 'setSidebarCollapsed'),
        
        toggleSidebar: () =>
          set(
            (state) => ({ sidebarOpen: !state.sidebarOpen }),
            false,
            'toggleSidebar'
          ),
        
        // 主题操作
        setTheme: (theme) => {
          document.documentElement.setAttribute('data-theme', theme);
          set({ theme }, false, 'setTheme');
        },
        
        toggleTheme: () => {
          const newTheme = get().theme === 'light' ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', newTheme);
          set({ theme: newTheme }, false, 'toggleTheme');
        },
        
        // 弹窗操作
        openModal: (modalId) =>
          set(
            (state) => ({ modals: { ...state.modals, [modalId]: true } }),
            false,
            'openModal'
          ),
        
        closeModal: (modalId) =>
          set(
            (state) => ({ modals: { ...state.modals, [modalId]: false } }),
            false,
            'closeModal'
          ),
        
        toggleModal: (modalId) =>
          set(
            (state) => ({
              modals: { ...state.modals, [modalId]: !state.modals[modalId] },
            }),
            false,
            'toggleModal'
          ),
        
        // 通知操作
        addNotification: (notification) => {
          const id = Math.random().toString(36).substring(2);
          const newNotification = { ...notification, id };
          
          set(
            (state) => ({
              notifications: [...state.notifications, newNotification],
            }),
            false,
            'addNotification'
          );
          
          // 自动移除通知
          if (notification.duration !== 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration || 5000);
          }
        },
        
        removeNotification: (id) =>
          set(
            (state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }),
            false,
            'removeNotification'
          ),
        
        clearNotifications: () =>
          set({ notifications: [] }, false, 'clearNotifications'),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
);

// 选择器和工具函数
export const selectProductById = (id: string) => (state: ProductState) =>
  state.products.find((product) => product.id === id);

export const selectSelectedProducts = (state: ProductState) =>
  state.products.filter((product) => state.selectedProducts.includes(product.id));

export const selectProductsByCategory = (category: string) => (state: ProductState) =>
  state.products.filter((product) => product.category === category);

export const selectProductsCount = (state: ProductState) => state.products.length;

export const selectIsProductSelected = (id: string) => (state: ProductState) =>
  state.selectedProducts.includes(id);

// 复合 hooks
export const useProductActions = () => {
  const {
    addProduct,
    updateProduct,
    removeProduct,
    reorderProducts,
    setCurrentProduct,
    setSelectedProducts,
    toggleProductSelection,
    clearSelection,
  } = useProductStore();
  
  return {
    addProduct,
    updateProduct,
    removeProduct,
    reorderProducts,
    setCurrentProduct,
    setSelectedProducts,
    toggleProductSelection,
    clearSelection,
  };
};

export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useUIStore();
  
  const showSuccess = (title: string, message: string) =>
    addNotification({ type: 'success', title, message });
  
  const showError = (title: string, message: string) =>
    addNotification({ type: 'error', title, message });
  
  const showWarning = (title: string, message: string) =>
    addNotification({ type: 'warning', title, message });
  
  const showInfo = (title: string, message: string) =>
    addNotification({ type: 'info', title, message });
  
  return {
    notifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearNotifications,
  };
};