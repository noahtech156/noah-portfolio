const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key', // Change this to a secure key
  resave: false,
  saveUninitialized: true
}));
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load data
let data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Routes
app.get('/', (req, res) => {
  res.render('index', data);
});

app.get('/admin', (req, res) => {
  if (req.session.loggedIn) {
    res.render('admin', { data });
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') { // Change this
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

app.post('/update', (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/login');
  // Update data
  const newData = { ...req.body };
  newData.about = [];
  for (let key in req.body) {
    if (key.startsWith('about[')) {
      const index = parseInt(key.match(/about\[(\d+)\]/)[1]);
      newData.about[index] = req.body[key];
    }
  }
  delete newData['about[0]'];
  delete newData['about[1]'];
  // For other arrays, but for now
  Object.assign(data, newData);
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});