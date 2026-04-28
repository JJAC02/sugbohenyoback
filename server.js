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


app.use(express.static('public', {
  setHeaders: (res, filePath) => {
    // Fix MIME types for JavaScript files
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

app.use('/phaser', express.static(path.join(__dirname, 'node_modules/phaser/dist')));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

//Telling the database to create the user
app.post('/api/createUser', async (req, res) => {
  const {email, pass, fname, lname, uname, points } = req.body;
  console.log('ran create');
  const passHash = await bcrypt.hash(pass, 10);
  try{
    const [rows] = await pool.execute(
      `INSERT INTO users (email, first_name, last_name, username, password_hash,user_points) VALUES (?, ?, ?, ?, ?, ?)`,
      [email, fname, lname, uname, passHash, points]
    );
    console.log('success'
    );
    return res.json({goods: 1});
  } catch (err){
    console.log(err);
    return res.json({error: err.message, goods: 0});
  } finally{

  }
});

// app.post ('/api/createUser', async (req,res) => {
//   const {newUser} = req.body;
//   const passHash = await bcrypt.hash(pass, 10);

app.post('/api/loginUser',async (req, res) => {
  try {
    const {pass, uname } = req.body;
  console.log('ran login', uname);
  
  const [rows] = await pool.execute(
    'SELECT username,password_hash FROM users WHERE username = ?', [uname]
  );

  console.log('found rows: ',rows.length);
  if (rows.length === 0) {
  console.log("User not found");
  return res.status(404).json({message: "User not found"});
  }
  const user = rows[0];

  console.log({
  pass,
  passType: typeof pass,
  hash: user.password_hash,
  hashType: typeof user.password_hash
});

// if (!pass || typeof pass !== 'string') {
//   return res.status(400).json({ message: "Invalid password input" });
// }

// if (!user.password_hash || typeof user.password_hash !== 'string') {
//   console.error('Invalid hash in DB:', user.password_hash);
//   return res.status(500).json({ message: "Corrupted user data" });
// }

  const hash = user.password_hash.toString();

  const isMatch = await bcrypt.compare(pass,hash);
  if (isMatch) {
      return res.json({ success: true, user: user.username });
    } else {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

  } catch(err) {
    console.error('LOGIN ERROR',err);
    return res.status(500).json({ message: "Server error" });
  }
})


// })
//serve main at root
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'main.html'));
// });



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


app.get('/api/getImage/:id/:wid',async (req,res) => {
  try {
    const id = req.params.id;
    const wid = req.params.wid;
    console.log('ids are set', id, wid);
    const [rows] = await pool.execute(
    'SELECT picture_url FROM images WHERE image_id =? AND word_id = ?', [id, wid]
  );
    console.log(rows[0].picture_url);
  
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'external-repo', 'landing.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'external-repo', 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'external-repo', 'login.html'));
});

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'external-repo', 'index.html'));
});

app.get('/streetview', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'external-repo', 'streetview.html'));
});

app.get('/adventure', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'external-repo', 'adventure.html'));
});

app.get('/ag1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'external-repo', 'game', 'level1.html'));
});


//  Moved up
// app.use((req, res, next) => {
//   console.log(req.method, req.url);
//   next();
// });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));