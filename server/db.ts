import mysql, { PoolOptions, RowDataPacket } from 'mysql2/promise';
import { env } from './env';

const baseOptions: PoolOptions = env.databaseUrl
  ? {
      uri: env.databaseUrl,
    }
  : {
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName,
    };

export const db = mysql.createPool({
  ...baseOptions,
  connectionLimit: 10,
  waitForConnections: true,
});

export async function query<T extends RowDataPacket[] | RowDataPacket[][] | mysql.ResultSetHeader>(
  sql: string,
  params: Array<string | number | boolean | null> = [],
): Promise<T> {
  const [rows] = await db.execute(sql, params);
  return rows as T;
}
