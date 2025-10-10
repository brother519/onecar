import { create } from 'zustand';
import { 
  Task, 
  User, 
  TaskFilters, 
  PaginationParams,
  TaskCreateRequest,
  TaskUpdateRequest
} from '../types';
import { TaskAPI } from '../services/taskAPI';

interface TaskState {
  // 任务数据
  tasks: Task[];
  total: number;
  loading: boolean;
  
  // 筛选和分页
  filters: TaskFilters;
  pagination: PaginationParams;
  
  // 用户数据
  users: User[];
  
  // UI状态
  selectedTaskIds: string[];
  currentTask: Task | null;
  modalVisible: boolean;
  modalMode: 'create' | 'edit' | 'view';
  
  // Actions
  loadTasks: () => Promise<void>;
  loadUsers: () => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setPagination: (pagination: Partial<PaginationParams>) => void;
  createTask: (data: TaskCreateRequest) => Promise<boolean>;
  updateTask: (id: string, data: TaskUpdateRequest) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  batchDeleteTasks: (ids: string[]) => Promise<boolean>;
  
  // UI Actions
  setSelectedTaskIds: (ids: string[]) => void;
  toggleTaskSelection: (id: string) => void;
  selectAllTasks: () => void;
  clearSelection: () => void;
  openModal: (mode: 'create' | 'edit' | 'view', task?: Task) => void;
  closeModal: () => void;
  
  // 重置筛选
  resetFilters: () => void;
}

const initialFilters: TaskFilters = {};
const initialPagination: PaginationParams = { page: 1, pageSize: 20 };

export const useTaskStore = create<TaskState>((set, get) => ({
  // 初始状态
  tasks: [],
  total: 0,
  loading: false,
  filters: initialFilters,
  pagination: initialPagination,
  users: [],
  selectedTaskIds: [],
  currentTask: null,
  modalVisible: false,
  modalMode: 'create',

  // 加载任务列表
  loadTasks: async () => {
    set({ loading: true });
    try {
      const { filters, pagination } = get();
      const response = await TaskAPI.getTasks(filters, pagination);
      
      if (response.success) {
        set({
          tasks: response.data.tasks,
          total: response.data.total,
          loading: false
        });
      } else {
        set({ loading: false });
        console.error('加载任务失败:', response.message);
      }
    } catch (error) {
      set({ loading: false });
      console.error('加载任务异常:', error);
    }
  },

  // 加载用户列表
  loadUsers: async () => {
    try {
      const response = await TaskAPI.getUsers();
      if (response.success) {
        set({ users: response.data });
      }
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  },

  // 设置筛选条件
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 } // 重置页码
    }));
    // 自动重新加载任务
    setTimeout(() => {
      get().loadTasks();
    }, 0);
  },

  // 设置分页参数
  setPagination: (newPagination) => {
    set(state => ({
      pagination: { ...state.pagination, ...newPagination }
    }));
    // 自动重新加载任务
    setTimeout(() => {
      get().loadTasks();
    }, 0);
  },

  // 创建任务
  createTask: async (data) => {
    try {
      const response = await TaskAPI.createTask(data);
      if (response.success) {
        // 重新加载任务列表
        await get().loadTasks();
        return true;
      } else {
        console.error('创建任务失败:', response.message);
        return false;
      }
    } catch (error) {
      console.error('创建任务异常:', error);
      return false;
    }
  },

  // 更新任务
  updateTask: async (id, data) => {
    try {
      const response = await TaskAPI.updateTask(id, data);
      if (response.success) {
        // 重新加载任务列表
        await get().loadTasks();
        return true;
      } else {
        console.error('更新任务失败:', response.message);
        return false;
      }
    } catch (error) {
      console.error('更新任务异常:', error);
      return false;
    }
  },

  // 删除任务
  deleteTask: async (id) => {
    try {
      const response = await TaskAPI.deleteTask(id);
      if (response.success) {
        // 重新加载任务列表
        await get().loadTasks();
        return true;
      } else {
        console.error('删除任务失败:', response.message);
        return false;
      }
    } catch (error) {
      console.error('删除任务异常:', error);
      return false;
    }
  },

  // 批量删除任务
  batchDeleteTasks: async (ids) => {
    try {
      const response = await TaskAPI.batchDeleteTasks(ids);
      if (response.success) {
        // 清空选择并重新加载任务列表
        set({ selectedTaskIds: [] });
        await get().loadTasks();
        return true;
      } else {
        console.error('批量删除任务失败:', response.message);
        return false;
      }
    } catch (error) {
      console.error('批量删除任务异常:', error);
      return false;
    }
  },

  // UI Actions
  setSelectedTaskIds: (ids) => {
    set({ selectedTaskIds: ids });
  },

  toggleTaskSelection: (id) => {
    set(state => {
      const isSelected = state.selectedTaskIds.includes(id);
      return {
        selectedTaskIds: isSelected
          ? state.selectedTaskIds.filter(taskId => taskId !== id)
          : [...state.selectedTaskIds, id]
      };
    });
  },

  selectAllTasks: () => {
    const { tasks } = get();
    set({ selectedTaskIds: tasks.map(task => task.id) });
  },

  clearSelection: () => {
    set({ selectedTaskIds: [] });
  },

  openModal: (mode, task) => {
    set({
      modalVisible: true,
      modalMode: mode,
      currentTask: task || null
    });
  },

  closeModal: () => {
    set({
      modalVisible: false,
      currentTask: null
    });
  },

  // 重置筛选
  resetFilters: () => {
    set({
      filters: initialFilters,
      pagination: initialPagination
    });
    // 自动重新加载任务
    setTimeout(() => {
      get().loadTasks();
    }, 0);
  }
}));