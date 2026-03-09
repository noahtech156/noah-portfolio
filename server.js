const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Check if environment is serverless (Vercel, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Note: Image uploads are disabled in serverless environments due to read-only filesystem
// For production, use a cloud storage service like AWS S3, Cloudinary, or Supabase

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'portfolio-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load data with error handling
let data;
try {
  const dataPath = path.join(__dirname, 'data.json');
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } else {
    throw new Error('data.json not found');
  }
} catch (error) {
  console.error('Error loading data.json:', error);
  data = { 
    name: 'Noah Aizeboje',
    title: 'Web Developer & DevOps Engineer',
    description: 'Portfolio powered by Express.js',
    about: ['Welcome to my portfolio!'],
    experiences: [],
    projects: [],
    footer: 'Portfolio Website',
    profilePhoto: null
  };
}

// Ensure all required properties exist
const ensureData = (data) => {
  return {
    name: data.name || 'Portfolio',
    title: data.title || 'Developer',
    description: data.description || 'Welcome to my portfolio',
    about: Array.isArray(data.about) ? data.about : [],
    experiences: Array.isArray(data.experiences) ? data.experiences : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    footer: data.footer || '© 2024 Portfolio',
    profilePhoto: data.profilePhoto || null
  };
};

// Ensure data has all required properties on startup
data = ensureData(data);

// Routes
app.get('/', (req, res) => {
  try {
    const pageData = ensureData(data);
    res.render('index', pageData);
  } catch (error) {
    console.error('Error rendering index:', error);
    res.status(500).send('Error loading portfolio. Please try again later.');
  }
});

app.get('/admin', (req, res) => {
  console.log('Admin access, cookie:', req.cookies ? req.cookies.admin_auth : 'no cookies');
  try {
    if (req.cookies && req.cookies.admin_auth === 'true') {
      const pageData = ensureData(data);
      res.render('admin', { data: pageData });
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    console.error('Error loading admin:', error);
    res.status(500).send('Error loading admin panel');
  }
});

app.get('/login', (req, res) => {
  try {
    res.render('login');
  } catch (error) {
    console.error('Error loading login:', error);
    res.status(500).send('Error loading login page');
  }
});

app.post('/login', (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    console.log('Login successful');
    // Set a simple cookie for auth
    res.cookie('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });
    res.redirect('/admin');
  } else {
    console.log('Login failed');
    res.render('login', { error: 'Invalid credentials' });
  }
});

app.post('/update', (req, res) => {
  if (!req.cookies || req.cookies.admin_auth !== 'true') return res.redirect('/login');
  try {
    const newData = { ...req.body };
    newData.about = [];
    for (let key in req.body) {
      if (key.startsWith('about[')) {
        const match = key.match(/about\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          newData.about[index] = req.body[key];
        }
      }
    }
    for (let key in newData) {
      if (key.startsWith('about[')) {
        delete newData[key];
      }
    }
    Object.assign(data, newData);
    
    // Try to save to file (will fail silently in serverless)
    try {
      if (!isServerless) {
        fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data, null, 2));
      }
      res.redirect('/admin');
    } catch (writeError) {
      console.warn('Could not save to file (serverless environment):', writeError.message);
      res.redirect('/admin');
    }
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).render('admin', { data, error: 'Error updating data' });
  }
});

// Photo upload endpoint (disabled in serverless)
app.post('/upload-photo', (req, res) => {
  if (!req.cookies || req.cookies.admin_auth !== 'true') return res.redirect('/login');
  
  if (isServerless) {
    return res.status(503).render('admin', { 
      data, 
      error: 'File uploads are disabled in serverless environment. Use Cloudinary or similar service.' 
    });
  }
  
  res.status(503).render('admin', { data, error: 'Photo upload feature not available' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message, err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #0a192f 0%, #1a2a4a 100%); color: #fff; }
        .error-container { text-align: center; background: rgba(255,255,255,0.05); padding: 40px; border-radius: 8px; max-width: 600px; }
        h1 { font-size: 3em; margin: 0 0 10px 0; color: #F7C948; }
        p { font-size: 1.2em; margin: 10px 0; }
        .error-detail { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 4px; margin-top: 20px; font-family: monospace; font-size: 0.9em; text-align: left; }
        a { color: #F7C948; text-decoration: none; margin-top: 20px; display: inline-block; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>${statusCode}</h1>
        <p>An error occurred while processing your request.</p>
        ${process.env.NODE_ENV === 'development' ? `<div class="error-detail"><strong>Error:</strong> ${err.message}</div>` : ''}
        <a href="/">← Return to Home</a>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});