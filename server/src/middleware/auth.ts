import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// JWT载荷接口
export interface JwtPayload {
  userId: number;
  email: string;
}

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// 认证中间件
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: '未提供认证令牌' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '认证令牌无效或已过期' });
  }
}

// 生成JWT令牌
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as any
  );
}
