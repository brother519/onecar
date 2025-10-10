import dayjs from 'dayjs';
import { TaskCreateRequest, TaskUpdateRequest } from '../types';

// 日期格式化
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm') => {
  return dayjs(date).format(format);
};

// 获取相对时间
export const getRelativeTime = (date: string | Date) => {
  return dayjs(date).fromNow();
};

// 检查是否过期
export const isOverdue = (dueDate: string) => {
  return dayjs(dueDate).isBefore(dayjs());
};

// 表单验证
export const validateTaskForm = (data: TaskCreateRequest | TaskUpdateRequest) => {
  const errors: Record<string, string> = {};

  // 标题验证
  if (!data.title || data.title.trim().length === 0) {
    errors.title = '任务标题不能为空';
  } else if (data.title.length > 100) {
    errors.title = '任务标题不能超过100个字符';
  }

  // 描述验证
  if (data.description && data.description.length > 1000) {
    errors.description = '任务描述不能超过1000个字符';
  }

  // 截止时间验证
  if (data.dueDate && dayjs(data.dueDate).isBefore(dayjs())) {
    errors.dueDate = '截止时间不能早于当前时间';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// 生成颜色
export const generateColor = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 50%, 50%)`;
};