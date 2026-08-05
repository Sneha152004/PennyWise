const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken } = require('./auth');

/**
 * Intelligent Subscription Analytics & Status Evaluator
 */
function computeSubscriptionAnalytics(sub) {
    const today = new Date();
    const lastUsed = sub.last_used_date ? new Date(sub.last_used_date) : today;
    const diffTime = Math.max(0, today - lastUsed);
    const daysSinceLastUse = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let status = 'Active';
    let recommendation = 'Keep subscription';
    let valueScore = 85;

    if (daysSinceLastUse <= 7) {
        status = 'Active';
        recommendation = 'Keep subscription';
        valueScore = Math.max(85, 100 - (daysSinceLastUse * 2));
    } else if (daysSinceLastUse <= 15) {
        status = 'Moderate usage';
        recommendation = 'Keep subscription';
        valueScore = Math.max(60, 84 - ((daysSinceLastUse - 8) * 3));
    } else if (daysSinceLastUse <= 30) {
        status = 'Low usage';
        recommendation = 'Review subscription';
        valueScore = Math.max(30, 59 - ((daysSinceLastUse - 16) * 2));
    } else {
        status = 'Unused';
        recommendation = 'Consider cancelling';
        valueScore = Math.max(0, 29 - Math.min(29, Math.floor((daysSinceLastUse - 30) / 2)));
    }

    const currentUses = sub.current_month_uses || 0;
    const costPerMonth = parseFloat(sub.cost_per_month || 0);
    const costPerUse = currentUses > 0 ? (costPerMonth / currentUses) : costPerMonth;

    return {
        days_since_last_use: daysSinceLastUse,
        status,
        recommendation,
        value_score: valueScore,
        cost_per_use: parseFloat(costPerUse.toFixed(2))
    };
}

/**
 * Automatic Monthly Reset Engine
 * Archives previous month data into subscription_history & resets monthly counters
 */
