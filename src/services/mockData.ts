import { Task, User, TaskStatus, TaskPriority } from '../types';

// 模拟用户数据
export const mockUsers: User[] = [
  {
    id: 'user1',
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan'
  },
  {
    id: 'user2', 
    name: '李四',
    email: 'lisi@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi'
  },
  {
    id: 'user3',
    name: '王五',
    email: 'wangwu@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu'
  },
  {
    id: 'user4',
    name: '赵六',
    email: 'zhaoliu@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu'
  }
];

// 模拟任务数据
export const mockTasks: Task[] = [
  {
    id: 'task1',
    title: '完成产品原型设计',
    description: '设计主要功能页面的原型，包括用户界面和交互流程',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    assignee: mockUsers[0],
    dueDate: '2024-12-31T23:59:59Z',
    createdAt: '2024-10-01T08:00:00Z',
    updatedAt: '2024-10-05T10:30:00Z',
    tags: ['设计', '原型', 'UI']
  },
  {
    id: 'task2',
    title: '前端页面开发',
    description: '根据设计稿开发React组件和页面',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    assignee: mockUsers[1],
    dueDate: '2024-11-15T18:00:00Z',
    createdAt: '2024-10-02T09:15:00Z',
    updatedAt: '2024-10-02T09:15:00Z',
    tags: ['开发', '前端', 'React']
  },
  {
    id: 'task3',
    title: '数据库设计',
    description: '设计任务管理系统的数据库表结构',
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.HIGH,
    assignee: mockUsers[2],
    dueDate: '2024-10-20T17:00:00Z',
    completedDate: '2024-10-18T15:30:00Z',
    createdAt: '2024-09-25T14:20:00Z',
    updatedAt: '2024-10-18T15:30:00Z',
    tags: ['数据库', '设计']
  },
  {
    id: 'task4',
    title: 'API接口开发',
    description: '开发任务管理相关的后端API接口',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.URGENT,
    assignee: mockUsers[3],
    dueDate: '2024-11-01T23:59:59Z',
    createdAt: '2024-10-03T11:45:00Z',
    updatedAt: '2024-10-08T16:20:00Z',
    tags: ['后端', 'API', '开发']
  },
  {
    id: 'task5',
    title: '用户体验测试',
    description: '对完成的功能进行用户体验测试并收集反馈',
    status: TaskStatus.PENDING,
    priority: TaskPriority.LOW,
    assignee: mockUsers[0],
    dueDate: '2024-12-10T17:00:00Z',
    createdAt: '2024-10-04T13:30:00Z',
    updatedAt: '2024-10-04T13:30:00Z',
    tags: ['测试', '用户体验']
  },
  {
    id: 'task6',
    title: '系统部署上线',
    description: '将系统部署到生产环境并进行上线准备',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: '2024-12-20T12:00:00Z',
    createdAt: '2024-10-05T16:00:00Z',
    updatedAt: '2024-10-05T16:00:00Z',
    tags: ['部署', '上线']
  }
];