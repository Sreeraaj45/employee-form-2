import mysql from 'mysql2/promise';

const connectionConfig = {
  host: import.meta.env.VITE_MYSQL_HOST,
  user: import.meta.env.VITE_MYSQL_USER,
  password: import.meta.env.VITE_MYSQL_PASSWORD,
  database: import.meta.env.VITE_MYSQL_DATABASE,
  port: parseInt(import.meta.env.VITE_MYSQL_PORT || '3306'),
  ssl: {
    rejectUnauthorized: true
  }
};

let pool: mysql.Pool;

export const getConnection = async () => {
  if (!pool) {
    pool = mysql.createPool(connectionConfig);
  }
  return pool;
};

export const query = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
  const connection = await getConnection();
  const [rows] = await connection.execute(sql, params);
  return rows as T[];
};

export const initializeDatabase = async () => {
  const connection = await getConnection();

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS employee_responses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      employee_id VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      selected_skills JSON,
      skill_ratings JSON,
      additional_skills TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_employee_id (employee_id),
      INDEX idx_timestamp (timestamp)
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS form_schemas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      schema JSON NOT NULL,
      version BIGINT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};
