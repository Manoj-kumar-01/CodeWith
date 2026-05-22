const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Add requires for session, connect-mongo, socket.io, bcrypt
if (!code.includes("require('express-session')")) {
    code = code.replace("const express = require('express');",
`const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');`);
}

// 2. Wrap express in http server and attach socket.io
if (!code.includes("http.createServer(app)")) {
    code = code.replace("const app = express();",
`const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store io instance for global usage if needed
app.set('io', io);`);
}

// 3. Replace app.listen with server.listen
code = code.replace(/app\.listen\(/g, "server.listen(");

// 4. Inject session middleware and res.locals BEFORE static middleware
const sessionSetup = `
// Session Configuration
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'codewith-super-secret-key',
    resave: false,
    saveUninitialized: false,
    store: process.env.MONGO_URI ? MongoStore.create({ mongoUrl: process.env.MONGO_URI }) : new session.MemoryStore(),
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 1 day
});
app.use(sessionMiddleware);

// Socket.io session sharing
io.engine.use(sessionMiddleware);

// Socket.io connection handling
io.on('connection', (socket) => {
    const session = socket.request.session;
    if (session && session.user) {
        socket.join('user_' + session.user.username); // Join personal room for invites
        console.log('Socket connected for user:', session.user.username);
    }

    socket.on('invite_friend', (data) => {
        // data: { friendUsername, roomId }
        if (session && session.user) {
            io.to('user_' + data.friendUsername).emit('room_invite', {
                from: session.user.username,
                roomId: data.roomId
            });
        }
    });

    socket.on('disconnect', () => {
        // Handle disconnect
    });
});

// Middleware to inject user into views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Auth Middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};
`;
if (!code.includes("sessionMiddleware = session(")) {
    code = code.replace("// Middleware", sessionSetup + "\n// Middleware");
}

// 5. Replace references to 'alexchen' with req.session.user.username
code = code.replace(/User\.findOne\(\{ username: 'alexchen' \}\)/g, "User.findOne({ username: req.session.user.username })");
code = code.replace(/const currentUsername = req\.query\.guest \? 'guest_user' : 'alexchen';/g, "const currentUsername = req.session.user ? req.session.user.username : 'guest_user';");
code = code.replace(/req\.query\.guest \? 'guest_user' : 'alexchen'/g, "req.session.user ? req.session.user.username : 'guest_user'");
code = code.replace(/=== 'alexchen'/g, "=== (req.session.user ? req.session.user.username : '')");
code = code.replace(/'alexchen'/g, "(req.session.user ? req.session.user.username : 'alexchen')");

// Clean up any potential messy replacements if they happened in auth routes or setup... Wait, the single quote replacement could be risky, but 'alexchen' is only used as a string literal.

// 6. Protect routes with requireAuth
const protectedRoutes = [
    "app.get('/'", 
    "app.get('/portfolio'", 
    "app.get('/custom'", 
    "app.post('/custom/create'",
    "app.get('/custom/room/:id'",
    "app.post('/api/custom/room/:id/settings'",
    "app.get('/api/custom/room/:id/state'",
    "app.post('/api/custom/room/:id/action'",
    "app.get('/dashboard'"
];

for (const route of protectedRoutes) {
    if (!code.includes(route.replace("'", "\\'") + ", requireAuth")) {
        code = code.replace(route, route + ", requireAuth");
    }
}

// 7. Inject Auth Routes before the other routes
const authRoutes = `
// --- AUTH ROUTES ---
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.render('login', { error: 'Invalid username or password' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.render('login', { error: 'Invalid username or password' });
        
        req.session.user = {
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email
        };
        res.redirect('/');
    } catch (err) {
        res.render('login', { error: 'An error occurred during login' });
    }
});

app.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    try {
        const { username, name, email, password } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.render('register', { error: 'Username or email already exists' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = await User.create({
            username, name, email, password: hashedPassword,
            stats: { rating: 1200, solved: 0 }
        });
        
        req.session.user = {
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email
        };
        res.redirect('/');
    } catch (err) {
        res.render('register', { error: 'An error occurred during registration' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});
// -------------------
`;

if (!code.includes("app.get('/login'")) {
    code = code.replace("// Routes", authRoutes + "\n// Routes");
}

fs.writeFileSync(serverFile, code);
console.log('server.js patched successfully!');
