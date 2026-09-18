import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'devpulse_super_secret_jwt_key_2026',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/devpulse?schema=public',
};
