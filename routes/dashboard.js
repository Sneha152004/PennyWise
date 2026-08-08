const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken } = require('./auth');
const PDFDocument = require('pdfkit');


// GET /api/dashboard - Dashboard overview data (AI Financial Command Center)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentDateStr = now.toISOString().substring(0, 10);
        const thisMonthYM = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        
        // Previous month calculation
        const prevDate = new Date(currentYear, currentMonth - 2, 1);
        const prevMonthYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

        // Basic User & Settings Data
        const userRes = await db.query('SELECT name, email, xp, level_name, created_at FROM users WHERE id = ?', [userId]);
        const settingsRes = await db.query('SELECT country, currency, monthly_income_target FROM user_settings WHERE user_id = ?', [userId]);
        const userName = userRes[0]?.name || 'Alex';
        const currency = settingsRes[0]?.currency || '₹';
        const country = settingsRes[0]?.country || 'India';

        // Time-based greeting
        const hour = now.getHours();
        let greetingTime = 'Good morning';
        if (hour >= 12 && hour < 17) greetingTime = 'Good afternoon';
        else if (hour >= 17) greetingTime = 'Good evening';
        const greeting = `${greetingTime}, ${userName} 👋`;

        // Income & Expenses Summary (Clean slate for new users; demo fallbacks for User ID 1)
        const incomeRes = await db.query('SELECT SUM(amount) as total FROM income WHERE user_id = ?', [userId]);
        const deductionRes = await db.query('SELECT SUM(amount) as total FROM deductions WHERE user_id = ?', [userId]);
        const expenseRes = await db.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', [userId]);

        const rawIncomeTotal = incomeRes[0]?.total !== null && incomeRes[0]?.total !== undefined ? parseFloat(incomeRes[0].total) : 0;
        const targetIncome = settingsRes[0]?.monthly_income_target !== null && settingsRes[0]?.monthly_income_target !== undefined ? parseFloat(settingsRes[0].monthly_income_target) : 0;

        let totalIncome = 0;
        if (rawIncomeTotal > 0) {
            totalIncome = rawIncomeTotal;
        } else if (targetIncome > 0) {
            totalIncome = targetIncome;
        } else if (userId === 1) {
            totalIncome = 5200.00;
        }

        const rawDeductionTotal = deductionRes[0]?.total !== null && deductionRes[0]?.total !== undefined ? parseFloat(deductionRes[0].total) : 0;
        let totalDeductions = rawDeductionTotal;
        if (rawDeductionTotal === 0 && userId === 1) {
            totalDeductions = 1300.00;
        }

        const netTakeHomeIncome = Math.max(0, totalIncome - totalDeductions);
        const totalExpenses = parseFloat(expenseRes[0]?.total || 0.00);
        const netSavings = netTakeHomeIncome - totalExpenses;

        // Total expenses count for user
        const totalExpCountRes = await db.query(`SELECT COUNT(*) as count FROM expenses WHERE user_id = ?`, [userId]);
        const totalExpensesFound = totalExpCountRes[0]?.count || 0;

        // Spending Comparison: This Month vs Last Month
        const thisMonthQuery = `
            SELECT SUM(amount) as total FROM expenses
            WHERE user_id = ? AND (date LIKE ? OR created_at LIKE ?)
        `;
        const thisMonthExpRes = await db.query(thisMonthQuery, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`]);
        
        const lastMonthQuery = `
            SELECT SUM(amount) as total FROM expenses
            WHERE user_id = ? AND (date LIKE ? OR created_at LIKE ?)
        `;
        const lastMonthExpRes = await db.query(lastMonthQuery, [userId, `${prevMonthYM}%`, `${prevMonthYM}%`]);

        const spendingThisMonth = parseFloat(thisMonthExpRes[0]?.total || 0.00);
        const spendingLastMonth = parseFloat(lastMonthExpRes[0]?.total || 0.00);
        let spendingChangePct = null;
        let spendingChangeText = "First month of usage";
        let spendingChangeDirection = 'up';

        if (spendingLastMonth > 0) {
            const rawDiff = spendingThisMonth - spendingLastMonth;
            spendingChangePct = Math.round((rawDiff / spendingLastMonth) * 1000) / 10;
            spendingChangeDirection = spendingThisMonth >= spendingLastMonth ? 'up' : 'down';
            spendingChangeText = `${spendingThisMonth >= spendingLastMonth ? '+' : '-'}${Math.abs(spendingChangePct)}%`;
        } else {
            spendingChangeText = "First month of usage";
        }

        // Print 7 Diagnostic Debugging Console Logs
        console.log(`[Dashboard API Debug] current date: ${currentDateStr}`);
        console.log(`[Dashboard API Debug] current month: ${currentMonth} (${currentMonthName})`);
        console.log(`[Dashboard API Debug] current year: ${currentYear}`);
        console.log(`[Dashboard API Debug] total expenses found: ${totalExpensesFound}`);
        console.log(`[Dashboard API Debug] SQL query executed: ${thisMonthQuery.trim()} params: [${userId}, ${thisMonthYM}%, ${thisMonthYM}%]`);
        console.log(`[Dashboard API Debug] current month total: ${currency}${spendingThisMonth}`);
        console.log(`[Dashboard API Debug] last month total: ${currency}${spendingLastMonth}`);

        // Top 3 Largest Expense Categories This Month
        const topCategoriesRes = await db.query(`
            SELECT category, SUM(amount) as total
            FROM expenses
            WHERE user_id = ? AND (date LIKE ? OR created_at LIKE ?)
            GROUP BY category
            ORDER BY total DESC
            LIMIT 3
        `, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`]);

        const categoryIcons = {
            'Dining & Drinks': '🍔',
            'Food & Groceries': '🍔',
            'Food': '🍔',
            'Gaming': '🎮',
            'Entertainment': '🎮',
            'Transportation': '🚕',
            'Transport': '🚕',
            'Shopping': '🛍️',
            'Utilities': '⚡',
            'Housing': '🏠'
        };

        const largestCategories = topCategoriesRes.map(c => {
            const icon = categoryIcons[c.category] || '💳';
            return {
                category: c.category,
                amount: parseFloat(c.total || 0),
                icon: icon,
                formatted: `${c.category} → ${currency}${parseFloat(c.total || 0).toFixed(0)}`
            };
        });

        // ==========================================
        // SPENDING INSIGHTS CARD CALCULATIONS
        // ==========================================
        const highestExpRes = await db.query(`
            SELECT title, amount FROM expenses
            WHERE user_id = ? AND (date LIKE ? OR created_at LIKE ?)
            ORDER BY amount DESC LIMIT 1
        `, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`]);

        const lowestExpRes = await db.query(`
            SELECT title, amount FROM expenses
            WHERE user_id = ? AND (date LIKE ? OR created_at LIKE ?)
            ORDER BY amount ASC LIMIT 1
        `, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`]);

        const mostFreqCatRes = await db.query(`
            SELECT category, COUNT(*) as cnt FROM expenses
            WHERE user_id = ? AND (date LIKE ? OR created_at LIKE ?)
            GROUP BY category ORDER BY cnt DESC LIMIT 1
        `, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`]);

        const monthTxCountRes = await db.query(`
            SELECT COUNT(*) as cnt FROM expenses
            WHERE user_id = ? AND (date LIKE ? OR created_at LIKE ?)
        `, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`]);

        const monthTxCount = monthTxCountRes[0]?.cnt || 0;
        const currentDayOfMonth = now.getDate() || 1;
        const avgDailySpendingNum = Math.round(spendingThisMonth / currentDayOfMonth);

        const highestExpenseText = highestExpRes[0] ? `${highestExpRes[0].title} (${currency}${parseFloat(highestExpRes[0].amount).toFixed(0)})` : 'None';
        const lowestExpenseText = lowestExpRes[0] ? `${lowestExpRes[0].title} (${currency}${parseFloat(lowestExpRes[0].amount).toFixed(0)})` : 'None';
        const mostFrequentCategoryText = mostFreqCatRes[0]?.category || 'None';

        const spendingInsights = {
            highest_expense: highestExpenseText,
            lowest_expense: lowestExpenseText,
            most_frequent_category: mostFrequentCategoryText,
            total_transactions: monthTxCount,
            avg_daily_spending: `${currency}${avgDailySpendingNum}/day`
        };

        // Financial Health Score Calculation (0 - 100)
        let savingsRateScore = 0;
        const savingsRate = netTakeHomeIncome > 0 ? (netSavings / netTakeHomeIncome) : 0;
        if (savingsRate >= 0.30) savingsRateScore = 30;
        else if (savingsRate >= 0.20) savingsRateScore = 25;
        else if (savingsRate >= 0.10) savingsRateScore = 18;
        else if (savingsRate > 0) savingsRateScore = 10;

        const impulseCountRes = await db.query(`
            SELECT COUNT(*) as cnt FROM expenses
            WHERE user_id = ? AND is_impulse = 1 AND (date LIKE ? OR created_at LIKE ?)
        `, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`]);
        const impulseCountThisMonth = impulseCountRes[0]?.cnt || 0;
        const impulseScore = Math.max(0, 20 - (impulseCountThisMonth * 4));

        let expenseRatioScore = 0;
        const expRatio = netTakeHomeIncome > 0 ? (spendingThisMonth / netTakeHomeIncome) : 0;
        if (expRatio <= 0.50) expenseRatioScore = 20;
        else if (expRatio <= 0.70) expenseRatioScore = 15;
        else if (expRatio <= 0.85) expenseRatioScore = 10;
        else if (expRatio <= 1.00) expenseRatioScore = 5;

        let goalProgressScore = 12;

        const moodExpenses = await db.query(`
            SELECT mood FROM expenses WHERE user_id = ? AND mood IS NOT NULL AND mood != ''
        `, [userId]);
        let moodStabilityScore = 12;
        if (moodExpenses.length > 0) {
            const calmCount = moodExpenses.filter(m => ['Happy', 'Neutral', 'Calm'].includes(m.mood)).length;
            moodStabilityScore = Math.round((calmCount / moodExpenses.length) * 15);
        }

        const totalHealthScore = Math.min(100, Math.max(0, savingsRateScore + impulseScore + expenseRatioScore + goalProgressScore + moodStabilityScore));

        let healthLabel = 'Excellent';
        let healthBadgeText = `🟢 ${totalHealthScore}/100 — Excellent`;

        if (totalHealthScore >= 90) {
            healthLabel = 'Excellent';
            healthBadgeText = `🟢 ${totalHealthScore}/100 — Excellent`;
        } else if (totalHealthScore >= 70) {
            healthLabel = 'Good';
            healthBadgeText = `🟢 ${totalHealthScore}/100 — Good`;
        } else if (totalHealthScore >= 50) {
            healthLabel = 'Moderate';
            healthBadgeText = `🟡 ${totalHealthScore}/100 — Moderate`;
        } else {
            healthLabel = 'Needs attention';
            healthBadgeText = `🔴 ${totalHealthScore}/100 — Needs attention`;
        }

        // Weekly Spending Trend (Last 7 Days)
        const weeklyTrendDays = [];
        const weeklyTrendAmounts = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().substring(0, 10);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            
            const dayExpRes = await db.query(`
                SELECT SUM(amount) as total FROM expenses
                WHERE user_id = ? AND (date = ? OR created_at LIKE ?)
            `, [userId, dateStr, `${dateStr}%`]);

            weeklyTrendDays.push(dayName);
            weeklyTrendAmounts.push(parseFloat(dayExpRes[0]?.total || 0));
        }

        // ==========================================
        // PURELY DATA-DRIVEN AI SMART ALERTS
        // ==========================================
        const aiSmartAlerts = [];

        // Alert A: Category comparison vs last month
        const shopSpike = await db.query(`
            SELECT curr.category, curr.total as curr_total, prev.total as prev_total
            FROM (
                SELECT category, SUM(amount) as total FROM expenses
                WHERE user_id = ? AND (date LIKE ? OR created_at LIKE ?) GROUP BY category
            ) curr
            JOIN (
                SELECT category, SUM(amount) as total FROM expenses
                WHERE user_id = ? AND (date LIKE ? OR created_at LIKE ?) GROUP BY category
            ) prev ON curr.category = prev.category
            WHERE curr.total > prev.total
            ORDER BY ((curr.total - prev.total) / prev.total) DESC
            LIMIT 1
        `, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`, userId, `${prevMonthYM}%`, `${prevMonthYM}%`]);

        if (shopSpike.length > 0) {
            const s = shopSpike[0];
            const pct = Math.round(((s.curr_total - s.prev_total) / s.prev_total) * 100);
            const prevMonthName = new Date(prevDate).toLocaleString('en-US', { month: 'long' });
            aiSmartAlerts.push({
                icon: '📈',
                title: 'Category Spike Alert',
                message: `${s.category} spending increased by ${pct}% compared to ${prevMonthName}.`
            });
        }

        // Alert B: Mood purchases
        const moodDist = await db.query(`
            SELECT mood, COUNT(*) as cnt FROM expenses
            WHERE user_id = ? AND mood IS NOT NULL AND mood != ''
            GROUP BY mood ORDER BY cnt DESC LIMIT 1
        `, [userId]);

        const totalExpCount = totalExpensesFound || 1;

        if (moodDist.length > 0 && totalExpCount > 0) {
            const moodPct = Math.round((moodDist[0].cnt / totalExpCount) * 100);
            const mName = moodDist[0].mood.toLowerCase();
            aiSmartAlerts.push({
                icon: '🧠',
                title: 'Mood Pattern Alert',
                message: `${moodPct}% of purchases happened when ${mName}.`
            });
        }

        // Alert C: Top category spending total
        if (largestCategories.length > 0) {
            const topC = largestCategories[0];
            aiSmartAlerts.push({
                icon: '💳',
                title: 'Category Spend Summary',
                message: `You spent ${currency}${topC.amount.toFixed(0)} on ${topC.category} this month.`
            });
        }

        // Alert D: Impulse purchases share
        const impulseTotalRes = await db.query(`
            SELECT SUM(amount) as total FROM expenses
            WHERE user_id = ? AND is_impulse = 1 AND (date LIKE ? OR created_at LIKE ?)
        `, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`]);

        const totalImpulseAmount = parseFloat(impulseTotalRes[0]?.total || 0);
        if (spendingThisMonth > 0 && totalImpulseAmount > 0) {
            const impulsePct = Math.round((totalImpulseAmount / spendingThisMonth) * 100);
            aiSmartAlerts.push({
                icon: '🚨',
                title: 'Impulse Share Alert',
                message: `Impulse purchases account for ${impulsePct}% of spending this month.`
            });
        }

        // Budgets, goals, recent expenses & deductions
        const budgets = await db.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);
        const goalsList = await db.query('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY id DESC', [userId]);
        const recentExpenses = await db.query('SELECT DISTINCT date FROM expenses WHERE user_id = ? ORDER BY date DESC', [userId]);
        const deductionsList = await db.query('SELECT * FROM deductions WHERE user_id = ?', [userId]);
        const moodStats = await db.query(`
            SELECT mood, AVG(amount) as avg_amount, COUNT(*) as count
            FROM expenses WHERE user_id = ? AND mood IS NOT NULL AND mood != ''
            GROUP BY mood
        `, [userId]);

        res.json({
            summary: {
                greeting: greeting,
                user_name: userName,
                total_income: totalIncome,
                total_deductions: totalDeductions,
                net_take_home_income: netTakeHomeIncome,
                total_expenses: totalExpenses,
                net_savings: netSavings,
                currency: currency,
                country: country,
                xp: userRes[0]?.xp || 480,
                level_name: userRes[0]?.level_name || 'Money Master',
                created_at: userRes[0]?.created_at || '2026-07-20 00:00:00',
                current_month_name: currentMonthName,
                spending_this_month: spendingThisMonth,
                spending_last_month: spendingLastMonth,
                spending_change_pct: spendingChangePct,
                spending_change_text: spendingChangeText,
                spending_change_direction: spendingChangeDirection,
                largest_categories: largestCategories,
                spending_insights: spendingInsights,
                health_score: {
                    score: totalHealthScore,
                    label: healthLabel,
                    badge_text: healthBadgeText
                },
                weekly_spending_trend: {
                    days: weeklyTrendDays,
                    amounts: weeklyTrendAmounts
                }
            },
            budgets,
            goals: goalsList,
            ai_smart_alerts: aiSmartAlerts,
            mood_analytics: moodStats,
            deductions: deductionsList,
            expense_days_count: recentExpenses.length
        });

    } catch (err) {
        console.error('[Dashboard API Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/dashboard/budgets - Create a budget
router.post('/budgets', authenticateToken, async (req, res) => {
    try {
        const { category, monthly_limit, alert_threshold } = req.body;
        if (!category || !monthly_limit) {
            return res.status(400).json({ error: 'Category and monthly_limit are required.' });
        }

        const userId = req.user.id;
        const result = await db.query(`
            INSERT INTO budgets (user_id, category, monthly_limit, alert_threshold)
            VALUES (?, ?, ?, ?)
        `, [userId, category, monthly_limit, alert_threshold || 80]);

        res.json({ message: 'Budget created successfully', id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/dashboard/budgets/:id - Update a budget
router.put('/budgets/:id', authenticateToken, async (req, res) => {
    try {
        const { monthly_limit, alert_threshold } = req.body;
        const userId = req.user.id;
        const budgetId = req.params.id;

        await db.query(`
            UPDATE budgets
            SET monthly_limit = COALESCE(?, monthly_limit),
                alert_threshold = COALESCE(?, alert_threshold)
            WHERE id = ? AND user_id = ?
        `, [monthly_limit, alert_threshold, budgetId, userId]);

        res.json({ message: 'Budget updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/dashboard/budgets/:id - Delete budget
router.delete('/budgets/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Budget deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function calculateGoalProgression(currentAmount, targetAmount) {
    const pct = Math.min(100, Math.floor(((parseFloat(currentAmount) || 0) / (parseFloat(targetAmount) || 1)) * 100));
    let level = 1;
    let title = 'Penny Beginner';
    let xpAwarded = 0;

    if (pct >= 100) {
        level = 5;
        title = 'Financial Legend';
        xpAwarded = 500;
    } else if (pct >= 80) {
        level = 5;
        title = 'Wealth Wizard';
        xpAwarded = 350;
    } else if (pct >= 60) {
        level = 4;
        title = 'Savings Knight';
        xpAwarded = 250;
    } else if (pct >= 40) {
        level = 3;
        title = 'Treasure Hunter';
        xpAwarded = 150;
    } else if (pct >= 20) {
        level = 2;
        title = 'Budget Explorer';
        xpAwarded = 50;
    } else {
        level = 1;
        title = 'Penny Beginner';
        xpAwarded = 0;
    }

    return { pct, level, title, xpAwarded };
}

// POST /api/dashboard/goals & /api/dream-goals - Add new dream goal
async function handleCreateDreamGoal(req, res) {
    try {
        const { title, goalName, target_amount, targetAmount, current_amount, savedAmount, initialAmount, target_date, targetDate, image_emoji, theme, category, destination } = req.body;
        const userId = req.user.id;

        const goalTitle = title || goalName || 'Dream Journey Goal';
        const target = parseFloat(target_amount || targetAmount || 1000);
        const current = parseFloat(current_amount || savedAmount || initialAmount || 0);
        const emoji = image_emoji || '🎯';
        const goalTheme = theme || category || 'tokyo';
        const goalCat = category || 'travel';
        const goalDest = destination || '';
        const goalDate = target_date || targetDate || null;

        console.log('[Dream Goals API Debug] POST Payload received:', {
            userId,
            goalTitle,
            goalCat,
            goalDest,
            target,
            current,
            goalDate,
            goalTheme
        });

        const { level, title: unlockedTitle, xpAwarded } = calculateGoalProgression(current, target);

        const result = await db.query(`
            INSERT INTO savings_goals (user_id, title, category, destination, target_amount, current_amount, target_date, image_emoji, theme, current_level, xp, unlocked_title)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId, goalTitle, goalCat, goalDest, target, current, goalDate, emoji, goalTheme, level, xpAwarded, unlockedTitle]);

        console.log('[Dream Goals API Debug] SQL Insert executed successfully with ID:', result.id);

        const fetchCheck = await db.query('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY id DESC', [userId]);
        console.log('[Dream Goals API Debug] SQL Fetch check for user ID:', userId, 'Total rows returned:', fetchCheck.length);

        res.json({
            message: 'Dream Goal added successfully!',
            id: result.id,
            userId,
            goalName: goalTitle,
            title: goalTitle,
            category: goalCat,
            destination: goalDest,
            targetAmount: target,
            savedAmount: current,
            target_amount: target,
            current_amount: current,
            theme: goalTheme,
            current_level: level,
            unlocked_title: unlockedTitle
        });
    } catch (err) {
        console.error('[Dream Goals API Error]:', err);
        res.status(500).json({ error: err.message });
    }
}

