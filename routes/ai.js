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

// 2. Real Score-Based Regret Predictor Engine
router.post('/predict-regret', authenticateToken, async (req, res) => {
    try {
        const { item_name, itemName, item_title, category, price, amount, mood, current_mood } = req.body;
        const userId = req.user.id;
        const currency = await getUserCurrency(userId);

        const title = item_name || itemName || item_title || 'Purchase Item';
        const cost = parseFloat(price || amount || 0);
        const cat = category || 'Shopping';
        const currentMood = mood || current_mood || 'Neutral';

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const thisMonthYM = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        // Fetch User Settings & Income
        const settingsRes = await db.query('SELECT monthly_income_target FROM user_settings WHERE user_id = ?', [userId]);
        const incomeRes = await db.query('SELECT SUM(amount) as total FROM income WHERE user_id = ?', [userId]);
        const monthlyIncome = (incomeRes[0]?.total !== null && incomeRes[0]?.total !== undefined && parseFloat(incomeRes[0].total) > 0)
            ? parseFloat(incomeRes[0].total)
            : parseFloat(settingsRes[0]?.monthly_income_target || 5200);

        // Fetch Current Month Expenses
        const expRes = await db.query(`
            SELECT SUM(amount) as total FROM expenses
            WHERE user_id = ? AND (date LIKE ? OR created_at LIKE ?)
        `, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`]);
        const monthlyExpenses = parseFloat(expRes[0]?.total || 0);

        const reasons = [];

        // --- 1. INCOME RISK (25%) ---
        const priceRatio = monthlyIncome > 0 ? (cost / monthlyIncome) : 0.05;
        let incomeRisk = 10;
        if (priceRatio >= 0.20) {
            incomeRisk = 90;
            reasons.push(`Purchase price is ${Math.round(priceRatio * 100)}% of your monthly income (exceeds 20% high risk threshold).`);
        } else if (priceRatio >= 0.10) {
            incomeRisk = 60;
            reasons.push(`Purchase price accounts for ${Math.round(priceRatio * 100)}% of your monthly income.`);
        } else if (priceRatio >= 0.05) {
            incomeRisk = 30;
            reasons.push(`Purchase price accounts for ${Math.round(priceRatio * 100)}% of your monthly income.`);
        } else {
            incomeRisk = 10;
        }

        // --- 2. CATEGORY RISK (20%) ---
        const catExpRes = await db.query(`
            SELECT SUM(amount) as total FROM expenses
            WHERE user_id = ? AND category = ? AND (date LIKE ? OR created_at LIKE ?)
        `, [userId, cat, `${thisMonthYM}%`, `${thisMonthYM}%`]);
        const catMonthSpending = parseFloat(catExpRes[0]?.total || 0);
        const catRatio = monthlyIncome > 0 ? (catMonthSpending / monthlyIncome) : 0;
        let categoryRisk = 20;
        if (catRatio > 0.20) {
            categoryRisk = 80;
            reasons.push(`${cat} expenses already exceed 20% of your monthly income (${currency}${catMonthSpending.toFixed(0)} spent).`);
        } else if (catRatio >= 0.10) {
            categoryRisk = 50;
            reasons.push(`${cat} expenses account for ${Math.round(catRatio * 100)}% of your monthly income.`);
        } else {
            categoryRisk = 20;
        }

        // --- 3. MOOD RISK (15%) ---
        const moodScores = { 'Happy': 20, 'Neutral': 10, 'Excited': 40, 'Bored': 70, 'Stressed': 85 };
        let moodRisk = moodScores[currentMood] || 30;
        
        const impulseMoodRes = await db.query(`
            SELECT COUNT(*) as cnt FROM expenses
            WHERE user_id = ? AND mood = ? AND is_impulse = 1
        `, [userId, currentMood]);
        const impulseMoodCnt = impulseMoodRes[0]?.cnt || 0;
        if (impulseMoodCnt > 0) {
            moodRisk = Math.min(100, moodRisk + Math.min(15, impulseMoodCnt * 5));
        }
        if (moodRisk >= 70) {
            reasons.push(`Most purchases in this category happen when your mood is ${currentMood.toLowerCase()}.`);
        }

        // --- 4. IMPULSE RISK (15%) ---
        const impulseRes = await db.query(`
            SELECT COUNT(*) as cnt FROM expenses
            WHERE user_id = ? AND is_impulse = 1 AND (date LIKE ? OR created_at LIKE ?)
        `, [userId, `${thisMonthYM}%`, `${thisMonthYM}%`]);
        const impulseCount = impulseRes[0]?.cnt || 0;
        let impulseRisk = 10;
        if (impulseCount > 10) {
            impulseRisk = 90;
            reasons.push(`You made ${impulseCount} impulse purchases this month.`);
        } else if (impulseCount >= 6) {
            impulseRisk = 70;
            reasons.push(`You made ${impulseCount} impulse purchases this month.`);
        } else if (impulseCount >= 3) {
            impulseRisk = 40;
            reasons.push(`You made ${impulseCount} impulse purchases this month.`);
        } else {
            impulseRisk = 10;
        }

        // --- 5. DREAM GOAL RISK (15%) ---
        const goalRes = await db.query(`
            SELECT title, target_amount, current_amount FROM savings_goals
            WHERE user_id = ? ORDER BY id DESC LIMIT 1
        `, [userId]);
        const activeGoal = goalRes[0] || { title: 'Savings Target', target_amount: 100000, current_amount: 50000 };
        const netMonthlySavings = Math.max(300, (monthlyIncome - monthlyExpenses));
        const dailySavings = Math.max(10, netMonthlySavings / 30);
        const delayDays = Math.ceil(cost / dailySavings);
        
        let goalRisk = 10;
        if (delayDays > 7) {
            goalRisk = 80;
        } else if (delayDays >= 1) {
            goalRisk = 40;
        } else {
            goalRisk = 10;
        }
        const goalDelayText = `This purchase delays your ${activeGoal.title} goal by ${delayDays} days.`;
        reasons.push(goalDelayText);

        // --- 6. HISTORY RISK (10%) ---
        const historyRes = await db.query(`
            SELECT COUNT(*) as total, SUM(CASE WHEN is_impulse = 1 THEN 1 ELSE 0 END) as impulse_cnt
            FROM expenses WHERE user_id = ? AND category = ?
        `, [userId, cat]);
        const historyImpulseCnt = historyRes[0]?.impulse_cnt || 0;
        let historyRisk = 10;
        if (historyImpulseCnt >= 3) {
            historyRisk = 80;
            reasons.push(`Past ${cat} purchases show a frequent pattern of impulse buying.`);
        } else if (historyImpulseCnt >= 1) {
            historyRisk = 50;
            reasons.push(`Mixed purchasing history in the ${cat} category.`);
        } else {
            historyRisk = 10;
        }

        // --- CALCULATE TOTAL WEIGHTED REGRET SCORE (0–100) ---
        const rawRegretScore = Math.round(
            (0.25 * incomeRisk) +
            (0.20 * categoryRisk) +
            (0.15 * moodRisk) +
            (0.15 * impulseRisk) +
            (0.15 * goalRisk) +
            (0.10 * historyRisk)
        );
        const regretScore = Math.min(100, Math.max(0, rawRegretScore));

        // Determine Risk Level & Emojis
        let riskLevel = 'Low risk 🟢';
        let recommendationText = 'This purchase fits well within your financial habits and goals.';
        let predictionText = "You're likely to enjoy this purchase.";

        if (regretScore > 80) {
            riskLevel = 'Very high risk 🔴';
            predictionText = 'You will regret this purchase.'; // VALIDATION RULE: ONLY DISPLAYED IF REGRET SCORE > 80!
            recommendationText = 'Strong warning: High probability of post-purchase regret! We strongly advise against proceeding.';
        } else if (regretScore >= 61) {
            riskLevel = 'High risk 🟠';
            predictionText = "High chance of post-purchase regret.";
            recommendationText = 'Re-evaluate if this item is a true necessity before buying.';
        } else if (regretScore >= 31) {
            riskLevel = 'Moderate risk 🟡';
            predictionText = "Moderate risk of impulse regret.";
            recommendationText = 'Consider waiting 24 hours before buying to avoid potential impulse regret.';
        } else {
            riskLevel = 'Low risk 🟢';
            predictionText = "Low risk. Purchase aligns with your budget.";
            recommendationText = 'This purchase fits well within your financial habits and goals.';
        }

        res.json({
            regret_score: regretScore,
            score: regretScore,
            risk_level: riskLevel,
            prediction: predictionText,
            reasons: reasons,
            explanation: reasons.join(' '),
            goal_delay: goalDelayText,
            recommendation: recommendationText,
            components: {
                income_risk: incomeRisk,
                category_risk: categoryRisk,
                mood_risk: moodRisk,
                impulse_risk: impulseRisk,
                goal_risk: goalRisk,
                history_risk: historyRisk
            },
            currency
        });

    } catch (err) {
        console.error('[Regret Predictor Engine Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// Learning System Feedback Endpoint
router.post('/purchase-feedback', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { expense_id, purchase_title, regret_score, feedback } = req.body;
        
        if (!['Yes', 'Neutral', 'No'].includes(feedback)) {
            return res.status(400).json({ error: "Feedback must be 'Yes', 'Neutral', or 'No'." });
        }

        const result = await db.query(`
            INSERT INTO purchase_feedback (user_id, expense_id, purchase_title, regret_score, feedback)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, expense_id || null, purchase_title || 'Purchase', regret_score || 50, feedback]);

        res.json({
            message: "Thank you for your feedback! This feedback is stored to tune future regret predictions.",
            id: result.id
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
