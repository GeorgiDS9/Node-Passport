if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require ('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const session = require ('express-session');
const flash = require ('express-flash');
const methodOverride = require ('method-override');

// The passport config is in a separate file
const initializePassport = require('./passport-config');
initializePassport(
  passport, 
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

const users = []; // instead of storing it in a database, we store it locally, in an array, for the purpose of this exercise only. This is not done in production.

app.set('view-engine', 'ejs');

// To use info from forms
// app.use(express.urlenconded({extended: false}));

app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, // resave our session variables if nothing has changed
  saveUninitialized: false // do you want to save an empty value in the session if there is no value?
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

// Set up a route
app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', {name: req.user.name});
});

// Create routes for the REGISTER page
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
  // req.body.name; // corresponds to the "name" field in the form
  // req.body.email
  // req.body.password
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10) // 10 rounds
    users.push({
      id: Date.now().toString(), // mongoose would create an id.
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    });
    res.redirect('/login');
  } catch {
    res.redirect ('/register');
  }
  console.log(users); // "users" var will reset to an empty array every time we refresh, because we are not using a db.
});

// Create routes for the LOGIN page
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true //
}));

// Logout Route
app.delete('/logout', (req, res) => {
  req.logOut(); // function in passport package
  res.redirect('/login');
});
// Delete is not supported by forms in html, so we need to install a package/library called "method-override" so we can call the delete method.

// Middleware
function checkAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.redirect ('/login');
};

function checkNotAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect ('/');
  }
  next();
}

app.listen(3000);