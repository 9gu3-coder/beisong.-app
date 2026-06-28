import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database';
import { generateToken, authMiddleware, JwtPayload } from '../middleware/auth';

const router = Router();

// 用户注册
router.post('/register', (req: Request, res: Response): void => {
  try {
    const { email, password, name } = req.body;

    // 输入验证
    if (!email || !password || !name) {
      res.status(400).json({ error: '邮箱、密码和昵称不能为空' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: '密码长度不能少于6位' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: '邮箱格式不正确' });
      return;
    }

    // 检查邮箱是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      res.status(409).json({ error: '该邮箱已被注册' });
      return;
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 创建用户
    const result = db.prepare(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
    ).run(email, hashedPassword, name);

    const userId = result.lastInsertRowid as number;

    // 生成令牌
    const token = generateToken({ userId, email });

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: userId, email, name }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户登录
router.post('/login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: '邮箱和密码不能为空' });
      return;
    }

    // 查找用户
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    // 验证密码
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    // 生成令牌
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    
    const userInfo = db.prepare(
      'SELECT id, email, name, created_at FROM users WHERE id = ?'
    ).get(user.userId);

    if (!userInfo) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.json({ user: userInfo });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新用户信息
router.put('/me', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = req.user as JwtPayload;
    const { name, password } = req.body;

    if (!name && !password) {
      res.status(400).json({ error: '至少提供一项需要更新的信息' });
      return;
    }

    let query = 'UPDATE users SET ';
    const params: any[] = [];

    if (name) {
      query += 'name = ?, ';
      params.push(name);
    }

    if (password) {
      if (password.length < 6) {
        res.status(400).json({ error: '密码长度不能少于6位' });
        return;
      }
      query += 'password = ?, ';
      params.push(bcrypt.hashSync(password, 10));
    }

    query += 'updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    params.push(user.userId);

    db.prepare(query).run(...params);

    // 获取更新后的用户信息
    const updatedUser = db.prepare(
      'SELECT id, email, name, created_at FROM users WHERE id = ?'
    ).get(user.userId);

    res.json({ message: '更新成功', user: updatedUser });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
