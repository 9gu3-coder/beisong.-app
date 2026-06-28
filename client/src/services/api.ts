// API服务模块
import { User, Content, ErrorRecord, StudyStats, ErrorStats } from '../types';

const API_BASE = '/api';

// 通用请求函数
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new Error(data.error || `请求失败: ${response.status}`);
  }
  
  return data as T;
}

// 认证相关API
export const authApi = {
  // 注册
  register: (email: string, password: string, name: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  // 登录
  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // 获取当前用户信息
  getCurrentUser: () =>
    request<{ user: User }>('/auth/me'),

  // 更新用户信息
  updateUser: (data: { name?: string; password?: string }) =>
    request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// 内容管理API
export const contentApi = {
  // 获取内容列表
  getList: () =>
    request<{ contents: Content[] }>('/contents'),

  // 获取内容详情
  getDetail: (id: number) =>
    request<{ content: Content }>(`/contents/${id}`),

  // 创建内容
  create: (title: string, content: string) =>
    request('/contents', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    }),

  // 更新内容
  update: (id: number, data: { title?: string; content?: string }) =>
    request(`/contents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // 删除内容
  delete: (id: number) =>
    request(`/contents/${id}`, {
      method: 'DELETE',
    }),
};

// 错误记录API
export const errorApi = {
  // 获取错误记录列表
  getList: (params?: { contentId?: number; sortBy?: string; order?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.contentId) searchParams.set('contentId', String(params.contentId));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    
    return request<{ records: ErrorRecord[]; total: number }>(
      `/errors?${searchParams.toString()}`
    );
  },

  // 批量提交错误记录
  batchCreate: (contentId: number, errors: Array<{ wrongText: string; correctText: string }>) =>
    request('/errors/batch', {
      method: 'POST',
      body: JSON.stringify({ contentId, errors }),
    }),

  // 删除错误记录
  delete: (id: number) =>
    request(`/errors/${id}`, {
      method: 'DELETE',
    }),

  // 获取错误统计
  getStats: () =>
    request<ErrorStats>('/errors/stats/summary'),
};

// 学习记录API
export const studyApi = {
  // 记录学习
  record: (contentId: number, mode: string, correctRate?: number) =>
    request('/study', {
      method: 'POST',
      body: JSON.stringify({ contentId, mode, correctRate }),
    }),

  // 获取学习统计
  getStats: () =>
    request<StudyStats>('/study/stats'),
};