router.post('/goals', authenticateToken, handleCreateDreamGoal);

// Mount alias route for /api/dream-goals in server.js or router
router.post('/dream-goals', authenticateToken, handleCreateDreamGoal);
router.get('/dream-goals', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const goals = await db.query('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY id DESC', [userId]);
        console.log('[Dream Goals API Debug] GET /api/dream-goals for user ID:', userId, 'Rows count:', goals.length);
        res.json(goals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/dashboard/goals/:id - Update dream goal progress or add savings increment
router.put('/goals/:id', authenticateToken, async (req, res) => {
    try {
        const { current_amount, add_amount, target_amount, title } = req.body;
        const userId = req.user.id;
        const goalId = req.params.id;

        const existingRows = await db.query('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?', [goalId, userId]);
        if (!existingRows || existingRows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        const oldGoal = existingRows[0];
        const oldLevel = oldGoal.current_level || 1;

        let newCurrentAmount = parseFloat(oldGoal.current_amount || 0);
        if (add_amount !== undefined && add_amount !== null) {
            const numToAdd = parseFloat(add_amount);
            if (!isNaN(numToAdd)) {
                newCurrentAmount += numToAdd;
            }
        } else if (current_amount !== undefined && current_amount !== null) {
            newCurrentAmount = parseFloat(current_amount);
        }

        const newTargetAmount = target_amount !== undefined ? parseFloat(target_amount) : parseFloat(oldGoal.target_amount || 1000);
        const newTitle = title || oldGoal.title;

        const { pct, level: newLevel, title: unlockedTitle, xpAwarded } = calculateGoalProgression(newCurrentAmount, newTargetAmount);

        await db.query(`
            UPDATE savings_goals
            SET current_amount = ?,
                target_amount = ?,
                title = ?,
                current_level = ?,
                xp = ?,
                unlocked_title = ?
            WHERE id = ? AND user_id = ?
        `, [newCurrentAmount, newTargetAmount, newTitle, newLevel, xpAwarded, unlockedTitle, goalId, userId]);

        let levelUp = false;
        let xpGained = 0;
        if (newLevel > oldLevel) {
            levelUp = true;
            xpGained = (newLevel - oldLevel) * 50;
            await db.query('UPDATE users SET xp = xp + ?, level_name = ? WHERE id = ?', [xpGained, unlockedTitle, userId]);
        }

        res.json({
            message: 'Dream Goal savings updated successfully!',
            current_amount: newCurrentAmount,
            progress_pct: pct,
            old_level: oldLevel,
            new_level: newLevel,
            unlocked_title: unlockedTitle,
            level_up: levelUp,
            xp_gained: xpGained
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// DELETE /api/dashboard/goals/:id - Delete dream goal
router.delete('/goals/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Dream Goal deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET /api/dashboard/reports - List monthly reports
router.get('/reports', authenticateToken, async (req, res) => {
    try {
        const reports = await db.query('SELECT * FROM reports WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/dashboard/reports/generate - Generate a monthly financial report summary
router.post('/reports/generate', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { report_type, file_format } = req.body;

        const title = `Monthly Financial Summary - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        const result = await db.query(`
            INSERT INTO reports (user_id, title, report_type, file_format)
            VALUES (?, ?, ?, ?)
        `, [userId, title, report_type || 'Monthly', file_format || 'PDF']);

        res.json({
            message: 'Monthly report generated successfully',
            report: { id: result.id, title, report_type: report_type || 'Monthly', file_format: file_format || 'PDF' }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helpers for clean PDF rendering without character corruption
function cleanPdfText(text) {
    if (!text) return '';
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/[^\x00-\x7F]/g, '').trim();
}

function getPdfCurrencyLabel(currency, country) {
    if (currency === '₹' || (country && country.includes('India'))) return 'INR ';
    if (currency === '€') return 'EUR ';
    if (currency === '£') return 'GBP ';
    if (currency === '$') return '$';
    return `${currency} `;
}

// GET /api/dashboard/reports/download - Download PDF Report for Selected Month & Year
router.get('/reports/download', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentYM = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        const monthParam = req.query.month ? String(req.query.month).padStart(2, '0') : String(currentMonth).padStart(2, '0');
        const yearParam = req.query.year ? String(req.query.year) : String(currentYear);

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIdx = parseInt(monthParam, 10) - 1;
        const monthName = monthNames[monthIdx] || "August";

        const filename = `monthly_report_${monthName}_${yearParam}.pdf`;

        // 1. Account Creation Date & Settings
        const userRes = await db.query('SELECT name, email, xp, level_name, created_at FROM users WHERE id = ?', [userId]);
        const settingsRes = await db.query('SELECT country, currency FROM user_settings WHERE user_id = ?', [userId]);
        const user = userRes[0] || req.user;
        const rawCurrency = settingsRes[0]?.currency || '₹';
        const country = settingsRes[0]?.country || 'India';
        const currLabel = getPdfCurrencyLabel(rawCurrency, country);

        let accountCreatedAt = user?.created_at ? String(user.created_at).trim() : '2026-07-20 00:00:00';

        let createdYear = 2026;
        let createdMonth = 7;

        const dateMatch = accountCreatedAt.match(/^(\d{4})-(\d{2})/);
        if (dateMatch) {
            createdYear = parseInt(dateMatch[1], 10);
            createdMonth = parseInt(dateMatch[2], 10);
        } else {
            const d = new Date(accountCreatedAt);
            if (!isNaN(d.getTime())) {
                createdYear = d.getFullYear();
                createdMonth = d.getMonth() + 1;
            }
        }

        const createdYM = `${createdYear}-${String(createdMonth).padStart(2, '0')}`;

        const selYear = parseInt(yearParam, 10);
        const selMonth = parseInt(monthParam, 10);
        const selectedYM = `${selYear}-${String(selMonth).padStart(2, '0')}`;

        const isBeforeRegistration = selectedYM < createdYM;
        const isFutureMonth = selectedYM > currentYM;

        // Fetch user expenses for requested month
        const allExpenses = await db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', [userId]);
        const monthExpenses = allExpenses.filter(e => e.date && String(e.date).startsWith(selectedYM));
        const numRecordsFound = monthExpenses.length;
        const hasData = numRecordsFound > 0;

        // Rule 6: If user selects a FUTURE month
        if (isFutureMonth) {
            console.log(`================ [PDF REPORT DEBUG LOG] ================`);
            console.log(`  • Account Creation Date : ${accountCreatedAt} (YM: ${createdYM})`);
            console.log(`  • Current Date          : ${currentDate} (YM: ${currentYM})`);
            console.log(`  • Selected Month        : ${monthName} ${selYear} (YM: ${selectedYM})`);
            console.log(`  • Before Registration?  : ${isBeforeRegistration}`);
            console.log(`  • Is Future Month?      : ${isFutureMonth}`);
            console.log(`  • Does Data Exist?      : ${hasData} (${numRecordsFound} records)`);
            console.log(`  • PDF Generation Allowed: BLOCKED (Future Month)`);
            console.log(`========================================================`);

            return res.status(400).json({
                error: "Monthly reports are not available for future months.",
                blocked: true,
                reason: "FUTURE_MONTH",
                account_created_at: accountCreatedAt,
                current_date: currentDate,
                selected_month: `${monthName} ${selYear}`
            });
        }

        // Rule 7: If user selects a month BEFORE registration
        if (isBeforeRegistration) {
            console.log(`================ [PDF REPORT DEBUG LOG] ================`);
            console.log(`  • Account Creation Date : ${accountCreatedAt} (YM: ${createdYM})`);
            console.log(`  • Current Date          : ${currentDate} (YM: ${currentYM})`);
            console.log(`  • Selected Month        : ${monthName} ${selYear} (YM: ${selectedYM})`);
            console.log(`  • Before Registration?  : ${isBeforeRegistration}`);
            console.log(`  • Is Future Month?      : ${isFutureMonth}`);
            console.log(`  • Does Data Exist?      : ${hasData} (${numRecordsFound} records)`);
            console.log(`  • PDF Generation Allowed: BLOCKED (Before Registration)`);
            console.log(`========================================================`);

            return res.status(400).json({
                error: "You did not have a PennyWise account during this month.",
                blocked: true,
                reason: "BEFORE_REGISTRATION",
                account_created_at: accountCreatedAt,
                current_date: currentDate,
                selected_month: `${monthName} ${selYear}`
            });
        }

        // Rule 8: If month is valid but NO DATA exists
        if (!hasData) {
            console.log(`================ [PDF REPORT DEBUG LOG] ================`);
            console.log(`  • Account Creation Date : ${accountCreatedAt} (YM: ${createdYM})`);
            console.log(`  • Current Date          : ${currentDate} (YM: ${currentYM})`);
            console.log(`  • Selected Month        : ${monthName} ${selYear} (YM: ${selectedYM})`);
            console.log(`  • Before Registration?  : ${isBeforeRegistration}`);
            console.log(`  • Is Future Month?      : ${isFutureMonth}`);
            console.log(`  • Does Data Exist?      : false (0 records)`);
            console.log(`  • PDF Generation Allowed: BLOCKED (No Data)`);
            console.log(`========================================================`);

            return res.status(404).json({
                error: "No financial activity found for this month.",
                blocked: true,
                reason: "NO_DATA",
                account_created_at: accountCreatedAt,
                current_date: currentDate,
                selected_month: `${monthName} ${selYear}`
            });
        }

        // PDF Generation ALLOWED
        console.log(`================ [PDF REPORT DEBUG LOG] ================`);
        console.log(`  • Account Creation Date : ${accountCreatedAt} (YM: ${createdYM})`);
        console.log(`  • Current Date          : ${currentDate} (YM: ${currentYM})`);
        console.log(`  • Selected Month        : ${monthName} ${selYear} (YM: ${selectedYM})`);
        console.log(`  • Before Registration?  : false`);
        console.log(`  • Is Future Month?      : false`);
        console.log(`  • Does Data Exist?      : true (${numRecordsFound} records)`);
        console.log(`  • PDF Generation Allowed: ALLOWED`);
        console.log(`========================================================`);

        const goals = await db.query('SELECT title, target_amount, current_amount, target_date FROM savings_goals WHERE user_id = ?', [userId]);
        const subs = await db.query('SELECT * FROM subscriptions WHERE user_id = ?', [userId]);

        // --- SECTION 1: SPENDING SUMMARY COMPUTATIONS ---
        const totalSpent = monthExpenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
        const daysInMonth = new Date(parseInt(yearParam), parseInt(monthParam), 0).getDate();
        const avgDailySpent = (totalSpent / daysInMonth).toFixed(2);

        // Fetch Previous Month Expenses for Comparison
        const prevDate = new Date(parseInt(yearParam, 10), parseInt(monthParam, 10) - 2, 1);
        const prevMonthParam = String(prevDate.getMonth() + 1).padStart(2, '0');
        const prevYearParam = String(prevDate.getFullYear());
        const prevYM = `${prevYearParam}-${prevMonthParam}`;
        const prevMonthName = monthNames[prevDate.getMonth()];

        const prevMonthExpenses = allExpenses.filter(e => e.date && String(e.date).startsWith(prevYM));
        const prevTotalSpent = prevMonthExpenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

        let momLabel = 'New spending pattern';
        let momPct = 0;
        if (prevMonthExpenses.length > 0 && prevTotalSpent > 0) {
            momPct = Math.round(((totalSpent - prevTotalSpent) / prevTotalSpent) * 100);
            momLabel = momPct >= 0 ? `+${momPct}% Increase` : `${momPct}% Decrease`;
        } else if (prevMonthExpenses.length === 0) {
            momLabel = 'No previous month data';
        }
        
        let highestExp = { title: 'N/A', amount: 0 };
        let lowestExp = { title: 'N/A', amount: Infinity };

        monthExpenses.forEach(e => {
            const amt = parseFloat(e.amount || 0);
            if (amt > highestExp.amount) highestExp = { title: e.title, amount: amt };
            if (amt < lowestExp.amount && amt > 0) lowestExp = { title: e.title, amount: amt };
        });

        if (lowestExp.amount === Infinity) lowestExp = { title: 'N/A', amount: 0 };

        // --- SECTION 2: CATEGORY BREAKDOWN COMPUTATIONS ---
        const catMap = {};
        monthExpenses.forEach(e => {
            const cat = e.category || 'Other';
            catMap[cat] = (catMap[cat] || 0) + parseFloat(e.amount || 0);
        });

        // --- SECTION 3: MOOD ANALYSIS COMPUTATIONS ---
        const moodMap = { 'Happy': 0, 'Stress': 0, 'Bored': 0, 'Excited': 0, 'Neutral': 0 };
        monthExpenses.forEach(e => {
            const m = (e.mood || 'Neutral');
            if (m.includes('Stress')) moodMap['Stress'] += parseFloat(e.amount || 0);
            else if (m.includes('Happy')) moodMap['Happy'] += parseFloat(e.amount || 0);
            else if (m.includes('Bored')) moodMap['Bored'] += parseFloat(e.amount || 0);
            else if (m.includes('Excit')) moodMap['Excited'] += parseFloat(e.amount || 0);
            else moodMap['Neutral'] += parseFloat(e.amount || 0);
        });

        // --- SECTION 4: HIDDEN EXPENSES COMPUTATIONS ---
        const hiddenMap = { 'Coffee and snacks': 0, 'Food delivery': 0, 'Transportation': 0, 'Entertainment': 0 };
        monthExpenses.forEach(e => {
            const cat = (e.category || '').toLowerCase();
            const title = (e.title || '').toLowerCase();
            const amt = parseFloat(e.amount || 0);

            if (title.includes('coffee') || title.includes('snack') || title.includes('cafe')) hiddenMap['Coffee and snacks'] += amt;
            else if (cat.includes('food') || title.includes('burger') || title.includes('pizza') || title.includes('swiggy') || title.includes('zomato')) hiddenMap['Food delivery'] += amt;
            else if (cat.includes('transport') || title.includes('cab') || title.includes('uber') || title.includes('ride')) hiddenMap['Transportation'] += amt;
            else if (cat.includes('entertainment') || title.includes('netflix') || title.includes('movie')) hiddenMap['Entertainment'] += amt;
        });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        // ================= COVER PAGE / HEADER =================
        doc.rect(0, 0, 595.28, 80).fill('#4f46e5');
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('PennyWise Monthly Report', 30, 18, { align: 'left' });
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#fcd34d').text(`Month: ${monthName} ${yearParam}`, 30, 44);
        
        const todayFormatted = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        doc.fontSize(9).font('Helvetica').fillColor('#c7d2fe').text(`Generated on: ${todayFormatted}  |  User: ${cleanPdfText(user.name)} (${user.email})`, 30, 60);

        let startY = 95;

        // ================= SECTION 1: SPENDING SUMMARY =================
        doc.roundedRect(30, startY, 535, 75, 6).fill('#f8fafc');
        doc.rect(30, startY, 4, 75).fill('#4f46e5');
        doc.fillColor('#1e1b4b').fontSize(11).font('Helvetica-Bold').text(`Section 1: Spending Summary (${monthName} ${yearParam})`, 42, startY + 8);
        
        doc.fontSize(9.5).font('Helvetica').fillColor('#334155');
        doc.text(`• Total Spent: `, 42, startY + 26, { continued: true }).font('Helvetica-Bold').fillColor('#dc2626').text(`${currLabel}${totalSpent.toFixed(2)}`);
        doc.font('Helvetica').fillColor('#334155').text(`• Average Daily Spending: `, 42, startY + 42, { continued: true }).font('Helvetica-Bold').fillColor('#4338ca').text(`${currLabel}${avgDailySpent} / day`);
        doc.font('Helvetica').fillColor('#334155').text(`• Highest Expense: `, 280, startY + 26, { continued: true }).font('Helvetica-Bold').fillColor('#b91c1c').text(`${cleanPdfText(highestExp.title)} (${currLabel}${highestExp.amount.toFixed(2)})`);
        doc.font('Helvetica').fillColor('#334155').text(`• Lowest Expense: `, 280, startY + 42, { continued: true }).font('Helvetica-Bold').fillColor('#047857').text(`${cleanPdfText(lowestExp.title)} (${currLabel}${lowestExp.amount.toFixed(2)})`);

        startY += 88;

        // ================= SECTION 2: MONTH-OVER-MONTH COMPARISON & VISUAL CHARTS =================
        doc.roundedRect(30, startY, 535, 78, 6).fill('#ecfdf5');
        doc.rect(30, startY, 4, 78).fill('#059669');
        doc.fillColor('#065f46').fontSize(11).font('Helvetica-Bold').text(`Section 2: Month-over-Month Comparison (${monthName} vs ${prevMonthName})`, 42, startY + 8);

        doc.fontSize(9).font('Helvetica').fillColor('#334155');
        doc.text(`• ${monthName} Total: `, 42, startY + 24, { continued: true }).font('Helvetica-Bold').fillColor('#dc2626').text(`${currLabel}${totalSpent.toFixed(2)}`);
        doc.font('Helvetica').fillColor('#334155').text(`• ${prevMonthName} Total: `, 280, startY + 24, { continued: true }).font('Helvetica-Bold').fillColor('#4f46e5').text(`${currLabel}${prevTotalSpent.toFixed(2)}`);
        doc.font('Helvetica').fillColor('#334155').text(`• Outflow Shift: `, 42, startY + 40, { continued: true }).font('Helvetica-Bold').fillColor(momPct > 0 ? '#b91c1c' : '#047857').text(`${momLabel}`);

        // Visual Comparison Progress Bars
        const maxOutflow = Math.max(totalSpent, prevTotalSpent, 1);
        const curBarWidth = Math.max(10, Math.floor((180 * totalSpent) / maxOutflow));
        const prevBarWidth = Math.max(10, Math.floor((180 * prevTotalSpent) / maxOutflow));

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text(`${monthName}:`, 42, startY + 58);
        doc.roundedRect(85, startY + 58, curBarWidth, 8, 4).fill('#ef4444');

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text(`${prevMonthName}:`, 280, startY + 58);
        doc.roundedRect(325, startY + 58, prevBarWidth, 8, 4).fill('#6366f1');

        startY += 90;

        // ================= SECTION 3: CATEGORY BREAKDOWN =================
        doc.roundedRect(30, startY, 535, 90, 6).fill('#ffffff');
        doc.rect(30, startY, 4, 90).fill('#10b981');
        doc.fillColor('#065f46').fontSize(11).font('Helvetica-Bold').text('Section 3: Category Breakdown', 42, startY + 8);
        
        let catY = startY + 24;
        const catEntries = Object.entries(catMap);
        if (catEntries.length === 0) {
            doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('No category spending recorded for this month.', 42, catY);
        } else {
            catEntries.forEach(([catName, amt]) => {
                doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1e293b').text(cleanPdfText(catName), 42, catY);
                doc.font('Helvetica').fillColor('#059669').text(`${currLabel}${amt.toFixed(2)}`, 200, catY, { width: 100, align: 'right' });
                catY += 14;
            });
        }

        startY += 102;

        // ================= SECTION 4: MOOD ANALYSIS =================
        doc.roundedRect(30, startY, 535, 75, 6).fill('#fbfbfe');
        doc.rect(30, startY, 4, 75).fill('#8b5cf6');
        doc.fillColor('#4c1d95').fontSize(11).font('Helvetica-Bold').text('Section 4: Mood Analysis', 42, startY + 8);
        
        doc.fontSize(9).font('Helvetica').fillColor('#334155');
        doc.text(`• Happy Purchases: `, 42, startY + 26, { continued: true }).font('Helvetica-Bold').fillColor('#10b981').text(`${currLabel}${moodMap['Happy'].toFixed(2)}`);
        doc.font('Helvetica').fillColor('#334155').text(`• Stress Purchases: `, 42, startY + 44, { continued: true }).font('Helvetica-Bold').fillColor('#ef4444').text(`${currLabel}${moodMap['Stress'].toFixed(2)}`);
        doc.font('Helvetica').fillColor('#334155').text(`• Bored Purchases: `, 280, startY + 26, { continued: true }).font('Helvetica-Bold').fillColor('#f59e0b').text(`${currLabel}${moodMap['Bored'].toFixed(2)}`);
        doc.font('Helvetica').fillColor('#334155').text(`• Excited Purchases: `, 280, startY + 44, { continued: true }).font('Helvetica-Bold').fillColor('#6366f1').text(`${currLabel}${moodMap['Excited'].toFixed(2)}`);

        startY += 87;

        // ================= SECTION 5: HIDDEN EXPENSES =================
        doc.roundedRect(30, startY, 535, 75, 6).fill('#fff7ed');
        doc.rect(30, startY, 4, 75).fill('#f97316');
        doc.fillColor('#9a3412').fontSize(11).font('Helvetica-Bold').text('Section 5: Hidden Expenses', 42, startY + 8);

        doc.fontSize(9).font('Helvetica').fillColor('#334155');
        doc.text(`• Coffee & Snacks: `, 42, startY + 26, { continued: true }).font('Helvetica-Bold').fillColor('#c2410c').text(`${currLabel}${hiddenMap['Coffee and snacks'].toFixed(2)}`);
        doc.font('Helvetica').fillColor('#334155').text(`• Food Delivery: `, 42, startY + 44, { continued: true }).font('Helvetica-Bold').fillColor('#c2410c').text(`${currLabel}${hiddenMap['Food delivery'].toFixed(2)}`);
        doc.font('Helvetica').fillColor('#334155').text(`• Transportation: `, 280, startY + 26, { continued: true }).font('Helvetica-Bold').fillColor('#c2410c').text(`${currLabel}${hiddenMap['Transportation'].toFixed(2)}`);
        doc.font('Helvetica').fillColor('#334155').text(`• Entertainment: `, 280, startY + 44, { continued: true }).font('Helvetica-Bold').fillColor('#c2410c').text(`${currLabel}${hiddenMap['Entertainment'].toFixed(2)}`);

        startY += 87;

        // ================= SECTION 6: DREAM-GOAL IMPACT =================
        doc.roundedRect(30, startY, 535, 85, 6).fill('#f0f9ff');
        doc.rect(30, startY, 4, 85).fill('#0284c7');
        doc.fillColor('#075985').fontSize(11).font('Helvetica-Bold').text('Section 6: Dream-Goal Impact', 42, startY + 8);

        let goalY = startY + 24;
        if (goals.length === 0) {
            doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('No active dream goals setup.', 42, goalY);
        } else {
            goals.forEach(g => {
                const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                const cleanTitle = cleanPdfText(g.title);
                doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0369a1').text(`${cleanTitle}: ${currLabel}${g.current_amount} / ${currLabel}${g.target_amount} (${pct}%)`, 42, goalY);
                goalY += 14;
            });
        }

        startY += 97;

        // ================= SECTION 7: AI RECOMMENDATIONS =================
        doc.roundedRect(30, startY, 535, 75, 6).fill('#f5f3ff');
        doc.rect(30, startY, 4, 75).fill('#7c3aed');
        doc.fillColor('#5b21b6').fontSize(11).font('Helvetica-Bold').text('Section 7: AI Recommendations & Action Plan', 42, startY + 8);

        doc.fontSize(8.5).font('Helvetica').fillColor('#334155');
        doc.text(`1. Areas to Save: Reduce food delivery & snack spending by 25% to save ${currLabel}${Math.round(totalSpent * 0.15)} next month.`, 42, startY + 24);
        doc.text(`2. Subscription Suggestions: Review unused recurring services to reclaim monthly cashflow.`, 42, startY + 38);
        doc.text(`3. Behavioral Advice: Notice stress spending triggers and set a 24-hour cooling-off rule for impulse items.`, 42, startY + 52);

        // Footer
        doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(`Generated by PennyWise AI Financial Platform | Report for ${monthName} ${yearParam}`, 30, 805, { align: 'center' });

        doc.end();
    } catch (err) {
        console.error('[PDF Gen Error]', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
