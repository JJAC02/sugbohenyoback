// server.js
const express = require('express');
const pool = require('./db');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public')); // serves public folder

// Serve main.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by id
app.get('/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user
app.post('/users', async (req, res) => {
  const { email, first_name, last_name } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (email, first_name, last_name) VALUES (?, ?, ?)',
      [email, first_name, last_name]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));