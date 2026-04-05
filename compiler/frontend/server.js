const express = require('express');
const path = require('path');
const axios = require('axios');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Session for frontend
app.use(session({
  secret: process.env.SESSION_SECRET || 'frontend-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Make user available to all views
app.use(async (req, res, next) => {
  try {
    if (req.session.token) {
            if (req.session.token) {
      const response = await axios.get(`${BACKEND_URL}/api/auth/session`, {
        headers: { 
          'Authorization': `Bearer ${req.session.token}`,
          'Cookie': req.headers.cookie 
        },
        withCredentials: true
      });
      
      if (response.data.authenticated) {
        res.locals.user = response.data.user;
        res.locals.isAuthenticated = true;
      } else {
        res.locals.isAuthenticated = false;
        req.session.token = null;
      }
    }
     else {
      res.locals.isAuthenticated = false;
     }
}
  } catch (err) {
    console.error('Auth check error:', err);
    res.locals.isAuthenticated = false;
    req.session.token = null;
  }
  next();
});

// Routes
app.get('/', async (req, res) => {
  try {
    let languages = [];
    let quota = null;
    
    // Get languages from backend
    try {
      const langResponse = await axios.get(`${BACKEND_URL}/api/languages`);
      languages = langResponse.data.languages;
    } catch (err) {
      console.error('Failed to fetch languages:', err);
    }
    
    // Get quota if authenticated
    if (res.locals.isAuthenticated) {
      try {
        const quotaResponse = await axios.get(`${BACKEND_URL}/api/user/stats`, {
          headers: { 'Authorization': `Bearer ${req.session.token}` },
          withCredentials: true
        });
        quota = quotaResponse.data.quota;
      } catch (err) {
        console.error('Failed to fetch quota:', err);
      }
    }
    
    res.render('index', {
      output: '',
      error: '',
      code: '',
      languages,
      quota,
      csrfToken: req.session.csrfToken
    });
  } catch (err) {
    console.error('Home page error:', err);
    res.status(500).send('Server error');
  }
});

// Compile route
app.post('/compile', async (req, res) => {
  try {
    const { code, language, input } = req.body;
    
    const response = await axios.post(`${BACKEND_URL}/api/compile`, {
      code,
      language,
      input
    }, {
      headers: { 
        'Authorization': `Bearer ${req.session.token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 30000 // 30 second timeout
    });
    
    // Get updated languages
    const langResponse = await axios.get(`${BACKEND_URL}/api/languages`);
    
    res.render('index', {
      output: response.data.output || '(No output)',
      error: response.data.error || '',
      code,
      languages: langResponse.data.languages,
      quota: response.data.quota,
      executionTime: response.data.executionTime,
      csrfToken: req.session.csrfToken
    });
    
  } catch (err) {
    console.error('Compilation error:', err);
    
    let errorMessage = 'Compilation failed';
    let statusCode = 500;
    
    if (err.response) {
      errorMessage = err.response.data.error || err.response.statusText;
      statusCode = err.response.status;
      
      // Handle specific errors
      if (statusCode === 401) {
        errorMessage = 'Session expired. Please login again.';
        req.session.token = null;
      } else if (statusCode === 429) {
        errorMessage = err.response.data.error || 'Rate limit exceeded';
      }
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = 'Compilation timeout (30 seconds)';
    }
    
    // Get languages anyway
    const langResponse = await axios.get(`${BACKEND_URL}/api/languages`).catch(() => ({ data: { languages: [] } }));
    
    res.render('index', {
      output: '',
      error: errorMessage,
      code,
      languages: langResponse.data.languages,
      quota: null,
      csrfToken: req.session.csrfToken
    });
  }
});

// Login page
app.get('/login', (req, res) => {
  if (res.locals.isAuthenticated) {
    return res.redirect('/');
  }
  res.render('login', { 
    error: null,
    csrfToken: req.session.csrfToken 
  });
});

// Login handler
app.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email,
      password,
      rememberMe
    }, {
      withCredentials: true
    });
    
    if (response.data.success) {
      req.session.token = response.data.token;
      req.session.user = response.data.user;
      res.redirect('/');
    } else {
      res.render('login', { 
        error: 'Login failed',
        csrfToken: req.session.csrfToken 
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { 
      error: err.response?.data?.error || 'Login failed',
      csrfToken: req.session.csrfToken 
    });
  }
});

// Register page
app.get('/register', (req, res) => {
  if (res.locals.isAuthenticated) {
    return res.redirect('/');
  }
  res.render('register', { 
    error: null,
    csrfToken: req.session.csrfToken 
  });
});

// Register handler
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, tier } = req.body;
    
    const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      username,
      email,
      password,
      tier
    }, {
      withCredentials: true
    });
    
    if (response.data.success) {
      req.session.token = response.data.token;
      req.session.user = response.data.user;
      res.redirect('/');
    } else {
      res.render('register', { 
        error: 'Registration failed',
        csrfToken: req.session.csrfToken 
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', { 
      error: err.response?.data?.error || 'Registration failed',
      csrfToken: req.session.csrfToken 
    });
  }
});

// Logout
app.get('/logout', async (req, res) => {
  try {
    await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, {
      headers: { 'Authorization': `Bearer ${req.session.token}` },
      withCredentials: true
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
  
  req.session.destroy();
  res.redirect('/');
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  if (!res.locals.isAuthenticated) {
    return res.redirect('/login');
  }
  
  try {
    const statsResponse = await axios.get(`${BACKEND_URL}/api/user/stats`, {
      headers: { 'Authorization': `Bearer ${req.session.token}` },
      withCredentials: true
    });
    
    const historyResponse = await axios.get(`${BACKEND_URL}/api/user/history`, {
      headers: { 'Authorization': `Bearer ${req.session.token}` },
      withCredentials: true
    });
    
    res.render('dashboard', {
      user: res.locals.user,
      stats: statsResponse.data,
      history: historyResponse.data.history,
      pagination: historyResponse.data.pagination,
      csrfToken: req.session.csrfToken
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Failed to load dashboard');
  }
});

// Profile page
app.get('/profile', async (req, res) => {
  if (!res.locals.isAuthenticated) {
    return res.redirect('/login');
  }
  
  try {
    const statsResponse = await axios.get(`${BACKEND_URL}/api/user/stats`, {
      headers: { 'Authorization': `Bearer ${req.session.token}` },
      withCredentials: true
    });
    
    res.render('profile', {
      user: res.locals.user,
      stats: statsResponse.data,
      csrfToken: req.session.csrfToken
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).send('Failed to load profile');
  }
});

// Update preferences
app.post('/profile/preferences', async (req, res) => {
  if (!res.locals.isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const response = await axios.patch(`${BACKEND_URL}/api/user/preferences`, req.body, {
      headers: { 
        'Authorization': `Bearer ${req.session.token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    res.json(response.data);
  } catch (err) {
    console.error('Preferences update error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Frontend server running on http://localhost:${PORT}`);
  console.log(`🔗 Connected to backend: ${BACKEND_URL}`);
});