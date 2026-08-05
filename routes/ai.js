const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken } = require('./auth');

// Helper to get user's currency preference
async function getUserCurrency(userId) {
    const settings = await db.query('SELECT currency FROM user_settings WHERE user_id = ?', [userId]);
    return settings[0]?.currency || '$';
}

// 1. Should I Buy It? Advisor
router.post('/should-i-buy', authenticateToken, async (req, res) => {
    try {
        const { item_name, price } = req.body;
        const userId = req.user.id;
        const currency = await getUserCurrency(userId);

        // Fetch income & expenses stats
        const settingsRows = await db.query('SELECT monthly_income_target FROM user_settings WHERE user_id = ?', [userId]);
        const incomeRows = await db.query('SELECT SUM(amount) as total FROM income WHERE user_id = ?', [userId]);
        const expenseRows = await db.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', [userId]);
        const goalsRows = await db.query('SELECT title, target_amount, current_amount FROM savings_goals WHERE user_id = ? LIMIT 1', [userId]);

        const targetInc = settingsRows[0]?.monthly_income_target || 5200;
        const totalIncome = (incomeRows[0]?.total !== null && incomeRows[0]?.total !== undefined && parseFloat(incomeRows[0].total) > 0) ? parseFloat(incomeRows[0].total) : parseFloat(targetInc);
        const totalExpenses = parseFloat(expenseRows[0]?.total || 0);
        const currentBalance = totalIncome - totalExpenses;

        const canAfford = currentBalance >= price;
        const goal = goalsRows[0] || { title: 'Europe Trip', target_amount: 5000, current_amount: 3150 };
        const monthlySavingsRate = Math.max(200, (totalIncome - totalExpenses) * 0.4);
        const delayMonths = Math.ceil(price / Math.max(1, (monthlySavingsRate / 30)) / 30);

        let recommendation = 'Yes';
        let warningMessage = `You can safely afford this purchase within your monthly budget!`;

        if (!canAfford) {
            recommendation = 'No';
            warningMessage = `This purchase exceeds your current available balance by ${currency}${(price - currentBalance).toFixed(2)}.`;
        } else if (price > currentBalance * 0.25) {
            recommendation = 'Probably Not';
            warningMessage = `Buying "${item_name}" today will delay your ${goal.title} goal by ~${delayMonths} months.`;
        }

        res.json({
            item_name,
            price,
            can_afford: canAfford,
            recommendation,
            explanation: warningMessage,
            current_balance: currentBalance,
            currency
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Regret Predictor Analysis
router.post('/predict-regret', authenticateToken, async (req, res) => {
    try {
        const { item_name, category, price } = req.body;
        const userId = req.user.id;
        const currency = await getUserCurrency(userId);

        // Fetch previous purchases in similar category with satisfaction score
        const pastPurchases = await db.query(`
            SELECT title, amount, satisfaction_score FROM expenses
            WHERE user_id = ? AND (category = ? OR is_impulse = 1) AND satisfaction_score IS NOT NULL
        `, [userId, category || 'Shopping']);

        let avgSatisfaction = 3.8;
        if (pastPurchases.length > 0) {
            const sum = pastPurchases.reduce((acc, curr) => acc + curr.satisfaction_score, 0);
            avgSatisfaction = (sum / pastPurchases.length).toFixed(1);
        }

        const isHighRisk = avgSatisfaction < 6.0 || price > 150;
        const prediction = isHighRisk ? "You're likely to regret this purchase." : "You're likely to enjoy this purchase.";
        const explanation = `Previous similar impulse or ${category} purchases had an average satisfaction score of ${avgSatisfaction}/10.`;

        res.json({
            prediction,
            average_satisfaction: avgSatisfaction,
            explanation,
            currency
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Opportunity Cost Calculator
router.post('/opportunity-cost', authenticateToken, async (req, res) => {
    try {
        const { item_name, price } = req.body;
        const p = parseFloat(price) || 6.00;
        const userId = req.user.id;
        const currency = await getUserCurrency(userId);

        const busRides = Math.floor(p / 1.50);
        const netflixMonths = (p / 18.00).toFixed(1);
        const lunches = (p / 12.00).toFixed(1);

        res.json({
            item_name: item_name || 'Coffee',
            price: p,
            currency,
            equivalents: [
                `${busRides} bus rides`,
                `${netflixMonths} Netflix monthly subscriptions`,
                `${lunches} days of lunch`
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Future Savings Simulator
router.post('/future-simulator', authenticateToken, async (req, res) => {
    try {
        const { category, reduction_pct } = req.body;
        const userId = req.user.id;
        const currency = await getUserCurrency(userId);
        const pct = parseFloat(reduction_pct) || 15;

        // Fetch monthly expense in target category
        const rows = await db.query(`
            SELECT SUM(amount) as total FROM expenses
            WHERE user_id = ? AND category LIKE ?
        `, [userId, `%${category || 'Food'}%`]);

        const monthlySpent = rows[0]?.total || 400.00;
        const monthlySavings = (monthlySpent * (pct / 100));
        const savings1Year = (monthlySavings * 12).toFixed(2);
        const savings5Years = (monthlySavings * 60).toFixed(2);

        res.json({
            category: category || 'Food & Dining',
            reduction_pct: pct,
            monthly_spent: monthlySpent,
            monthly_savings: monthlySavings.toFixed(2),
            savings_1_year: savings1Year,
            savings_5_years: savings5Years,
            currency
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Weekly Funny Spending Roast
router.get('/weekly-roast', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const currency = await getUserCurrency(userId);
        const topCategory = await db.query(`
            SELECT category, SUM(amount) as total FROM expenses
            WHERE user_id = ? GROUP BY category ORDER BY total DESC LIMIT 1
        `, [userId]);

        const cat = topCategory[0]?.category || 'Dining & Drinks';
        const total = topCategory[0]?.total || 87.00;

        const roasts = [
            `You spent ${currency}${total} on ${cat} recently. Congratulations! You're personally funding the ${cat} industry. 🧋`,
            `Your bank account looked at your ${currency}${total} ${cat} receipts and started hyperventilating. 💸`,
            `If spending money on ${cat} was an Olympic sport, you'd be taking home the gold medal this week! 🥇`
        ];

        const selectedRoast = roasts[Math.floor(Math.random() * roasts.length)];

        res.json({
            category: cat,
            total_spent: total,
            roast_message: selectedRoast,
            currency
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Hidden Expense Detector
router.get('/hidden-expenses', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const currency = await getUserCurrency(userId);
        const smallPurchases = await db.query(`
            SELECT id, title, amount, date FROM expenses
            WHERE user_id = ? AND amount <= 10.00
            ORDER BY date DESC LIMIT 10
        `, [userId]);

        const totalSmall = smallPurchases.reduce((acc, curr) => acc + curr.amount, 0);

        res.json({
            small_purchases: smallPurchases,
            total_this_month: totalSmall.toFixed(2),
            insight: `Tiny expenses accumulated to ${currency}${totalSmall.toFixed(2)} this month — costing more than your utility bill!`,
            currency
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Financial Time Machine
router.post('/time-machine', authenticateToken, async (req, res) => {
    try {
        const { monthly_habit_saving } = req.body;
        const userId = req.user.id;
        const currency = await getUserCurrency(userId);
        const savePerMonth = parseFloat(monthly_habit_saving) || 120;

        const m1 = savePerMonth;
        const m6 = savePerMonth * 6;
        const y1 = savePerMonth * 12;
        const y5 = savePerMonth * 60;

        let fundedItems = [];
        if (y5 >= 7000) fundedItems.push('🚘 Part of a car down payment');
        if (y1 >= 1400) fundedItems.push('✈️ A luxury vacation');
        if (m6 >= 700) fundedItems.push('💻 A brand new high-end laptop');
        if (m1 >= 100) fundedItems.push('📱 Smartphone upgrades or certifications');

        res.json({
            monthly_saving: savePerMonth,
            currency,
            timeline: {
                '1_month': m1,
                '6_months': m6,
                '1_year': y1,
                '5_years': y5
            },
            funded_items: fundedItems
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. AI Financial Coach Chat Assistant
router.post('/coach', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const msg = (message || '').toLowerCase().trim();
        const userId = req.user.id;
        const currency = await getUserCurrency(userId);

        // Fetch User Context
        const userRes = await db.query('SELECT name, xp, level_name FROM users WHERE id = ?', [userId]);
        const settingsRows = await db.query('SELECT monthly_income_target FROM user_settings WHERE user_id = ?', [userId]);
        const incomeRes = await db.query('SELECT SUM(amount) as total FROM income WHERE user_id = ?', [userId]);
        const deductionRes = await db.query('SELECT SUM(amount) as total FROM deductions WHERE user_id = ?', [userId]);
        const expenseRes = await db.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', [userId]);
        const topCatRes = await db.query(`
            SELECT category, SUM(amount) as total FROM expenses
            WHERE user_id = ? GROUP BY category ORDER BY total DESC LIMIT 1
        `, [userId]);
        const goals = await db.query('SELECT title, target_amount, current_amount FROM savings_goals WHERE user_id = ?', [userId]);
        const subs = await db.query('SELECT service_name, cost_per_month FROM subscriptions WHERE user_id = ?', [userId]);

        const userName = userRes[0]?.name || 'FinPilot Member';
        const targetInc = settingsRows[0]?.monthly_income_target || 5200;
        const inc = (incomeRes[0]?.total !== null && incomeRes[0]?.total !== undefined && parseFloat(incomeRes[0].total) > 0) ? parseFloat(incomeRes[0].total) : parseFloat(targetInc);
        const totalDeductions = parseFloat(deductionRes[0]?.total || 0);
        const netTakeHome = inc - totalDeductions;
        const exp = parseFloat(expenseRes[0]?.total || 0);
        const netSavings = netTakeHome - exp;
        const topCat = topCatRes[0]?.category || 'Shopping';
        const topCatAmount = parseFloat(topCatRes[0]?.total || 0);

        let reply = '';

        // 1. "How much more can I spend" / "Remaining spending limit"
        if (msg.includes('how much more') || msg.includes('can i spend') || msg.includes('remaining spend') || msg.includes('left to spend') || msg.includes('how much can i spend')) {
            const safeSpendLimit = Math.max(0, netSavings * 0.5);
            reply = `You currently have **${currency}${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}** remaining in your net monthly balance after your recorded expenses of ${currency}${exp.toLocaleString(undefined, { minimumFractionDigits: 2 })}. To protect your savings goals, we recommend keeping any additional spending below **${currency}${safeSpendLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}** (50% of your remaining net balance).`;
        }
        // 2. "How are my expenses doing" / "Expense status / overview"
        else if (msg.includes('how are my expenses') || msg.includes('expenses doing') || msg.includes('expense status') || msg.includes('spending status') || msg.includes('overall expenses')) {
            const spendPct = Math.round((exp / (netTakeHome || 1)) * 100);
            reply = `Your recorded expenses currently total **${currency}${exp.toLocaleString(undefined, { minimumFractionDigits: 2 })}**, which is **${spendPct}%** of your Net Take-Home Salary (${currency}${netTakeHome.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Your highest spending category is **${topCat}** at ${currency}${topCatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`;
        }
        // 3. Specific category queries (e.g. food, shopping, dining)
        else if (msg.includes('food') || msg.includes('dining') || msg.includes('eating') || msg.includes('groceries')) {
            const foodRes = await db.query(`SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND (category LIKE '%Food%' OR category LIKE '%Dining%')`, [userId]);
            const foodTotal = parseFloat(foodRes[0]?.total || 0);
            reply = `You have spent **${currency}${foodTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}** on Food & Dining this month. Cooking at home just twice a week could save you around ${currency}120.00/month!`;
        }
        else if (msg.includes('shopping')) {
            const shopRes = await db.query(`SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND category LIKE '%Shopping%'`, [userId]);
            const shopTotal = parseFloat(shopRes[0]?.total || 0);
            reply = `You have spent **${currency}${shopTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}** on Shopping this month. Trimming 15% off Shopping will add ${currency}${(shopTotal * 0.15).toFixed(2)} straight to your monthly net savings!`;
        }
        // 4. Greetings & Introductions
        else if (msg === 'hi' || msg === 'hello' || msg === 'hey' || msg.includes('who are you') || msg.includes('start') || msg.includes('help')) {
            reply = `Hello ${userName}! 👋 I am your AI Financial Coach. Right now your monthly take-home salary is ${currency}${netTakeHome.toLocaleString(undefined, { minimumFractionDigits: 2 })} and your net savings balance is ${currency}${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}. How can I help optimize your wealth, budgets, or goals today?`;
        } 
        // 5. Savings & Visual Goals
        else if (msg.includes('save') || msg.includes('saving') || msg.includes('invest') || msg.includes('goal') || msg.includes('wealth') || msg.includes('fund')) {
            if (goals.length > 0) {
                const goalSummaries = goals.map(g => `${g.title} (${Math.round((g.current_amount / g.target_amount) * 100)}% saved)`).join(', ');
                reply = `You currently have **${goals.length} active dream goals**: ${goalSummaries}. You have ${currency}${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })} in net monthly savings. Directing 30% (${currency}${(netSavings * 0.3).toFixed(2)}) on payday will fast-track your targets by months!`;
            } else {
                reply = `Your net monthly savings position is ${currency}${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Setting up a dedicated Dream Goal (like an Emergency Fund or Vacation Goal) will help automate your wealth accumulation!`;
            }
        }
        // 6. Subscriptions & Bills
        else if (msg.includes('subscription') || msg.includes('sub') || msg.includes('netflix') || msg.includes('spotify') || msg.includes('gym') || msg.includes('bill')) {
            const subTotal = subs.reduce((a, b) => a + parseFloat(b.cost_per_month), 0);
            if (subs.length > 0) {
                const subNames = subs.map(s => s.service_name).join(', ');
                reply = `You are currently tracking **${subs.length} subscriptions** (${subNames}) totaling **${currency}${subTotal.toFixed(2)}/month** (${currency}${(subTotal * 12).toFixed(2)}/year). Use our Subscription Killer to remove unused services and boost your monthly cash reserves!`;
            } else {
                reply = `You have no active subscriptions tracked right now! Keep monitoring your monthly recurring payments in Subscription Killer to avoid hidden cash drains.`;
            }
        }
        // 7. Income, Salary & Deductions
        else if (msg.includes('income') || msg.includes('salary') || msg.includes('deduction') || msg.includes('tax') || msg.includes('take-home') || msg.includes('pay')) {
            reply = `Here is your income breakdown: Gross Monthly Income Target is ${currency}${inc.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Fixed Deductions are ${currency}${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}, giving you a Net Take-Home Salary of **${currency}${netTakeHome.toLocaleString(undefined, { minimumFractionDigits: 2 })}**.`;
        }
        // 8. Impulse Buying & Advice on Buying
        else if (msg.includes('impulse') || msg.includes('regret') || msg.includes('buy') || msg.includes('habit') || msg.includes('mood') || msg.includes('lock')) {
            reply = `When feeling an urge to buy, use our **🚨 Impulse Purchase Lock**! It runs an economic check against your ${currency}${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })} net balance while a 30-second cooling-off timer lets your rational brain take over. Plus, skipping impulse buys earns you +20 XP!`;
        }
        // 9. Dynamic Intelligent Fallback for all other questions
        else {
            reply = `Regarding "${message}": Based on your financial profile (Net Take-Home: ${currency}${netTakeHome.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Net Savings Balance: ${currency}${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}), keeping monthly discretionary spending below ${currency}${(netTakeHome * 0.5).toFixed(0)} ensures steady financial growth. Ask me specifically about your spending limits, dream goals, or subscription savings!`;
        }

        res.json({ reply, currency });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;
