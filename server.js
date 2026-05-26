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

//Database connection
pool.getConnection()
  .then(conn => {
    console.log('✓ Database connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
  });

// module.exports = pool;

//Session Store
const sessionStore = new MySQLStore(
  {
    // optional settings
    createDatabaseTable: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
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

function validateScore(score) {
  // Check if score is a valid number
  if (isNaN(score) || !isFinite(score)) {
    return false;
  }
  
  // Check if score is within reasonable bounds (adjust as needed)
  // Prevents negative scores and unreasonably high scores
  if (score < 0 || score > 5000) {
    return false;
  }
  
  return true;
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
  try {
    console.log("generating itinerary prompt");
  
  const userInput = req.body.message;

  if (!userInput || userInput.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a travel advisor/planner. create it using html tags"
      },
      {
        role: "user",
        content: userInput
      }
    ]
  });

  res.json({
      success: true,
      reply: response.choices[0].message.content
    });
  } catch (error) {
    console.error('Itinerary generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate itinerary'
    });
  }
  
});

app.post('/funfact', async (req, res) => {
  try {
    console.log("Generating fun fact");
 
    const { topic } = req.body;
 
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        title: "Fun Fact",
        fact: "Please provide a topic."
      });
    }
 
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You generate short educational travel fun facts for games about Cebu, Philippines.
 
Return ONLY valid JSON with NO markdown, NO code blocks, NO explanations.
 
Format:
{
  "title": "short place or topic name",
  "fact": "short engaging fun fact"
}
 
Rules:
- Only 1 specific fun fact
- Fact must be under 30 words
- Make it fun and easy to understand
- Focus on Cebuano culture, history, or geography
- No markdown, no HTML, no extra text`
        },
        {
          role: "user",
          content: topic
        }
      ]
    });
 
    // Parse AI response
    const aiReply = response.choices[0].message.content.trim();
    const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }
 
    const factData = JSON.parse(jsonMatch[0]);
 
    res.json({
      success: true,
      ...factData
    });
 
  } catch (error) {
    console.error('Fun fact error:', error);
    res.status(500).json({
      success: false,
      title: "Fun Fact",
      fact: "Unable to generate fun fact at this time."
    });
  }
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
  try {
    const { email, pass, fname, lname, uname } = req.body;

    console.log('Creating user account');
    const passHash = await bcrypt.hash(pass, 10);
 
    const [result] = await pool.execute(
      `INSERT INTO users (email, first_name, last_name, username, password_hash, user_points) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, fname, lname, uname, passHash, 0]
    );
 
    console.log('User created successfully:', result.insertId);
    
    //auto-login
    req.session.regenerate(err => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.json({
          success: true,
          message: 'Account created successfully',
          goods: 1
        });
      }
 
      req.session.uid = result.insertId;
      req.session.username = uname;
 
      return res.json({
        success: true,
        message: 'Account created successfully',
        goods: 1,
        userId: result.insertId
      });
    });
  } catch (err) {
    console.error('Create user error:', err);
 
    // Handle duplicate entry errors
    if (err.code === 'ER_DUP_ENTRY') {
      const field = err.message.includes('email') ? 'email' : 'username';
      return res.status(409).json({
        success: false,
        message: `This ${field} is already taken`,
        goods: 0
      });
    }
 
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      goods: 0
    });

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
        console.error('Session regeneration error:', err);
        return res.status(500).json({
          success: false,
          message: 'Session error'
        });
      }
 
      req.session.uid = user.user_id;
      req.session.username = user.username;
 
      console.log('Login successful for user:', user.username);
 
      return res.json({
        success: true,
        message: 'Login successful',
        user: user.username
      });
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
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
  const username = req.session.username;
  
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    
    console.log('Session destroyed for user:', username);
 
    res.clearCookie('sb.sid', { 
      path: '/',
      domain: 'dcism.org'
    });
 
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

