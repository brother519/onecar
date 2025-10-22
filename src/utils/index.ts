/**
 * 通用工具函数库
 * 提供日期格式化、表单验证、防抖节流、颜色生成等工具函数
 */
import dayjs from 'dayjs';
import { TaskCreateRequest, TaskUpdateRequest } from '../types';

/**
 * 日期格式化
 * @param {string | Date} date - 需要格式化的日期
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD HH:mm'
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm') => {
  return dayjs(date).format(format);
};

/**
 * 获取相对时间
 * @param {string | Date} date - 日期
 * @returns {string} 相对时间描述（如 "2小时前"）
 */
export const getRelativeTime = (date: string | Date) => {
  return dayjs(date).fromNow();
};

/**
 * 检查是否过期
 * @param {string} dueDate - 截止日期
 * @returns {boolean} 是否已过期
 */
export const isOverdue = (dueDate: string) => {
  return dayjs(dueDate).isBefore(dayjs());
};

/**
 * 表单验证
 * @param {TaskCreateRequest | TaskUpdateRequest} data - 任务表单数据
 * @returns {{ isValid: boolean, errors: Record<string, string> }} 验证结果
 */
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

/**
 * 防抖函数
 * @param {T} func - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
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

/**
 * 节流函数
 * @param {T} func - 需要节流的函数
 * @param {number} delay - 节流时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
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

/**
 * 生成颜色
 * 根据文本内容生成一致的颜色值
 * @param {string} text - 文本内容
 * @returns {string} HSL 颜色值
 */
export const generateColor = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 50%, 50%)`;
};