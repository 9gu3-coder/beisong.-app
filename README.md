# 背诵默写应用

一款专注于背诵默写练习的 Web 应用，帮助用户通过两种默写模式高效记忆文本内容，并通过智能错误追踪系统持续改进薄弱环节。

## 功能特性

### 1. 内容导入与管理
- 导入任意文字内容作为默写材料
- 自定义内容命名
- 卡片式内容列表展示
- 支持删除、重命名已导入内容

### 2. 两种默写模式
- **自由输入模式**：原文消失后，凭记忆完整输入内容
- **智能挖空模式**：按句子为单位，每隔两句挖空一句，填写缺失内容
- 支持"重新随机挖空"，多次练习

### 3. 智能检查与错误记录
- 逐字比对，标出遗漏、多余、错写的文字
- 高亮显示错误位置
- 错误自动记录到错题本
- 按错误次数降序排列，优先展示高频错误
- 支持按所属内容筛选

### 4. 用户账号系统
- 邮箱+密码注册登录
- 用户数据与账号绑定，支持多设备同步
- 未登录用户可使用本地存储体验基础功能

### 5. UI/UX 设计
- 极简主义风格，白色/浅灰色为主色调
- 大量留白，内容区与功能区界限清晰
- 圆角设计，响应式布局
- 移动端基本可用

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM

### 后端
- Node.js + Express + TypeScript
- SQLite (better-sqlite3)
- JWT 认证
- bcryptjs 密码加密

## 项目结构

```
recitation-app/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── context/        # 状态管理
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   ├── types/          # 类型定义
│   │   ├── utils/          # 工具函数
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置
│   │   ├── database/       # 数据库
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   ├── utils/          # 工具函数
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 快速开始

### 前置要求
- Node.js >= 16
- npm 或 yarn

### 安装与运行

#### 1. 启动后端服务

```bash
cd server
npm install
npm run dev
```

后端服务将运行在 http://localhost:3001

#### 2. 启动前端开发服务器

```bash
cd client
npm install
npm run dev
```

前端服务将运行在 http://localhost:5173

### 构建生产版本

#### 前端构建

```bash
cd client
npm run build
```

构建产物将输出到 `client/dist` 目录。

#### 后端构建

```bash
cd server
npm run build
npm start
```

## API 接口文档

### 认证接口

#### POST /api/auth/register - 用户注册
请求体：
```json
{
  "email": "user@example.com",
  "password": "123456",
  "name": "用户名"
}
```

响应：
```json
{
  "message": "注册成功",
  "token": "jwt_token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "用户名"
  }
}
```

#### POST /api/auth/login - 用户登录
请求体：
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

#### GET /api/auth/me - 获取当前用户信息
需要 Bearer Token 认证

#### PUT /api/auth/me - 更新用户信息
需要 Bearer Token 认证

### 内容管理接口

#### GET /api/contents - 获取内容列表
需要 Bearer Token 认证

#### GET /api/contents/:id - 获取内容详情
需要 Bearer Token 认证

#### POST /api/contents - 创建内容
需要 Bearer Token 认证
请求体：
```json
{
  "title": "内容标题",
  "content": "内容正文"
}
```

#### PUT /api/contents/:id - 更新内容
需要 Bearer Token 认证

#### DELETE /api/contents/:id - 删除内容
需要 Bearer Token 认证

### 错误记录接口

#### GET /api/errors - 获取错误记录列表
需要 Bearer Token 认证
查询参数：
- contentId: 按内容筛选
- sortBy: 排序字段 (error_count / last_error_at / first_error_at)
- order: 排序方式 (asc / desc)
- limit / offset: 分页

#### POST /api/errors/batch - 批量提交错误记录
需要 Bearer Token 认证
请求体：
```json
{
  "contentId": 1,
  "errors": [
    { "wrongText": "错误内容", "correctText": "正确内容" }
  ]
}
```

#### DELETE /api/errors/:id - 删除错误记录
需要 Bearer Token 认证

#### GET /api/errors/stats/summary - 获取错误统计
需要 Bearer Token 认证

### 学习记录接口

#### POST /api/study - 记录学习
需要 Bearer Token 认证

#### GET /api/study/stats - 获取学习统计
需要 Bearer Token 认证

## 核心算法说明

### 1. 文本分割算法
- 按中英文句子结束符（。！？.!?）分割句子
- 按双换行符分割段落

### 2. 智能挖空算法
- 默认每隔 2 句挖空 1 句（保留 2 句，挖空 1 句循环）
- 剩余不足 3 句时，随机决定最后一句是否挖空
- 支持"重新挖空"功能，每次生成不同的挖空位置

### 3. 文本比对算法
- 使用 LCS（最长公共子序列）算法逐字比对
- 识别三种错误类型：
  - 遗漏（missing）：用户答案中缺少的文字
  - 多余（extra）：用户答案中多出来的文字
  - 错误（wrong）：文字写错的位置
- 合并连续相同类型的错误，提高可读性

### 4. 错误记录管理
- 相同"错误→正确"对自动合并，错误次数累加
- 更新最近错误时间
- 支持按错误次数排序，优先展示高频错误

## 数据库 Schema

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| email | TEXT | 邮箱，唯一 |
| password | TEXT | 加密后的密码 |
| name | TEXT | 昵称 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### contents 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID，外键 |
| title | TEXT | 内容标题 |
| content | TEXT | 内容正文 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### error_records 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID，外键 |
| content_id | INTEGER | 内容ID，外键 |
| wrong_text | TEXT | 错误内容 |
| correct_text | TEXT | 正确内容 |
| error_count | INTEGER | 错误次数 |
| first_error_at | DATETIME | 首次错误时间 |
| last_error_at | DATETIME | 最近错误时间 |

### study_records 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID，外键 |
| content_id | INTEGER | 内容ID，外键 |
| mode | TEXT | 练习模式 (free/blank) |
| correct_rate | REAL | 正确率 |
| created_at | DATETIME | 创建时间 |

## 本地存储降级方案

未登录用户的数据存储在浏览器 localStorage 中：
- `recitation_contents`: 内容列表
- `recitation_errors`: 错误记录

登录后数据可同步到云端（需自行实现数据迁移功能）。

## 许可证

MIT
