import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.VITE_MYSQL_HOST,
  user: process.env.VITE_MYSQL_USER,
  password: process.env.VITE_MYSQL_PASSWORD,
  database: process.env.VITE_MYSQL_DATABASE,
  port: parseInt(process.env.VITE_MYSQL_PORT || '3306'),
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initializeDatabase = async () => {
  try {
    await pool.execute(`
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

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS form_schemas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        schema JSON NOT NULL,
        version BIGINT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

app.get('/api/responses', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM employee_responses ORDER BY timestamp DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

app.post('/api/responses', async (req, res) => {
  try {
    const { name, employeeId, email, selectedSkills, skillRatings, additionalSkills } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO employee_responses
       (name, employee_id, email, selected_skills, skill_ratings, additional_skills, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        employeeId,
        email,
        JSON.stringify(selectedSkills),
        JSON.stringify(skillRatings),
        additionalSkills
      ]
    );

    res.json({ id: result.insertId, message: 'Response created successfully' });
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).json({ error: 'Failed to create response' });
  }
});

app.put('/api/responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, employeeId, email, selectedSkills, skillRatings, additionalSkills } = req.body;

    await pool.execute(
      `UPDATE employee_responses
       SET name = ?, employee_id = ?, email = ?,
           selected_skills = ?, skill_ratings = ?, additional_skills = ?
       WHERE id = ?`,
      [
        name,
        employeeId,
        email,
        JSON.stringify(selectedSkills),
        JSON.stringify(skillRatings),
        additionalSkills,
        id
      ]
    );

    res.json({ message: 'Response updated successfully' });
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

app.delete('/api/responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM employee_responses WHERE id = ?', [id]);
    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

app.get('/api/schemas', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM form_schemas ORDER BY id DESC LIMIT 1'
    );
    res.json(rows[0] || null);
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({ error: 'Failed to fetch schema' });
  }
});

app.post('/api/schemas', async (req, res) => {
  try {
    const { schema } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO form_schemas (schema, version) VALUES (?, ?)',
      [JSON.stringify(schema), Date.now()]
    );
    res.json({ id: result.insertId, message: 'Schema created successfully' });
  } catch (error) {
    console.error('Error creating schema:', error);
    res.status(500).json({ error: 'Failed to create schema' });
  }
});

app.put('/api/schemas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { schema } = req.body;
    await pool.execute(
      'UPDATE form_schemas SET schema = ?, version = ? WHERE id = ?',
      [JSON.stringify(schema), Date.now(), id]
    );
    res.json({ message: 'Schema updated successfully' });
  } catch (error) {
    console.error('Error updating schema:', error);
    res.status(500).json({ error: 'Failed to update schema' });
  }
});

app.listen(port, async () => {
  await initializeDatabase();
  console.log(`Backend API server running on http://localhost:${port}`);
});
