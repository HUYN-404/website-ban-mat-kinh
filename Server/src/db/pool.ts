import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

console.log('[DB] connecting with database =', process.env.DB_NAME)

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT ?? 10),
})

export default pool
