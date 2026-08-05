const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');

const JWT_SECRET = process.env.JWT_SECRET || 'finpilot-super-secret-key-2026';

// Middleware to verify JWT token (supports Header or Query parameter for PDF downloads)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token && req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Token missing.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
}


// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, country, currency } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide name, email, and password.' });
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanName = name.trim();
        const cleanPassword = password.trim();

        const existing = await db.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered. Please login.' });
        }

        const hash = bcrypt.hashSync(cleanPassword, 10);
        await db.query(`
            INSERT INTO users (name, email, password_hash, role, xp, level_name)
            VALUES (?, ?, ?, 'user', 100, 'Beginner')
        `, [cleanName, cleanEmail, hash]);

        // Fetch exact newly created user ID
        const newlyCreated = await db.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
        const newUser = newlyCreated[0];
        const newUserId = newUser.id;

        // Insert settings for new user
        await db.query(`
            INSERT INTO user_settings (user_id, country, currency)
            VALUES (?, ?, ?)
        `, [newUserId, country || 'United States', currency || '$']);

        const token = jwt.sign({ id: newUserId, email: cleanEmail, name: cleanName, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: newUserId, name: cleanName, email: cleanEmail, role: 'user', xp: 100, level_name: 'Beginner', country: country || 'United States', currency: currency || '$' }
        });
    } catch (err) {
        console.error('[Register Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required.' });
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanPassword = password.trim();

        const users = await db.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const user = users[0];
        const valid = bcrypt.compareSync(cleanPassword, user.password_hash);
        if (!valid) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Fetch settings
        const settings = await db.query('SELECT country, currency FROM user_settings WHERE user_id = ?', [user.id]);
        const country = settings[0]?.country || 'United States';
        const currency = settings[0]?.currency || '$';

        const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, xp: user.xp, level_name: user.level_name, country, currency }
        });
    } catch (err) {
        console.error('[Login Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/profile - Fetch full financial profile, deductions & currency settings
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await db.query('SELECT id, name, email, role, xp, level_name FROM users WHERE id = ?', [userId]);
        const settings = await db.query('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
        const incomeRows = await db.query('SELECT * FROM income WHERE user_id = ?', [userId]);
        const deductionsRows = await db.query('SELECT * FROM deductions WHERE user_id = ?', [userId]);

        const targetInc = settings[0]?.monthly_income_target || 5200.00;
        const grossIncome = incomeRows.length > 0 ? incomeRows.reduce((acc, curr) => acc + parseFloat(curr.amount), 0) : parseFloat(targetInc);
        const totalDeductions = deductionsRows.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
        const netTakeHome = grossIncome - totalDeductions;


        res.json({
            user: users[0] || req.user,
            settings: settings[0] || { country: 'United States', currency: '$', monthly_income_target: 5200.00 },
            income_sources: incomeRows,
            deductions: deductionsRows,
            financial_summary: {
                gross_income: grossIncome,
                total_deductions: totalDeductions,
                net_take_home: netTakeHome
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/auth/profile - Update settings (country, currency, target income)
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { country, currency, monthly_income_target } = req.body;

        await db.query(`
            UPDATE user_settings
            SET country = COALESCE(?, country),
                currency = COALESCE(?, currency),
                monthly_income_target = COALESCE(?, monthly_income_target)
            WHERE user_id = ?
        `, [country, currency, monthly_income_target, userId]);

        if (monthly_income_target !== undefined && monthly_income_target !== null) {
            const targetNum = parseFloat(monthly_income_target);
            if (!isNaN(targetNum)) {
                const salaryRows = await db.query("SELECT * FROM income WHERE user_id = ? AND category = 'Salary'", [userId]);
                if (salaryRows.length > 0) {
                    await db.query("UPDATE income SET amount = ? WHERE id = ?", [targetNum, salaryRows[0].id]);
                } else {
                    await db.query("INSERT INTO income (user_id, title, amount, category, frequency) VALUES (?, 'Primary Salary', ?, 'Salary', 'Monthly')", [userId, targetNum]);
                }
            }
        }

        res.json({ message: 'Profile & currency settings updated successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET /api/auth/deductions - List deductions
router.get('/deductions', authenticateToken, async (req, res) => {
    try {
        const deductions = await db.query('SELECT * FROM deductions WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
        res.json(deductions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/deductions - Add new deduction
router.post('/deductions', authenticateToken, async (req, res) => {
    try {
        const { title, amount, category, frequency } = req.body;
        if (!title || !amount) {
            return res.status(400).json({ error: 'Title and amount are required.' });
        }

        const result = await db.query(`
            INSERT INTO deductions (user_id, title, amount, category, frequency)
            VALUES (?, ?, ?, ?, ?)
        `, [req.user.id, title, amount, category || 'Tax & Fixed', frequency || 'Monthly']);

        res.json({ message: 'Deduction added successfully', id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/auth/deductions/:id - Delete deduction
router.delete('/deductions/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM deductions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Deduction deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/forgot-password - Reset password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ error: 'Email and new password are required.' });
        }

        const cleanEmail = email.toLowerCase().trim();
        const users = await db.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User with this email not found.' });
        }

        const hash = bcrypt.hashSync(newPassword.trim(), 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, users[0].id]);

        res.json({ message: 'Password reset successfully. You can now login with your new password.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/auth/account - Delete user account and cleanup all connected data
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Cascade delete across all tables
        await db.query('DELETE FROM reports WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM receipts WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM challenges WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM user_achievements WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM price_watch WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM subscriptions WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM shared_goals WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM savings_goals WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM budgets WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM expenses WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM income WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM login_history WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM deductions WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM user_settings WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'Account and all associated user data deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = { router, authenticateToken };

