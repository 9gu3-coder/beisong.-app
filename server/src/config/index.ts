// 应用配置
export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'recitation_app_secret_key_2024',
  jwtExpiresIn: '7d',
  dbPath: process.env.DB_PATH || './data/database.db'
};
