import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDatabase } from './database';
import authRoutes from './routes/auth';
import contentRoutes from './routes/contents';
import errorRoutes from './routes/errors';
import studyRoutes from './routes/study';

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/study', studyRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 全局错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('未处理的错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 初始化数据库并启动服务器
initDatabase();

app.listen(config.port, () => {
  console.log(`服务器运行在 http://localhost:${config.port}`);
  console.log(`API文档: http://localhost:${config.port}/api/health`);
});

export default app;
