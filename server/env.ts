function optional(name: string): string {
  return process.env[name] || '';
}

const databaseUrl = optional('DATABASE_URL') || optional('MYSQL_URL');

export const env = {
  port: Number(process.env.PORT || 8787),
  databaseUrl,
  dbHost: databaseUrl ? '' : optional('DB_HOST') || optional('MYSQLHOST') || '127.0.0.1',
  dbPort: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  dbUser: databaseUrl ? '' : optional('DB_USER') || optional('MYSQLUSER') || 'root',
  dbPassword: databaseUrl ? '' : optional('DB_PASSWORD') || optional('MYSQLPASSWORD') || '',
  dbName: databaseUrl ? '' : optional('DB_NAME') || optional('MYSQLDATABASE') || 'chunfeng',
  redisUrl: optional('REDIS_URL'),
  siliconflowApiKey: optional('SILICONFLOW_API_KEY'),
  siliconflowModel: optional('SILICONFLOW_MODEL') || 'deepseek-ai/DeepSeek-V3',
  openaiApiKey: optional('OPENAI_API_KEY') || optional('FALLBACK_OPENAI_API_KEY'),
  openaiModel: optional('OPENAI_MODEL') || optional('FALLBACK_OPENAI_MODEL') || 'gpt-4o-mini',
  jwtSecret: optional('JWT_SECRET') || 'dev-jwt-secret-change-me',
  adminUsername: optional('ADMIN_USERNAME') || 'admin',
  adminPassword: optional('ADMIN_PASSWORD') || 'chunfeng_admin_2026',
};