async function checkAndExecuteMonthlyReset(userId) {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthNum = now.getMonth() + 1;
    const yearNum = now.getFullYear();

    const subs = await db.query('SELECT * FROM subscriptions WHERE user_id = ?', [userId]);

    for (const sub of subs) {
        if (sub.last_reset_month !== currentYearMonth) {
            // Archive previous month data if last_reset_month was set
            if (sub.last_reset_month) {
                const totalCost = parseFloat(sub.cost_per_month || 0);
                const uses = sub.current_month_uses || 0;
                const avgCostPerUse = uses > 0 ? (totalCost / uses) : totalCost;
                const analytics = computeSubscriptionAnalytics(sub);

                await db.query(`
                    INSERT INTO subscription_history (subscription_id, user_id, month, year, total_uses, total_cost, average_cost_per_use, value_score, recommendation)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    sub.id,
                    userId,
                    monthNum === 1 ? 12 : monthNum - 1,
                    monthNum === 1 ? yearNum - 1 : yearNum,
                    uses,
                    totalCost,
                    avgCostPerUse.toFixed(2),
                    analytics.value_score,
                    analytics.recommendation
                ]);
            }

            // Reset current month's statistics for the new month
            await db.query(`
                UPDATE subscriptions
                SET current_month_uses = 0,
                    total_months_subscribed = total_months_subscribed + 1,
                    last_reset_month = ?
                WHERE id = ?
            `, [currentYearMonth, sub.id]);
        }
    }
}

// GET /api/subscriptions - List subscriptions with intelligent analytics
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await checkAndExecuteMonthlyReset(userId);

        const subs = await db.query('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY cost_per_month DESC', [userId]);

        const processedSubs = subs.map(s => {
            const analytics = computeSubscriptionAnalytics(s);
            return {
                ...s,
                ...analytics
            };
        });

        const unused = processedSubs.filter(s => s.status === 'Unused' || s.days_since_last_use > 15);
        const totalMonthlySpending = processedSubs.reduce((acc, curr) => acc + parseFloat(curr.cost_per_month), 0);
        const totalYearlySavings = unused.reduce((acc, curr) => acc + (parseFloat(curr.cost_per_month) * 12), 0);

        // Generate AI Insights
        const insights = [];
        processedSubs.forEach(s => {
            if (s.days_since_last_use >= 20) {
                insights.push(`${s.service_name} has not been used in ${s.days_since_last_use} days.`);
            }
            if (s.status === 'Unused' || s.status === 'Low usage') {
                insights.push(`You can save ${s.cost_per_month}/month by cancelling ${s.service_name}.`);
            }
        });

        const activeGoal = await db.query('SELECT * FROM savings_goals WHERE user_id = ? AND current_amount < target_amount LIMIT 1', [userId]);
        if (activeGoal.length > 0 && totalYearlySavings > 0) {
            insights.push(`Reducing subscriptions could help you complete your ${activeGoal[0].title} 1 month earlier.`);
        }

        res.json({
            subscriptions: processedSubs,
            unused_count: unused.length,
            total_monthly_spending: totalMonthlySpending.toFixed(2),
            potential_yearly_savings: totalYearlySavings.toFixed(2),
            ai_insights: insights
        });
    } catch (err) {
        console.error('[API Error /api/subscriptions]:', err);
        res.status(500).json({ error: 'Database query failed in subscription module.' });
    }
});

// POST /api/subscriptions - Add new subscription with category & renewal date
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { service_name, category, cost_per_month, renewal_date, last_used_date } = req.body;
        const userId = req.user.id;

        const cost = parseFloat(cost_per_month);
        if (!service_name || isNaN(cost) || cost <= 0) {
            return res.status(400).json({ error: 'Please provide a valid subscription name and monthly cost.' });
        }

        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const cat = category || 'Entertainment';
        const renewDate = renewal_date || now.toISOString().split('T')[0];
        const lastUsed = last_used_date || now.toISOString().split('T')[0];

        const tempSub = { last_used_date: lastUsed, current_month_uses: 1, cost_per_month: cost };
        const analytics = computeSubscriptionAnalytics(tempSub);

        const result = await db.query(`
            INSERT INTO subscriptions (user_id, service_name, category, cost_per_month, renewal_date, last_used_date, current_month_uses, total_months_subscribed, status, value_score, last_reset_month)
            VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
        `, [userId, service_name.trim(), cat, cost, renewDate, lastUsed, analytics.status, analytics.value_score, currentYearMonth]);

        res.json({ message: 'New subscription added successfully!', id: result.id });
    } catch (err) {
        console.error('[API Error /api/subscriptions]:', err);
        res.status(500).json({ error: 'Database query failed in subscription module.' });
    }
});

// PUT /api/subscriptions/:id - Mark used or update subscription details
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const subId = req.params.id;
        const { mark_used, service_name, category, cost_per_month, renewal_date, last_used_date } = req.body;

        if (mark_used) {
            const todayStr = new Date().toISOString().split('T')[0];
            await db.query(`
                UPDATE subscriptions
                SET last_used_date = ?, current_month_uses = current_month_uses + 1
                WHERE id = ? AND user_id = ?
            `, [todayStr, subId, userId]);
        } else {
            if (service_name) await db.query('UPDATE subscriptions SET service_name = ? WHERE id = ? AND user_id = ?', [service_name, subId, userId]);
            if (category) await db.query('UPDATE subscriptions SET category = ? WHERE id = ? AND user_id = ?', [category, subId, userId]);
            if (cost_per_month) await db.query('UPDATE subscriptions SET cost_per_month = ? WHERE id = ? AND user_id = ?', [cost_per_month, subId, userId]);
            if (renewal_date) await db.query('UPDATE subscriptions SET renewal_date = ? WHERE id = ? AND user_id = ?', [renewal_date, subId, userId]);
            if (last_used_date) await db.query('UPDATE subscriptions SET last_used_date = ? WHERE id = ? AND user_id = ?', [last_used_date, subId, userId]);
        }

        res.json({ message: 'Subscription updated successfully!' });
    } catch (err) {
        console.error('[API Error /api/subscriptions]:', err);
        res.status(500).json({ error: 'Database query failed in subscription module.' });
    }
});

// GET /api/subscriptions/:id/analytics - Detailed Usage Analytics for Modal Popup
router.get('/:id/analytics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const subId = req.params.id;

        const subs = await db.query('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?', [subId, userId]);
        if (subs.length === 0) {
            return res.status(404).json({ error: 'Subscription not found.' });
        }

        const sub = subs[0];
        const analytics = computeSubscriptionAnalytics(sub);

        const history = await db.query(`
            SELECT * FROM subscription_history 
            WHERE subscription_id = ? AND user_id = ? 
            ORDER BY year DESC, month DESC
        `, [subId, userId]);

        const monthsSubscribed = Math.max(1, sub.total_months_subscribed || 1);
        const monthlyCost = parseFloat(sub.cost_per_month || 0);
        const totalMoneySpent = monthsSubscribed * monthlyCost;

        res.json({
            subscription: {
                ...sub,
                ...analytics
            },
            months_subscribed: monthsSubscribed,
            total_money_spent: totalMoneySpent.toFixed(2),
            average_cost_per_use: analytics.cost_per_use,
            usage_history: history,
            recommendation_score: analytics.value_score,
            savings_if_cancelled: (monthlyCost * 12).toFixed(2)
        });
    } catch (err) {
        console.error('[API Error /api/subscriptions]:', err);
        res.status(500).json({ error: 'Database query failed in subscription module.' });
    }
});

// DELETE /api/subscriptions/:id - Remove subscription
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const subId = req.params.id;

        const subs = await db.query('SELECT service_name, cost_per_month FROM subscriptions WHERE id = ? AND user_id = ?', [subId, userId]);
        if (subs.length === 0) {
            return res.status(404).json({ error: 'Subscription not found.' });
        }

        const sub = subs[0];
        const monthlyCost = parseFloat(sub.cost_per_month);
        const yearlyCost = monthlyCost * 12;

        await db.query('DELETE FROM subscriptions WHERE id = ? AND user_id = ?', [subId, userId]);

        res.json({
            message: `Removed ${sub.service_name}!`,
            service_name: sub.service_name,
            monthly_savings: monthlyCost,
            yearly_savings: yearlyCost
        });
    } catch (err) {
        console.error('[API Error /api/subscriptions]:', err);
        res.status(500).json({ error: 'Database query failed in subscription module.' });
    }
});

// GET /api/subscriptions/savings-opportunities - Real Data Analytical Engine & Insights (supports month & year)
router.get('/savings-opportunities', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        let now = new Date();
        if (req.query.year && req.query.month) {
            now = new Date(parseInt(req.query.year, 10), parseInt(req.query.month, 10) - 1, 1);
        }
        
        const nowYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

        // 1. Fetch user expenses & resilient date filtering
        const userExpenses = await db.query(`SELECT * FROM expenses WHERE user_id = ?`, [userId]);
        const subs = await db.query('SELECT * FROM subscriptions WHERE user_id = ?', [userId]);
        const goals = await db.query('SELECT * FROM savings_goals WHERE user_id = ? AND current_amount < target_amount', [userId]);

        const currentMonthExpenses = userExpenses.filter(e => {
            if (!e.date) return false;
            return String(e.date).substring(0, 7) === nowYM;
        });

        const prevMonthExpenses = userExpenses.filter(e => {
            if (!e.date) return false;
            return String(e.date).substring(0, 7) === prevYM;
        });

        // Fallback for single-month or test databases where all expenses exist in user record
        let activeCurrentExpenses = currentMonthExpenses;
        if (activeCurrentExpenses.length === 0 && userExpenses.length > 0) {
            activeCurrentExpenses = userExpenses;
        }

        // 2. Group expenses into 11 Categories & automatic keyword mapping (Requirement 10)
        const catTotals = {
            'Food Delivery': { icon: '🍕', amount: 0 },
            'Coffee & Tea': { icon: '☕', amount: 0 },
            'Shopping': { icon: '🛍️', amount: 0 },
            'In-App Purchases & Gaming': { icon: '🎮', amount: 0 },
            'Cabs & Rides': { icon: '🚕', amount: 0 },
            'Entertainment': { icon: '🎬', amount: 0 },
            'Groceries': { icon: '🛒', amount: 0 },
            'Education': { icon: '🎓', amount: 0 },
            'Health': { icon: '💊', amount: 0 },
            'Travel': { icon: '✈️', amount: 0 },
            'Other': { icon: '📦', amount: 0 }
        };

        let currentTotalOutflow = 0;
        activeCurrentExpenses.forEach(e => {
            const cat = (e.category || '').toLowerCase();
            const title = (e.title || '').toLowerCase();
            const amt = parseFloat(e.amount || 0);
            currentTotalOutflow += amt;

            if (title.includes('coffee') || title.includes('cafe') || title.includes('starbucks') || title.includes('latte') || title.includes('tea') || cat.includes('coffee')) {
                catTotals['Coffee & Tea'].amount += amt;
            } else if (cat.includes('food') || cat.includes('dining') || title.includes('food') || title.includes('burger') || title.includes('pizza') || title.includes('doordash') || title.includes('uber eats') || title.includes('swiggy') || title.includes('zomato')) {
                catTotals['Food Delivery'].amount += amt;
            } else if (cat.includes('grocery') || cat.includes('groceries') || title.includes('supermarket') || title.includes('market')) {
                catTotals['Groceries'].amount += amt;
            } else if (cat.includes('gaming') || title.includes('steam') || title.includes('playstation') || title.includes('xbox') || title.includes('in-app') || title.includes('store')) {
                catTotals['In-App Purchases & Gaming'].amount += amt;
            } else if (cat.includes('shopping') || title.includes('shopping') || title.includes('amazon') || title.includes('clothing') || title.includes('apparel')) {
                catTotals['Shopping'].amount += amt;
            } else if (cat.includes('transport') || title.includes('cab') || title.includes('uber') || title.includes('lyft') || title.includes('taxi') || title.includes('ola') || title.includes('rides')) {
                catTotals['Cabs & Rides'].amount += amt;
            } else if (cat.includes('entertainment') || title.includes('netflix') || title.includes('movie') || title.includes('cinema') || title.includes('show') || title.includes('event')) {
                catTotals['Entertainment'].amount += amt;
            } else if (cat.includes('education') || title.includes('course') || title.includes('book') || title.includes('tuition')) {
                catTotals['Education'].amount += amt;
            } else if (cat.includes('health') || title.includes('doctor') || title.includes('pharmacy') || title.includes('fitness')) {
                catTotals['Health'].amount += amt;
            } else if (cat.includes('travel') || title.includes('flight') || title.includes('hotel') || title.includes('trip')) {
                catTotals['Travel'].amount += amt;
            } else {
                catTotals['Other'].amount += amt;
            }
        });

        // 3. Previous month totals for comparison
        let prevTotalOutflow = 0;
        let prevShoppingSpending = 0;
        prevMonthExpenses.forEach(e => {
            const cat = (e.category || '').toLowerCase();
            const title = (e.title || '').toLowerCase();
            const amt = parseFloat(e.amount || 0);
            prevTotalOutflow += amt;
            if (cat.includes('shopping') || title.includes('amazon') || title.includes('clothing')) {
                prevShoppingSpending += amt;
            }
        });

        // 4. Trend Label calculation (Requirement 4 & 9)
        let trend = "No previous data";
        let changePct = 0;

        if (prevMonthExpenses.length === 0) {
            trend = activeCurrentExpenses.length > 0 && currentMonthExpenses.length > 0 ? "New spending pattern" : "No previous data";
        } else {
            if (!prevTotalOutflow || prevTotalOutflow === 0) {
                trend = "No previous data";
            } else {
                changePct = Math.round(((currentTotalOutflow - prevTotalOutflow) / prevTotalOutflow) * 100);
                trend = changePct >= 0 ? `+${changePct}% increase` : `${changePct}% decrease`;
            }
        }

        // Filter out categories with 0.00 spending (Requirement 8)
        const activeCategories = Object.entries(catTotals)
            .filter(([name, data]) => data.amount > 0)
            .map(([name, data]) => ({
                name,
                icon: data.icon,
                amount: parseFloat(data.amount.toFixed(2))
            }))
            .sort((a, b) => b.amount - a.amount);

        const top3Categories = activeCategories.slice(0, 3);
        const top5Categories = activeCategories.slice(0, 5);

        // 5. Console logs (Requirement 11)
        console.log(`[Savings Engine] Total expenses found: ${userExpenses.length}`);
        console.log(`[Savings Engine] Current month total: ${currentTotalOutflow.toFixed(2)}`);
        console.log(`[Savings Engine] Last month total: ${prevTotalOutflow.toFixed(2)}`);
        console.log(`[Savings Engine] Categories found: ${activeCategories.map(c => `${c.name}: ${c.amount}`).join(', ')}`);

        // 6. Generate Dynamic Insights
        const insights = [];
        if (catTotals['Food Delivery'].amount > 0) {
            insights.push(`You spent ₹${catTotals['Food Delivery'].amount.toFixed(0)} on food delivery this month.`);
        }
        if (prevShoppingSpending > 0 && catTotals['Shopping'].amount > prevShoppingSpending) {
            const shopIncPct = Math.round(((catTotals['Shopping'].amount - prevShoppingSpending) / prevShoppingSpending) * 100);
            insights.push(`Shopping expenses increased by ${shopIncPct}% compared to last month.`);
        }
        if (catTotals['Entertainment'].amount > 0) {
            const entSave = Math.round(catTotals['Entertainment'].amount * 0.2);
            if (entSave > 0) {
                insights.push(`Reducing entertainment spending by 20% could save ₹${entSave}.`);
            }
        }

        // Unused Subscriptions & Potential Savings
        let unusedSubSavings = 0;
        subs.forEach(s => {
            const analytics = computeSubscriptionAnalytics(s);
            if (analytics.days_since_last_use >= 30 || analytics.status === 'Unused') {
                unusedSubSavings += parseFloat(s.cost_per_month || 0);
            }
        });

        const reducibleExpenses = Math.round(
            (catTotals['Food Delivery'].amount * 0.4) +
            (catTotals['Coffee & Tea'].amount * 0.5) +
            (catTotals['Shopping'].amount * 0.5) +
            ((catTotals['In-App Purchases & Gaming'].amount + catTotals['Cabs & Rides'].amount) * 0.5)
        );

        const totalPotentialMonthlySavings = Math.round(unusedSubSavings + reducibleExpenses);

        // Goal Acceleration Impact
        const goalImpacts = goals.map(g => {
            const remaining = parseFloat(g.target_amount) - parseFloat(g.current_amount);
            const currentRate = Math.max(500, parseFloat(g.current_amount || 500));
            const monthsEarlier = totalPotentialMonthlySavings > 0
                ? Math.max(1, Math.min(6, Math.ceil((remaining / currentRate) - (remaining / (currentRate + totalPotentialMonthlySavings)))))
                : 0;

            if (monthsEarlier > 0) {
                insights.push(`Your ${g.title} could be completed ${monthsEarlier} month${monthsEarlier > 1 ? 's' : ''} earlier.`);
            }

            return {
                goal_id: g.id,
                title: g.title,
                theme: g.theme,
                months_earlier: monthsEarlier
            };
        });

        if (insights.length === 0) {
            insights.push('Track expenses daily to generate personalized AI financial insights.');
        }

        // Store Analytics in savings_insights table
        try {
            await db.query(`
                INSERT INTO savings_insights (user_id, month, year, hidden_expenses, potential_savings, recommendations)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                userId,
                now.getMonth() + 1,
                now.getFullYear(),
                JSON.stringify(catTotals),
                totalPotentialMonthlySavings,
                JSON.stringify(insights)
            ]);
        } catch (e) {
            console.error('[DB Savings Insights Notice]:', e.message);
        }

        // Return payload with both camelCase & snake_case (Requirement 8)
        res.json({
            currentMonthTotal: parseFloat(currentTotalOutflow.toFixed(2)),
            current_month_total: parseFloat(currentTotalOutflow.toFixed(2)),

            lastMonthTotal: parseFloat(prevTotalOutflow.toFixed(2)),
            last_month_total: parseFloat(prevTotalOutflow.toFixed(2)),
            prev_month_total: parseFloat(prevTotalOutflow.toFixed(2)),

            trend: trend,
            comparison_label: trend,
            change_pct: changePct,

            categoryBreakdown: activeCategories,
            active_categories: activeCategories,
            top_3_categories: top3Categories,
            top_5_categories: top5Categories,

            total_potential_savings: totalPotentialMonthlySavings,
            potentialSavings: totalPotentialMonthlySavings,

            reducible_expenses: reducibleExpenses,
            unused_sub_savings: unusedSubSavings,
            insights: insights,
            recommendations: insights,
            goal_impacts: goalImpacts
        });
    } catch (err) {
        console.error('[API Error /api/subscriptions/savings-opportunities]:', err);
        res.status(500).json({ error: 'Failed to generate savings opportunities analysis.' });
    }
});

module.exports = router;
