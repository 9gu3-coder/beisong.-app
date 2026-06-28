import { Router, Request, Response } from 'express';
import { db } from '../database';
import { authMiddleware, JwtPayload } from '../middleware/auth';

const router = Router();

// 记录学习记录
router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    const { contentId, mode, correctRate } = req.body;

    if (!contentId || !mode) {
      res.status(400).json({ error: '参数不完整' });
      return;
    }

    // 检查内容是否属于当前用户
    const content = db.prepare(
      'SELECT id FROM contents WHERE id = ? AND user_id = ?'
    ).get(contentId, user.userId);

    if (!content) {
      res.status(404).json({ error: '内容不存在' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO study_records (user_id, content_id, mode, correct_rate) VALUES (?, ?, ?, ?)'
    ).run(user.userId, contentId, mode, correctRate || 0);

    res.status(201).json({ 
      message: '学习记录已保存',
      recordId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('记录学习记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取学习进度统计
router.get('/stats', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;

    // 总学习次数
    const totalStudiesResult = db.prepare(
      'SELECT COUNT(*) as total_studies FROM study_records WHERE user_id = ?'
    ).get(user.userId) as any;

    // 平均正确率
    const avgRateResult = db.prepare(
      'SELECT COALESCE(AVG(correct_rate), 0) as avg_rate FROM study_records WHERE user_id = ?'
    ).get(user.userId) as any;

    // 最近7天学习次数
    const weeklyStudiesResult = db.prepare(`
      SELECT COUNT(*) as weekly_studies 
      FROM study_records 
      WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
    `).get(user.userId) as any;

    // 最近30天正确率趋势
    const accuracyTrend = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        AVG(correct_rate) as avg_correct_rate
      FROM study_records 
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(user.userId);

    res.json({
      totalStudies: totalStudiesResult.total_studies,
      averageCorrectRate: avgRateResult.avg_rate,
      weeklyStudies: weeklyStudiesResult.weekly_studies,
      accuracyTrend
    });
  } catch (error) {
    console.error('获取学习统计错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
