const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken } = require('./auth');

// GET /api/expenses - List expenses filtered by selected month & year
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // 1. Determine selected/current month & year automatically (Requirement 1)
        const targetMonth = req.query.month ? parseInt(req.query.month, 10) : (now.getMonth() + 1);
        const targetYear = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();

        const padMonth = String(targetMonth).padStart(2, '0');
        const padYear = String(targetYear);
        const targetYM = `${padYear}-${padMonth}`;

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentYM = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        // Check user account creation month and future month validation
        const userRes = await db.query('SELECT created_at FROM users WHERE id = ?', [userId]);
        let createdYM = null;
        if (userRes[0]?.created_at) {
            const rawDate = String(userRes[0].created_at).trim();
            if (rawDate.length >= 7 && rawDate.includes('-')) {
                createdYM = rawDate.substring(0, 7);
            }
        }

        if (createdYM && targetYM < createdYM) {
            return res.json({ not_available: true, reason: 'BEFORE_REGISTRATION', message: 'You did not have a PennyWise account during this month.' });
        }

        if (targetYM > currentYM) {
            return res.json({ not_available: true, reason: 'FUTURE_MONTH', message: 'Monthly reports are not available for future months.' });
        }

        // 2 & 3. Exact SQLite query with date column (Requirement 2 & 3)
        let expenses = await db.query(`
            SELECT *
            FROM expenses
            WHERE strftime('%m', date) = printf('%02d', ?)
              AND strftime('%Y', date) = printf('%04d', ?)
              AND user_id = ?
            ORDER BY date DESC, id DESC
        `, [targetMonth, targetYear, userId]);

        // Safety fallback check for ISO date string representations
        if (expenses.length === 0) {
            const allUserExpenses = await db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC', [userId]);
            expenses = allUserExpenses.filter(e => e.date && String(e.date).startsWith(targetYM));
        }

        // 4. Backend logs (Requirement 4)
        const newestDate = expenses.length > 0 ? expenses[0].date : 'N/A';
        const oldestDate = expenses.length > 0 ? expenses[expenses.length - 1].date : 'N/A';

        console.log(`[Expenses API] Current Month: ${targetMonth}, Current Year: ${targetYear}`);
        console.log(`[Expenses API] Number of expenses returned: ${expenses.length}`);
        console.log(`[Expenses API] Newest expense date: ${newestDate}, Oldest expense date: ${oldestDate}`);

        res.json(expenses);
    } catch (err) {
        console.error('[Expenses API Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/expenses - Add new expense
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, amount, category, location, mood, is_impulse, carbon_score } = req.body;

        if (!title || !amount || !category) {
            return res.status(400).json({ error: 'Title, amount, and category are required.' });
        }

        // Auto calculate carbon score if not provided
        let computedCarbon = carbon_score || 'Medium';
        if (category === 'Transportation' && amount > 25) computedCarbon = 'High';
        if (category === 'Food & Groceries') computedCarbon = 'Low';

        const result = await db.query(`
            INSERT INTO expenses (user_id, title, amount, category, location, mood, is_impulse, carbon_score, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
        `, [userId, title, amount, category, location || 'Online / General', mood || 'Neutral', is_impulse ? 1 : 0, computedCarbon]);

        // Award XP for logging expenses and staying under control
        await db.query('UPDATE users SET xp = xp + 10 WHERE id = ?', [userId]);

        res.json({ message: 'Expense added successfully', id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/expenses/:id - Edit existing expense
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { title, amount, category, location, mood } = req.body;
        const userId = req.user.id;
        const expenseId = req.params.id;

        const existing = await db.query('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Expense not found.' });
        }

        await db.query(`
            UPDATE expenses
            SET title = COALESCE(?, title),
                amount = COALESCE(?, amount),
                category = COALESCE(?, category),
                location = COALESCE(?, location),
                mood = COALESCE(?, mood)
            WHERE id = ? AND user_id = ?
        `, [title, amount, category, location, mood, expenseId, userId]);

        res.json({ message: 'Expense updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/expenses/:id/satisfaction - Update 7-day satisfaction score (Regret Predictor)

router.put('/:id/satisfaction', authenticateToken, async (req, res) => {
    try {
        const { score } = req.body; // 1 to 10
        await db.query('UPDATE expenses SET satisfaction_score = ? WHERE id = ? AND user_id = ?', [score, req.params.id, req.user.id]);
        res.json({ message: 'Satisfaction updated!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/income - List income
router.get('/income', authenticateToken, async (req, res) => {
    try {
        const income = await db.query('SELECT * FROM income WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
        res.json(income);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/income - Add income
router.post('/income', authenticateToken, async (req, res) => {
    try {
        const { title, amount, category, frequency } = req.body;
        const result = await db.query(`
            INSERT INTO income (user_id, title, amount, category, frequency, date)
            VALUES (?, ?, ?, ?, ?, CURRENT_DATE)
        `, [req.user.id, title, amount, category || 'Salary', frequency || 'Monthly']);
        res.json({ message: 'Income added', id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
