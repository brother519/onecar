import { Task, Assignee, TaskFormData, TaskStatus, TaskPriority, FilterConditions } from '../types/task';
import dayjs from 'dayjs';

const TASKS_STORAGE_KEY = 'onecar_tasks';
const ASSIGNEES_STORAGE_KEY = 'onecar_assignees';

/**
 * 本地存储服务
 */
class StorageService {
  /**
   * 获取所有任务
   */
  getTasks(): Task[] {
    const data = localStorage.getItem(TASKS_STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse tasks from localStorage:', e);
        return [];
      }
    }
    return [];
  }

  /**
   * 保存所有任务
   */
  saveTasks(tasks: Task[]): void {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }

  /**
   * 获取所有负责人
   */
  getAssignees(): Assignee[] {
    const data = localStorage.getItem(ASSIGNEES_STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse assignees from localStorage:', e);
        return this.getDefaultAssignees();
      }
    }
    return this.getDefaultAssignees();
  }

  /**
   * 保存所有负责人
   */
  saveAssignees(assignees: Assignee[]): void {
    localStorage.setItem(ASSIGNEES_STORAGE_KEY, JSON.stringify(assignees));
  }

  /**
   * 获取默认负责人列表
   */
  private getDefaultAssignees(): Assignee[] {
    const defaultAssignees = [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '王五' },
      { id: 4, name: '赵六' },
      { id: 5, name: '孙七' }
    ];
    this.saveAssignees(defaultAssignees);
    return defaultAssignees;
  }

  /**
   * 初始化示例数据
   */
  initializeSampleData(): void {
    const tasks = this.getTasks();
    if (tasks.length === 0) {
      const sampleTasks: Task[] = [
        {
          id: 1,
          title: '完成系统需求分析文档',
          description: '需要详细分析用户需求，编写完整的需求文档，包括功能需求和非功能需求',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          assignees: [{ id: 1, name: '张三' }],
          dueDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
          createdAt: dayjs().subtract(2, 'day').toISOString(),
          updatedAt: dayjs().toISOString(),
          isArchived: false
        },
        {
          id: 2,
          title: '设计数据库表结构',
          description: '根据需求文档设计合理的数据库表结构',
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          assignees: [{ id: 2, name: '李四' }, { id: 3, name: '王五' }],
          dueDate: dayjs().add(10, 'day').format('YYYY-MM-DD'),
          createdAt: dayjs().subtract(1, 'day').toISOString(),
          updatedAt: dayjs().toISOString(),
          isArchived: false
        },
        {
          id: 3,
          title: '前端界面开发',
          description: '实现任务管理系统的前端界面',
          status: TaskStatus.PENDING,
          priority: TaskPriority.URGENT,
          assignees: [{ id: 4, name: '赵六' }],
          dueDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
          createdAt: dayjs().toISOString(),
          updatedAt: dayjs().toISOString(),
          isArchived: false
        }
      ];
      this.saveTasks(sampleTasks);
    }
  }
}

/**
 * 任务数据服务
 */
class TaskService {
  private storage: StorageService;

  constructor() {
    this.storage = new StorageService();
    this.storage.initializeSampleData();
  }

  /**
   * 生成新的任务ID
   */
  private generateId(): number {
    const tasks = this.storage.getTasks();
    if (tasks.length === 0) return 1;
    const maxId = Math.max(...tasks.map(t => Number(t.id)));
    return maxId + 1;
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Task[] {
    return this.storage.getTasks();
  }

  /**
   * 获取未归档的任务
   */
  getActiveTasks(): Task[] {
    return this.storage.getTasks().filter(task => !task.isArchived);
  }

  /**
   * 获取已归档的任务
   */
  getArchivedTasks(): Task[] {
    return this.storage.getTasks().filter(task => task.isArchived);
  }

  /**
   * 根据ID获取任务
   */
  getTaskById(id: string | number): Task | undefined {
    const tasks = this.storage.getTasks();
    return tasks.find(task => task.id == id);
  }

  /**
   * 创建任务
   */
  createTask(formData: TaskFormData): Task {
    const tasks = this.storage.getTasks();
    const assignees = this.storage.getAssignees();
    
    const selectedAssignees = assignees.filter(a => 
      formData.assignees.includes(a.id)
    );

    const newTask: Task = {
      id: this.generateId(),
      title: formData.title,
      description: formData.description,
      status: TaskStatus.PENDING,
      priority: formData.priority,
      assignees: selectedAssignees,
      dueDate: formData.dueDate,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
      isArchived: false
    };

    tasks.push(newTask);
    this.storage.saveTasks(tasks);
    return newTask;
  }

  /**
   * 更新任务
   */
  updateTask(id: string | number, updates: Partial<Task>): Task | null {
    const tasks = this.storage.getTasks();
    const index = tasks.findIndex(task => task.id == id);
    
    if (index === -1) return null;

    // 如果更新负责人ID列表，需要转换为完整的负责人对象
    if (updates.assignees && Array.isArray(updates.assignees)) {
      const assignees = this.storage.getAssignees();
      const assigneeIds = updates.assignees.map(a => 
        typeof a === 'object' ? a.id : a
      );
      updates.assignees = assignees.filter(a => assigneeIds.includes(a.id));
    }

    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: dayjs().toISOString()
    };

    this.storage.saveTasks(tasks);
    return tasks[index];
  }

  /**
   * 删除任务
   */
  deleteTask(id: string | number): boolean {
    const tasks = this.storage.getTasks();
    const filteredTasks = tasks.filter(task => task.id != id);
    
    if (filteredTasks.length === tasks.length) {
      return false; // 没有找到要删除的任务
    }

    this.storage.saveTasks(filteredTasks);
    return true;
  }

  /**
   * 归档任务
   */
  archiveTask(id: string | number): Task | null {
    return this.updateTask(id, { isArchived: true });
  }

  /**
   * 取消归档任务
   */
  unarchiveTask(id: string | number): Task | null {
    return this.updateTask(id, { isArchived: false });
  }

  /**
   * 筛选任务
   */
  filterTasks(tasks: Task[], conditions: FilterConditions): Task[] {
    let filtered = [...tasks];

    // 关键词筛选
    if (conditions.keyword && conditions.keyword.trim()) {
      const keyword = conditions.keyword.toLowerCase().trim();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(keyword) ||
        (task.description && task.description.toLowerCase().includes(keyword))
      );
    }

    // 状态筛选
    if (conditions.status) {
      filtered = filtered.filter(task => task.status === conditions.status);
    }

    // 优先级筛选
    if (conditions.priority) {
      filtered = filtered.filter(task => task.priority === conditions.priority);
    }

    // 负责人筛选
    if (conditions.assigneeIds && conditions.assigneeIds.length > 0) {
      filtered = filtered.filter(task => 
        task.assignees.some(assignee => 
          conditions.assigneeIds!.includes(assignee.id)
        )
      );
    }

    return filtered;
  }

  /**
   * 获取所有负责人
   */
  getAllAssignees(): Assignee[] {
    return this.storage.getAssignees();
  }
}

// 导出单例
export const taskService = new TaskService();
