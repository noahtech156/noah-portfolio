const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, 'profile-' + timestamp + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = allowed.test(file.mimetype);
    if (mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

// Upload profile photo
app.post('/upload-photo', upload.single('profile_photo'), (req, res) => {
  if (!req.cookies || req.cookies.admin_auth !== 'true') return res.redirect('/login');
  try {
    if (req.file) {
      const photoPath = '/images/' + req.file.filename;
      data.profilePhoto = photoPath;
      fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data, null, 2));
      res.redirect('/admin');
    } else {
      res.status(400).redirect('/admin');
    }
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).render('admin', { data, error: 'Error uploading photo' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});