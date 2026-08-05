const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db/db');
const { router: authRouter } = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard');
const expensesRouter = require('./routes/expenses');
const aiRouter = require('./routes/ai');
const gamificationRouter = require('./routes/gamification');
const subscriptionsRouter = require('./routes/subscriptions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/subscriptions', subscriptionsRouter);

// Fallback index.html route for SPA navigation
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
db.initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`===================================================`);
        console.log(`🚀 PennyWise Application running at http://localhost:${PORT}`);
        console.log(`===================================================`);
    });
}).catch(err => {
    console.error('Failed to launch PennyWise:', err);
});

