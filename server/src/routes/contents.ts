import { Router, Request, Response } from 'express';
import { db } from '../database';
import { authMiddleware, JwtPayload } from '../middleware/auth';

const router = Router();

// 获取内容列表
router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    
    const contents = db.prepare(
      'SELECT id, title, created_at, updated_at FROM contents WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(user.userId);

    res.json({ contents });
  } catch (error) {
    console.error('获取内容列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取单条内容详情
router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    const contentId = parseInt(req.params.id, 10);

    const content = db.prepare(
      'SELECT * FROM contents WHERE id = ? AND user_id = ?'
    ).get(contentId, user.userId);

    if (!content) {
      res.status(404).json({ error: '内容不存在' });
      return;
    }

    res.json({ content });
  } catch (error) {
    console.error('获取内容详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建内容
router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: '标题和内容不能为空' });
      return;
    }

    if (title.length > 200) {
      res.status(400).json({ error: '标题长度不能超过200字' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO contents (user_id, title, content) VALUES (?, ?, ?)'
    ).run(user.userId, title, content);

    const contentId = result.lastInsertRowid as number;

    const newContent = db.prepare(
      'SELECT * FROM contents WHERE id = ?'
    ).get(contentId);

    res.status(201).json({ message: '创建成功', content: newContent });
  } catch (error) {
    console.error('创建内容错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新内容
router.put('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    const contentId = parseInt(req.params.id, 10);
    const { title, content } = req.body;

    // 检查内容是否存在且属于当前用户
    const existingContent = db.prepare(
      'SELECT id FROM contents WHERE id = ? AND user_id = ?'
    ).get(contentId, user.userId);

    if (!existingContent) {
      res.status(404).json({ error: '内容不存在' });
      return;
    }

    if (!title && !content) {
      res.status(400).json({ error: '至少提供一项需要更新的内容' });
      return;
    }

    let query = 'UPDATE contents SET ';
    const params: any[] = [];

    if (title) {
      if (title.length > 200) {
        res.status(400).json({ error: '标题长度不能超过200字' });
        return;
      }
      query += 'title = ?, ';
      params.push(title);
    }

    if (content) {
      query += 'content = ?, ';
      params.push(content);
    }

    query += 'updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    params.push(contentId);

    db.prepare(query).run(...params);

    const updatedContent = db.prepare(
      'SELECT * FROM contents WHERE id = ?'
    ).get(contentId);

    res.json({ message: '更新成功', content: updatedContent });
  } catch (error) {
    console.error('更新内容错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除内容
router.delete('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    const contentId = parseInt(req.params.id, 10);

    // 检查内容是否存在且属于当前用户
    const existingContent = db.prepare(
      'SELECT id FROM contents WHERE id = ? AND user_id = ?'
    ).get(contentId, user.userId);

    if (!existingContent) {
      res.status(404).json({ error: '内容不存在' });
      return;
    }

    db.prepare('DELETE FROM contents WHERE id = ?').run(contentId);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除内容错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
