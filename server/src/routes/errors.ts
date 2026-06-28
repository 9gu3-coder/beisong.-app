import { Router, Request, Response } from 'express';
import { db } from '../database';
import { authMiddleware, JwtPayload } from '../middleware/auth';

const router = Router();

// 获取错误记录列表
router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    const { contentId, sortBy = 'error_count', order = 'desc', limit, offset } = req.query;

    let query = `
      SELECT er.*, c.title as content_title 
      FROM error_records er
      LEFT JOIN contents c ON er.content_id = c.id
      WHERE er.user_id = ?
    `;
    const params: any[] = [user.userId];

    if (contentId) {
      query += ' AND er.content_id = ?';
      params.push(parseInt(contentId as string, 10));
    }

    // 排序
    const validSortFields = ['error_count', 'last_error_at', 'first_error_at'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'error_count';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY er.${sortField} ${sortOrder}`;

    // 分页
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit as string, 10));
    }
    if (offset) {
      query += ' OFFSET ?';
      params.push(parseInt(offset as string, 10));
    }

    const records = db.prepare(query).all(...params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM error_records WHERE user_id = ?';
    const countParams: any[] = [user.userId];
    if (contentId) {
      countQuery += ' AND content_id = ?';
      countParams.push(parseInt(contentId as string, 10));
    }
    const { total } = db.prepare(countQuery).get(...countParams) as any;

    res.json({ records, total });
  } catch (error) {
    console.error('获取错误记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 批量提交错误记录
router.post('/batch', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    const { contentId, errors } = req.body;

    if (!contentId || !errors || !Array.isArray(errors) || errors.length === 0) {
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

    const insertStmt = db.prepare(`
      INSERT INTO error_records 
        (user_id, content_id, wrong_text, correct_text, error_type, error_count, first_error_at, last_error_at)
      VALUES (?, ?, ?, ?, COALESCE(?, 'wrong'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, content_id, wrong_text, correct_text) 
      DO UPDATE SET 
        error_count = error_count + 1,
        last_error_at = CURRENT_TIMESTAMP
    `);

    const transaction = db.transaction((errorList: any[]) => {
      for (const error of errorList) {
        if (error.wrongText && error.correctText) {
          insertStmt.run(user.userId, contentId, error.wrongText, error.correctText, error.category || 'wrong');
        }
      }
    });

    transaction(errors);

    res.json({ message: '错误记录已保存' });
  } catch (error) {
    console.error('提交错误记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除单条错误记录
router.delete('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    const recordId = parseInt(req.params.id, 10);

    const record = db.prepare(
      'SELECT id FROM error_records WHERE id = ? AND user_id = ?'
    ).get(recordId, user.userId);

    if (!record) {
      res.status(404).json({ error: '错误记录不存在' });
      return;
    }

    db.prepare('DELETE FROM error_records WHERE id = ?').run(recordId);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除错误记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取学习统计
router.get('/stats/summary', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;

    // 总错误数
    const totalErrorsResult = db.prepare(
      'SELECT COALESCE(SUM(error_count), 0) as total_errors FROM error_records WHERE user_id = ?'
    ).get(user.userId) as any;

    // 高频错误数（错误次数>=3）
    const frequentErrorsResult = db.prepare(
      'SELECT COUNT(*) as frequent_errors FROM error_records WHERE user_id = ? AND error_count >= 3'
    ).get(user.userId) as any;

    // 最近7天的错误趋势
    const weeklyTrend = db.prepare(`
      SELECT 
        DATE(last_error_at) as date,
        SUM(error_count) as errors
      FROM error_records 
      WHERE user_id = ? AND last_error_at >= date('now', '-7 days')
      GROUP BY DATE(last_error_at)
      ORDER BY date ASC
    `).all(user.userId);

    res.json({
      totalErrors: totalErrorsResult.total_errors,
      frequentErrors: frequentErrorsResult.frequent_errors,
      weeklyTrend
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
