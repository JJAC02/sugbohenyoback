// server.js
const express = require('express');
//  
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const Groq = require('groq-sdk');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;

//Session Store
const sessionStore = new MySQLStore(
  {
    // optional settings
    createDatabaseTable: true
  },
  pool
);


//Middleware
const app = express();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

app.use(express.json());

app.use(session({
  name: 'sb.sid',
  secret: process.env.SS,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // change to true when using HTTPS
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

function requireLogin(req, res, next) {
  if (!req.session || !req.session.uid) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  next();
}

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

//testing for API of AI
app.post('/promptItinerary', async (req, res) => {
  console.log("ran prompt");
  
  const userInput = req.body.message;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a travel advisor/planner."
      },
      {
        role: "user",
        content: userInput
      }
    ]
  });

  res.json({
    reply: response.choices[0].message.content
  })
});

app.get('/testing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'testing.html'));
});

//end of AI test

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

app.post('/api/loginUser', async (req, res) => {
  try {
    const { uname, pass } = req.body;

    if (!uname || !pass) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }

    const [rows] = await pool.execute(
      `SELECT user_id, username, password_hash
       FROM users
       WHERE username = ?`,
      [uname]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(
      pass,
      user.password_hash.toString()
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // regenerate session for security
    req.session.regenerate(err => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Session error'
        });
      }

      req.session.uid = user.user_id;

      return res.json({
        success: true,
        message: 'Login successful',
        user: user.username
      });
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.get('/api/me', requireLogin, (req, res) => {
  res.json({
    success: true,
    uid: req.session.uid,
    username: req.session.username
  });
});

app.get('/api/dashboard', requireLogin, (req, res) => {
  res.json({
    success: true,
    message: `Welcome ${req.session.username}`
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }

    res.clearCookie('sb.sid'); // or your custom cookie name

    return res.json({
      success: true,
      message: 'Logged out'
    });
  });
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