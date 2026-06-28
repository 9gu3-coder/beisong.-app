// 类型定义

// 用户信息
export interface User {
  id: number;
  email: string;
  name: string;
  created_at?: string;
}

// 内容（默写材料）
export interface Content {
  id: number;
  user_id?: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// 错误类型
export type ErrorCategory = 'wrong' | 'missing' | 'extra';

// 错误记录
export interface ErrorRecord {
  id: number;
  user_id?: number;
  content_id: number;
  content_title?: string;
  wrong_text: string;
  correct_text: string;
  error_type?: ErrorCategory;
  error_count: number;
  first_error_at: string;
  last_error_at: string;
}

// 学习记录
export interface StudyRecord {
  id: number;
  user_id: number;
  content_id: number;
  mode: 'free' | 'blank';
  correct_rate: number;
  created_at: string;
}

// 差异比对结果
export type DiffType = 'correct' | 'wrong' | 'missing' | 'extra';

export interface DiffResult {
  type: DiffType;
  text: string;
}

// 错误对
export interface ErrorPair {
  wrongText: string;
  correctText: string;
  category: ErrorCategory;
}

// 默写模式
export type RecitationMode = 'free' | 'blank';

// API响应
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  [key: string]: any;
}

// 学习统计
export interface StudyStats {
  totalStudies: number;
  averageCorrectRate: number;
  weeklyStudies: number;
  accuracyTrend: Array<{
    date: string;
    avg_correct_rate: number;
  }>;
}

// 错误统计
export interface ErrorStats {
  totalErrors: number;
  frequentErrors: number;
  weeklyTrend: Array<{
    date: string;
    errors: number;
  }>;
}
