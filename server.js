const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
  data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
} catch (error) {
  console.error('Error loading data.json:', error);
  data = { name: '', title: '', description: '', about: [], experiences: [], projects: [], footer: '' };
}

// Routes
app.get('/', (req, res) => {
  res.render('index', data);
});

app.get('/admin', (req, res) => {
  console.log('Admin access, cookie:', req.cookies ? req.cookies.admin_auth : 'no cookies');
  if (req.cookies && req.cookies.admin_auth === 'true') {
    res.render('admin', { data });
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
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
    fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data, null, 2));
    res.redirect('/admin');
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).render('admin', { data, error: 'Error updating data' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});