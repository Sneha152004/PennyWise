const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken } = require('./auth');

// GET /api/gamification - Badges, levels, XP & TODAY'S active daily challenges
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRes = await db.query('SELECT xp, level_name FROM users WHERE id = ?', [userId]);

        const allBadges = await db.query('SELECT * FROM achievements');
        const userBadges = await db.query('SELECT badge_key FROM user_achievements WHERE user_id = ?', [userId]);
        const unlockedKeys = userBadges.map(b => b.badge_key);

        // Fetch TODAY'S challenges only (previous days' missions automatically disappear!)
        const todayStr = new Date().toISOString().split('T')[0];
        let challenges = await db.query(
            `SELECT * FROM challenges WHERE user_id = ? AND (challenge_date = ? OR challenge_date = CURRENT_DATE) ORDER BY id DESC`, 
            [userId, todayStr]
        );

        // Seed default daily challenges for today if user has no missions today
        if (challenges.length === 0) {
            await db.query(`
                INSERT INTO challenges (user_id, title, potential_savings, xp_reward, is_completed, challenge_date)
                VALUES 
                (?, 'Skip Dining Out Today', 25.00, 50, 0, ?),
                (?, 'No Impulse Buys Challenge', 15.00, 40, 0, ?),
                (?, 'Review Monthly Subscription List', 30.00, 60, 0, ?)
            `, [userId, todayStr, userId, todayStr, userId, todayStr]);

            challenges = await db.query(
                `SELECT * FROM challenges WHERE user_id = ? AND (challenge_date = ? OR challenge_date = CURRENT_DATE) ORDER BY id DESC`, 
                [userId, todayStr]
            );
        }

        const sharedGoals = await db.query('SELECT * FROM shared_goals WHERE user_id = ?', [userId]);

        const currentXp = userRes[0]?.xp || 0;
        let level = 'Penny Beginner';
        if (currentXp >= 1000) level = 'Financial Legend';
        else if (currentXp >= 750) level = 'Wealth Wizard';
        else if (currentXp >= 500) level = 'Savings Knight';
        else if (currentXp >= 250) level = 'Treasure Hunter';
        else if (currentXp >= 100) level = 'Budget Explorer';

        res.json({
            xp: currentXp,
            level_name: level,
            badges: allBadges.map(b => ({
                ...b,
                unlocked: unlockedKeys.includes(b.badge_key)
            })),
            challenges,
            shared_goals: sharedGoals
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/gamification/custom-challenge - User adds their own custom daily mission
router.post('/custom-challenge', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, potential_savings, xp_reward } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Please enter a mission title.' });
        }

        const savings = parseFloat(potential_savings) || 20.00;
        const xp = parseInt(xp_reward) || 50;
        const todayStr = new Date().toISOString().split('T')[0];

        const result = await db.query(`
            INSERT INTO challenges (user_id, title, potential_savings, xp_reward, is_completed, challenge_date)
            VALUES (?, ?, ?, ?, 0, ?)
        `, [userId, title, savings, xp, todayStr]);

        res.json({ message: 'Custom daily mission set successfully!', id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/gamification/challenge/:id - Remove a daily mission
router.delete('/challenge/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const challengeId = req.params.id;

        await db.query('DELETE FROM challenges WHERE id = ? AND user_id = ?', [challengeId, userId]);
        res.json({ message: 'Daily mission removed successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/gamification/complete-challenge/:id - Complete a mission & auto-update overall badges/XP
router.post('/complete-challenge/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const challengeId = req.params.id;

        const challenge = await db.query('SELECT * FROM challenges WHERE id = ? AND user_id = ?', [challengeId, userId]);
        if (challenge.length === 0) return res.status(404).json({ error: 'Mission not found' });

        if (challenge[0].is_completed) {
            return res.json({ message: 'Mission already completed today.' });
        }

        const xp = challenge[0].xp_reward || 50;
        await db.query('UPDATE challenges SET is_completed = 1 WHERE id = ?', [challengeId]);
        await db.query('UPDATE users SET xp = xp + ?, level_name = ? WHERE id = ?', [xp, 'Money Master', userId]);

        // Check & unlock overall badges automatically based on user progress
        const userRes = await db.query('SELECT xp FROM users WHERE id = ?', [userId]);
        const newXp = userRes[0]?.xp || 0;

        if (newXp >= 100) {
            try { await db.query('INSERT INTO user_achievements (user_id, badge_key) VALUES (?, ?)', [userId, 'first_goal']); } catch(e){}
        }
        if (newXp >= 500) {
            try { await db.query('INSERT INTO user_achievements (user_id, badge_key) VALUES (?, ?)', [userId, 'xp_master']); } catch(e){}
        }

        res.json({ message: `Daily Mission Completed! +${xp} XP awarded!`, xp_gained: xp, new_total_xp: newXp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
