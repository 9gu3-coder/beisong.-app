import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

// 确保数据目录存在
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 初始化数据库表
export function initDatabase(): void {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 内容表
  db.exec(`
    CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 错误记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS error_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content_id INTEGER NOT NULL,
      wrong_text TEXT NOT NULL,
      correct_text TEXT NOT NULL,
      error_type TEXT DEFAULT 'wrong',
      error_count INTEGER DEFAULT 1,
      first_error_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_error_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
      UNIQUE(user_id, content_id, wrong_text, correct_text)
    )
  `);
  
  // 迁移：为旧数据库添加 error_type 字段
  const columns = db.prepare("PRAGMA table_info(error_records)").all() as any[];
  const hasErrorType = columns.some(col => col.name === 'error_type');
  if (!hasErrorType) {
    db.prepare("ALTER TABLE error_records ADD COLUMN error_type TEXT DEFAULT 'wrong'").run();
  }

  // 学习记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content_id INTEGER NOT NULL,
      mode TEXT NOT NULL,
      correct_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contents_user_id ON contents(user_id);
    CREATE INDEX IF NOT EXISTS idx_error_records_user_id ON error_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_error_records_content_id ON error_records(content_id);
    CREATE INDEX IF NOT EXISTS idx_study_records_user_id ON study_records(user_id);
  `);
}
