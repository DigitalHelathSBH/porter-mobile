import "server-only";
import sql from "mssql";

const sqlConfig: sql.config = {
  server: process.env.DB_SERVER ?? "",
  database: process.env.DB_DATABASE ?? "",
  user: process.env.DB_USER ?? "",
  password: process.env.DB_PASSWORD ?? "",
  port: Number(process.env.DB_PORT ?? 1433),

  options: {
    encrypt: false,
    trustServerCertificate: true,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30_000,
  },

  connectionTimeout: 30_000,
  requestTimeout: 60_000,
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getDb(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(sqlConfig);

    poolPromise = pool.connect().catch((error) => {
      // เชื่อมไม่สำเร็จ ให้ล้างค่า เพื่อให้ลองเชื่อมใหม่ได้
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
}