//Storing of User Points
app.post('/api/storePoints/:id/:score', requireLogin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const score = parseInt(req.params.score, 10);
 
    // Verify user is updating their own points
    if (req.session.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot update another user\'s points'
      });
    }
 
    // Validate score
    if (!validateScore(score)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid score value'
      });
    }
 
    const [result] = await pool.execute(
      'UPDATE users SET user_points = user_points + ? WHERE user_id = ?',
      [score, userId]
    );
 
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
 
    console.log(`Points updated for user ${userId}: +${score}`);
 
    res.json({
      success: true,
      message: 'Points updated successfully',
      pointsAdded: score
    });
 
  } catch (err) {
    console.error('Store points error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


//relic related apis
app.get('/api/getRelic/:uid', requireLogin, async (req, res) => {
  try {
    const userId = parseInt(req.params.uid, 10);
 
    const [rows] = await pool.execute(
      `SELECT ui.relic_id, ui.user_id, r.relic_name, r.region_id 
       FROM user_inventory ui
       JOIN relics r ON ui.relic_id = r.relic_id
       WHERE ui.user_id = ?`,
      [userId]
    );
 
    console.log(`Retrieved ${rows.length} relics for user ${userId}`);
 
    res.json({
      success: true,
      message: 'Relics retrieved successfully',
      data: rows
    });
 
  } catch (err) {
    console.error('Get relic error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
 
app.post('/api/obtainRelic/:uid/:rid', requireLogin, async (req, res) => {
  try {
    const userId = parseInt(req.params.uid, 10);
    const relicId = parseInt(req.params.rid, 10);
 
    // Verify user is adding to their own inventory
    if (req.session.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }
 
    // Check if relic exists
    const [relicCheck] = await pool.execute(
      'SELECT relic_id FROM relics WHERE relic_id = ?',
      [relicId]
    );
 
    if (relicCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Relic not found'
      });
    }
 
    // Insert relic (will fail if duplicate due to PRIMARY KEY constraint)
    const [result] = await pool.execute(
      'INSERT INTO user_inventory (relic_id, user_id) VALUES (?, ?)',
      [relicId, userId]
    );
 
    console.log(`Relic ${relicId} obtained by user ${userId}`);
 
    res.json({
      success: true,
      message: 'Relic obtained successfully'
    });
 
  } catch (err) {
    console.error('Obtain relic error:', err);
 
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'You already have this relic'
      });
    }
 
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.get('/api/relicInfo/:uid', requireLogin, async (req, res) => {
  try {
    const userId = req.params.uid;

    // basic validation
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        (SELECT COUNT(*) FROM relics) AS total_relics,

        (
          SELECT COUNT(*)
          FROM user_inventory
          WHERE user_id = ?
        ) AS completed_relics
      `,
      [userId]
    );

    // extra safety check
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Relic information not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });

  } catch (err) {
    console.error('Error fetching relic info:', err);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
//relics end here


//badges start here
app.post('/api/obtainBadge/:uid/:bid', requireLogin, async (req, res) => {
  try {
    const userId = parseInt(req.params.uid, 10);
    const badgeId = parseInt(req.params.bid, 10);
 
    // Verify user is adding to their own badges
    if (req.session.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }
 
    // Check if badge exists
    const [badgeCheck] = await pool.execute(
      'SELECT badge_id FROM badges WHERE badge_id = ?',
      [badgeId]
    );
 
    if (badgeCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }
 
    // Insert badge
    const [result] = await pool.execute(
      'INSERT INTO badge_progress (badge_id, user_id) VALUES (?, ?)',
      [badgeId, userId]
    );
 
    console.log(`Badge ${badgeId} obtained by user ${userId}`);
 
    res.json({
      success: true,
      message: 'Badge obtained successfully'
    });
 
  } catch (err) {
    console.error('Obtain badge error:', err);
 
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'You already have this badge'
      });
    }
 
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


//quest
app.post('/api/questComplete/:uid/:qid', requireLogin, async (req, res) => {
  try {
    const userId = parseInt(req.params.uid, 10);
    const questId = parseInt(req.params.qid, 10);
 
    // Verify user is updating their own quests
    if (req.session.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }
 
    // Check if quest exists
    const [questCheck] = await pool.execute(
      'SELECT quest_id FROM quests WHERE quest_id = ?',
      [questId]
    );
 
    if (questCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }
 
    // Insert or update quest progress
    const [result] = await pool.execute(
      `INSERT INTO quest_progress (quest_id, user_id, is_complete) 
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE is_complete = 1`,
      [questId, userId]
    );
 
    console.log(`Quest ${questId} completed by user ${userId}`);
 
    res.json({
      success: true,
      message: 'Quest completed successfully'
    });
 
  } catch (err) {
    console.error('Quest complete error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


//locations
app.post('/api/locationExplore/:uid/:locname', requireLogin, async (req, res) => {
  try {
    const userId = parseInt(req.params.uid, 10);  // Keep as number (user ID)
    const locationName = req.params.locname;     // Keep as string
 
    // Verify user is updating their own locations
    if (req.session.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }
 
    // Check if location exists BY NAME instead of ID
    const [locationCheck] = await pool.execute(
      'SELECT loc_id FROM locations WHERE loc_name = ?',  // Changed to loc_name
      [locationName]
    );
 
    if (locationCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    // Get the actual loc_id from the result
    const locationId = locationCheck[0].loc_id;
 
    // Insert or update location progress
    const [result] = await pool.execute(
      `INSERT INTO location_progress (loc_id, user_id, is_exp) 
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE is_exp = 1`,
      [locationId, userId]
    );
 
    console.log(`Location "${locationName}" (ID: ${locationId}) explored by user ${userId}`);
 
    res.json({
      success: true,
      message: 'Location explored successfully'
    });
 
  } catch (err) {
    console.error('Location explore error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


//others
app.get('/api/getImage/:id/:wid', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id, 10);
    const wordId = parseInt(req.params.wid, 10);
 
    console.log('Fetching image:', imageId, wordId);
 
    const [rows] = await pool.execute(
      'SELECT picture_url FROM images WHERE image_id = ? AND word_id = ?',
      [imageId, wordId]
    );
 
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
 
    res.json({
      success: true,
      image: rows[0].picture_url
    });
 
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});



//Dashboard api
app.get('/api/dashboard_details/:uid', requireLogin, async (req, res) => {
  try {
    const userId = parseInt(req.params.uid, 10);
 
    // Single optimized query using JOINs and subqueries
    const [dashboardData] = await pool.execute(
      `SELECT 
        u.username,
        u.user_points,
        
        -- Completed counts
        (SELECT COUNT(DISTINCT quest_id) 
         FROM quest_progress 
         WHERE user_id = u.user_id AND is_complete = 1) as completed_quests,
        
        (SELECT COUNT(DISTINCT loc_id) 
         FROM location_progress 
         WHERE user_id = u.user_id AND is_exp = 1) as completed_locations,
        
        (SELECT COUNT(DISTINCT badge_id) 
         FROM badge_progress 
         WHERE user_id = u.user_id) as completed_badges,
        
        -- Total counts
        (SELECT COUNT(*) FROM quests) as total_quests,
        (SELECT COUNT(*) FROM locations) as total_locations,
        (SELECT COUNT(*) FROM badges) as total_badges,
        (SELECT COUNT(*) FROM relics) as total_relics,
        
        -- User relics count
        (SELECT COUNT(*) 
         FROM user_inventory 
         WHERE user_id = u.user_id) as completed_relics
        
       FROM users u
       WHERE u.user_id = ?`,
      [userId]
    );
 
    if (dashboardData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
 
    const data = dashboardData[0];
 
    // Get detailed badge information
    const [badges] = await pool.execute(
      `SELECT bp.badge_id, bp.user_id, b.badge_name, b.badge_des
       FROM badge_progress bp
       JOIN badges b ON bp.badge_id = b.badge_id
       WHERE bp.user_id = ?`,
      [userId]
    );
 
    // Get detailed relic information
    const [relics] = await pool.execute(
      `SELECT ui.relic_id, ui.user_id, r.relic_name, r.region_id
       FROM user_inventory ui
       JOIN relics r ON ui.relic_id = r.relic_id
       WHERE ui.user_id = ?`,
      [userId]
    );
 
    console.log(`Dashboard loaded for user ${userId}`);
 
    res.json({
      success: true,
      data: {
        username: data.username,
        userPoints: data.user_points,
        stats: {
          completedQuests: data.completed_quests,
          completedLocations: data.completed_locations,
          completedBadges: data.completed_badges,
          completedRelics: data.completed_relics
        },
        progress: {
          totalQuests: data.total_quests,
          totalLocations: data.total_locations,
          totalBadges: data.total_badges,
          totalRelics: data.total_relics
        },
        badges: badges,
        inventory: relics
      }
    });
 
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

//ITINERARIES
app.post('/api/saveItinerary/:uid/', requireLogin, async (req, res) => {
  try {
    const userId = parseInt(req.params.uid, 10);
    const { locationName, duration, itineraryPlan } = req.body;

    // Verify the user is accessing their own data
    if (req.session.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot save itinerary for another user'
      });
    }

    // Validate required fields
    if (!locationName || !duration || !itineraryPlan) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: locationName, duration, itineraryPlan'
      });
    }

    // Get location ID from locations table
    const [locationRows] = await pool.execute(
      'SELECT loc_id FROM locations WHERE loc_name = ?',
      [locationName]
    );

    if (locationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found in database'
      });
    }

    const locId = locationRows[0].loc_id;

    // Check for duplicate itinerary (same user, location, duration, and plan)
    const [duplicateCheck] = await pool.execute(
      `SELECT itinerary_id FROM user_itineraries 
       WHERE user_id = ? AND loc_id = ? AND itinerary_plan = ?`,
      [userId, locId, itineraryPlan]
    );

    if (duplicateCheck.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This itinerary is already saved'
      });
    }

    // Insert the itinerary
    const [result] = await pool.execute(
      `INSERT INTO user_itineraries (user_id, loc_id, itinerary_plan, duration) 
       VALUES (?, ?, ?, ?)`,
      [userId, locId, itineraryPlan, duration]
    );

    console.log(`Itinerary saved for user ${userId}, location: ${locationName}`);

    res.json({
      success: true,
      message: 'Itinerary saved successfully',
      itineraryId: result.insertId
    });

  } catch (err) {
    console.error('Save itinerary error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while saving itinerary'
    });
  }
});

app.post('/api/getItineraries/:uid/', requireLogin, async (req, res) => {
  try {
    const userId = parseInt(req.params.uid, 10);

    // Verify the user is accessing their own data
    if (req.session.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot access another user\'s itineraries'
      });
    }

    // Fetch all itineraries for this user with location details
    const [itineraries] = await pool.execute(
      `SELECT 
        ui.itinerary_id,
        ui.user_id,
        ui.loc_id,
        ui.itinerary_plan,
        ui.duration,
        ui.created_at,
        l.loc_name
       FROM user_itineraries ui
       JOIN locations l ON ui.loc_id = l.loc_id
       WHERE ui.user_id = ?
       ORDER BY ui.created_at DESC`,
      [userId]
    );

    console.log(`Fetched ${itineraries.length} itineraries for user ${userId}`);

    res.json({
      success: true,
      itineraries: itineraries.map(item => ({
        itineraryId: item.itinerary_id,
        name: item.loc_name,
        duration: item.duration || 'Custom',
        content: item.itinerary_plan,
        date: new Date(item.created_at).toLocaleDateString('en-PH', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        rawDate: item.created_at
      }))
    });

  } catch (err) {
    console.error('Get itineraries error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching itineraries'
    });
  }
});

app.delete('/api/deleteItinerary/:uid/:itineraryId', requireLogin, async (req, res) => {
  try {
    const userId = parseInt(req.params.uid, 10);
    const itineraryId = parseInt(req.params.itineraryId, 10);

    // Verify the user is accessing their own data
    if (req.session.uid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot delete another user\'s itinerary'
      });
    }

    // Delete the itinerary (only if it belongs to this user)
    const [result] = await pool.execute(
      `DELETE FROM user_itineraries 
       WHERE itinerary_id = ? AND user_id = ?`,
      [itineraryId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found or does not belong to this user'
      });
    }

    console.log(`Itinerary ${itineraryId} deleted by user ${userId}`);

    res.json({
      success: true,
      message: 'Itinerary deleted successfully'
    });

  } catch (err) {
    console.error('Delete itinerary error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting itinerary'
    });
  }
});


// STATIC PAGE ROUTES
 
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'index.html'));
});
 
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'signup.html'));
});
 
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'login.html'));
});
 
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'dashboard.html'));
});
 
app.get('/streetview', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'streetview.html'));
});
 
app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'map.html'));
});
 
app.get('/study', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'study.html'));
});
 
app.get('/adventure', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'adventure.html'));
});
 
app.get('/testing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'testing.html'));
});

app.get('/itinerary', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'itinerary.html'));
});
 

// GAME ROUTES

 
app.get('/ag1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'level1.html'));
});
 
app.get('/games/bantayan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'bantayan.html'));
});
 
app.get('/games/badian', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'badian.html'));
});
 
app.get('/games/oslob', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'oslob.html'));
});
 
app.get('/games/moalboal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'moalboal.html'));
});
 
app.get('/games/cebucity', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'cebucity.html'));
});
 
app.get('/games/carcar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'carcar.html'));
});
 
app.get('/games/talisay', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'talisay.html'));
});
 
app.get('/games/battleofmactan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'level2.html'));
});
 
app.get('/games/medellin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'medellin.html'));
});
 
app.get('/games/danao', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sugbohenyo', 'games', 'danao.html'));
});
 

// ERROR HANDLING

 
// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});
 
// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  pool.end(() => {
    console.log('Database pool closed.');
    process.exit(0);
  });
});
 
module.exports = { app, pool };