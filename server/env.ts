function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || '';

export const env = {
  port: Number(process.env.PORT || 8787),
  databaseUrl,
  dbHost: databaseUrl ? '' : required('DB_HOST'),
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: databaseUrl ? '' : required('DB_USER'),
  dbPassword: databaseUrl ? '' : required('DB_PASSWORD'),
  dbName: databaseUrl ? '' : required('DB_NAME'),
  redisUrl: required('REDIS_URL'),
  siliconflowApiKey: required('SILICONFLOW_API_KEY'),
  siliconflowModel: process.env.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-V3',
  fallbackOpenAiApiKey: process.env.FALLBACK_OPENAI_API_KEY || '',
  fallbackOpenAiModel: process.env.FALLBACK_OPENAI_MODEL || 'gpt-3.5-turbo',
};
