// 本地存储服务 - 用于未登录用户的数据持久化
import { Content, ErrorRecord, ErrorCategory } from '../types';
import { extractErrorPairs } from './textUtils';

const STORAGE_KEYS = {
  CONTENTS: 'recitation_contents',
  ERRORS: 'recitation_errors',
  USER: 'recitation_user',
  TOKEN: 'recitation_token',
};

// 生成唯一ID（本地存储用）
function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// 内容相关操作
export const localContentService = {
  // 获取内容列表
  getList(): Content[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // 获取内容详情
  getDetail(id: number): Content | null {
    const list = this.getList();
    return list.find(item => item.id === id) || null;
  },

  // 创建内容
  create(title: string, content: string): Content {
    const list = this.getList();
    const now = new Date().toISOString();
    const newContent: Content = {
      id: generateId(),
      title,
      content,
      created_at: now,
      updated_at: now,
    };
    list.unshift(newContent);
    localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(list));
    return newContent;
  },

  // 更新内容
  update(id: number, data: { title?: string; content?: string }): Content | null {
    const list = this.getList();
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    list[index] = {
      ...list[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(list));
    return list[index];
  },

  // 删除内容
  delete(id: number): boolean {
    const list = this.getList();
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(filtered));
    // 同时删除相关的错误记录
    const errors = localErrorService.getList();
    const filteredErrors = errors.filter(e => e.content_id !== id);
    localStorage.setItem(STORAGE_KEYS.ERRORS, JSON.stringify(filteredErrors));
    return true;
  },
};

// 错误记录相关操作
export const localErrorService = {
  // 获取错误记录列表
  getList(): ErrorRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ERRORS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // 获取单条内容的错误记录
  getByContentId(contentId: number): ErrorRecord[] {
    const list = this.getList();
    return list.filter(item => item.content_id === contentId);
  },

  // 批量添加错误记录（去重并累加次数）
  batchAdd(contentId: number, errors: Array<{ wrongText: string; correctText: string; category?: ErrorCategory }>): void {
    const list = this.getList();
    const now = new Date().toISOString();
    
    for (const error of errors) {
      const existingIndex = list.findIndex(
        item =>
          item.content_id === contentId &&
          item.wrong_text === error.wrongText &&
          item.correct_text === error.correctText
      );
      
      if (existingIndex !== -1) {
        list[existingIndex].error_count += 1;
        list[existingIndex].last_error_at = now;
        if (error.category) {
          list[existingIndex].error_type = error.category;
        }
      } else {
        list.push({
          id: generateId(),
          content_id: contentId,
          wrong_text: error.wrongText,
          correct_text: error.correctText,
          error_type: error.category || 'wrong',
          error_count: 1,
          first_error_at: now,
          last_error_at: now,
        });
      }
    }
    
    localStorage.setItem(STORAGE_KEYS.ERRORS, JSON.stringify(list));
  },

  // 删除错误记录
  delete(id: number): boolean {
    const list = this.getList();
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.ERRORS, JSON.stringify(filtered));
    return true;
  },

  // 获取统计数据
  getStats() {
    const list = this.getList();
    const totalErrors = list.reduce((sum, item) => sum + item.error_count, 0);
    const frequentErrors = list.filter(item => item.error_count >= 3).length;
    
    // 最近7天趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyTrend: Array<{ date: string; errors: number }> = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayErrors = list
        .filter(item => {
          const lastErrorDate = item.last_error_at.split('T')[0];
          return lastErrorDate === dateStr;
        })
        .reduce((sum, item) => sum + item.error_count, 0);
      
      weeklyTrend.push({ date: dateStr, errors: dayErrors });
    }
    
    return { totalErrors, frequentErrors, weeklyTrend };
  },
};

// 导出存储键
export { STORAGE_KEYS };
