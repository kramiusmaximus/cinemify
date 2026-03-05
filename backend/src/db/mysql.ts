import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function getDbConfigFromEnv(): DbConfig {
  return {
    host: process.env.MYSQL_HOST ?? "mysql",
    port: Number(process.env.MYSQL_PORT ?? "3306"),
    user: process.env.MYSQL_USER ?? "cinemify",
    password: process.env.MYSQL_PASSWORD ?? "cinemify_password",
    database: process.env.MYSQL_DATABASE ?? "cinemify",
  };
}

export function createDbPool(config: DbConfig): Pool {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export async function queryRows<T extends RowDataPacket>(
  pool: Pool,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = await pool.query<T[]>(sql, params);
  return rows;
}
