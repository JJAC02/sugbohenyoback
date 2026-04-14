// server.js
const express = require('express');
//  
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;



const app = express();
app.use(express.json());
//created by JP - to be studied
app.post('/api/createUser', async (req, res) => {
  const {email, pass, fname, lname } = req.body;
  console.log('ran create');
  const passHash = await bcrypt.hash(pass, 10);
  try{
    const [rows] = await pool.execute(
      `INSERT INTO users (email, first_name, last_name, password_hash) VALUES (?, ?, ?, ?)`,
      [email, fname, lname, passHash ]
    );
    console.log('sumakses'
    );
    return res.json({goods: 1});
  } catch (err){
    console.log(err);
    return res.json({error: err.message, goods: 0});
  } finally{

  }
});



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
// app.post('/users', async (req, res) => {
//   const { email, first_name, last_name } = req.body;
//   try {
//     const [result] = await pool.execute(
//       'INSERT INTO users (email, first_name, last_name) VALUES (?, ?, ?)',
//       [email, first_name, last_name]
//     );
//     res.status(201).json({ id: result.insertId });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

app.use(express.static('images'));

app.get('/api/getImage/:id/:wid',async (req,res) => {
  try {
    const id = req.params.id;
    const wid = req.params.wid;
    console.log('ids are set')
    const [rows] = await pool.execute(
    'SELECT picture_url FROM images WHERE image_id =? AND word_id = ?', [id, wid]
  );
  
    if (rows.length === 0) {
    return res.status(404).json({ message: "Image not found" });
  }
    res.json({
      image: rows[0].picture_url
    });

    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));