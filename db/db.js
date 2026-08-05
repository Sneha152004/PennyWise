const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

let isPostgres = false;
let pgPool = null;
let sqliteDb = null;

// Determine if DATABASE_URL or PG connection string is provided
if (process.env.DATABASE_URL || process.env.PGDATABASE) {
    isPostgres = true;
    console.log('[DB] Connecting to PostgreSQL Database...');
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
    });
} else {
    console.log('[DB] Using local SQLite database (finpilot.db)...');
    const dbPath = path.join(__dirname, 'finpilot.db');
    sqliteDb = new sqlite3.Database(dbPath);
}

// Wrapper query execution for cross-database compatibility
async function query(sql, params = []) {
    if (isPostgres) {
        // Convert ? to $1, $2, etc. for PostgreSQL compatibility if needed
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await pgPool.query(pgSql, params);
        return res.rows;
    } else {
        return new Promise((resolve, reject) => {
            sql = sql.trim();
            if (sql.toUpperCase().startsWith('SELECT') || sql.toUpperCase().startsWith('PRAGMA')) {
                sqliteDb.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            } else {
                sqliteDb.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, changes: this.changes });
                });
            }
        });
    }
}

// Helper to execute raw multiline script
function execScript(script) {
    if (isPostgres) {
        return pgPool.query(script);
    } else {
        return new Promise((resolve, reject) => {
            sqliteDb.exec(script, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

// Initialize Database & Tables + Seed Data
async function initDb() {
    try {
        const schemaFile = isPostgres ? 'schema.postgres.sql' : 'schema.sqlite.sql';
        const schemaPath = path.join(__dirname, schemaFile);
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');

        await execScript(schemaContent);

        // Ensure missing columns on existing SQLite table user_settings are added
        try {
            await query(`ALTER TABLE user_settings ADD COLUMN country TEXT DEFAULT 'United States'`);
        } catch (e) { /* Column already exists */ }
        try {
            await query(`ALTER TABLE user_settings ADD COLUMN currency TEXT DEFAULT '$'`);
        } catch (e) { /* Column already exists */ }

        // Ensure missing columns on existing savings_goals table are added
        try {
            await query(`ALTER TABLE savings_goals ADD COLUMN theme TEXT DEFAULT 'tokyo'`);
        } catch (e) { /* Column already exists */ }
        try {
            await query(`ALTER TABLE savings_goals ADD COLUMN current_level INTEGER DEFAULT 1`);
        } catch (e) { /* Column already exists */ }
        try {
            await query(`ALTER TABLE savings_goals ADD COLUMN xp INTEGER DEFAULT 0`);
        } catch (e) { /* Column already exists */ }
        try {
            await query(`ALTER TABLE savings_goals ADD COLUMN unlocked_title TEXT DEFAULT 'Penny Beginner'`);
        } catch (e) { /* Column already exists */ }

        // Ensure missing columns on subscriptions table are migrated safely with valid literal defaults
        try { await query(`ALTER TABLE subscriptions ADD COLUMN category TEXT DEFAULT 'Entertainment'`); } catch (e) {}
        try { await query(`ALTER TABLE subscriptions ADD COLUMN renewal_date TEXT DEFAULT '2026-08-01'`); } catch (e) {}
        try { await query(`ALTER TABLE subscriptions ADD COLUMN last_used_date TEXT DEFAULT '2026-08-01'`); } catch (e) {}
        try { await query(`ALTER TABLE subscriptions ADD COLUMN current_month_uses INTEGER DEFAULT 1`); } catch (e) {}
        try { await query(`ALTER TABLE subscriptions ADD COLUMN total_months_subscribed INTEGER DEFAULT 1`); } catch (e) {}
        try { await query(`ALTER TABLE subscriptions ADD COLUMN value_score INTEGER DEFAULT 85`); } catch (e) {}
        try { await query(`ALTER TABLE subscriptions ADD COLUMN last_reset_month TEXT DEFAULT ''`); } catch (e) {}

        // Ensure default values on existing rows
        try {
            await query(`UPDATE subscriptions SET last_used_date = '2026-08-01' WHERE last_used_date IS NULL OR last_used_date = ''`);
            await query(`UPDATE subscriptions SET renewal_date = '2026-08-01' WHERE renewal_date IS NULL OR renewal_date = ''`);
            await query(`UPDATE subscriptions SET category = 'Entertainment' WHERE category IS NULL OR category = ''`);
        } catch (e) {
            console.error('[DB Migration Warning] Column backfill skipped:', e.message);
        }

        await query(`
            CREATE TABLE IF NOT EXISTS subscription_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subscription_id INTEGER,
                user_id INTEGER,
                month INTEGER,
                year INTEGER,
                total_uses INTEGER DEFAULT 0,
                total_cost REAL DEFAULT 0.00,
                average_cost_per_use REAL DEFAULT 0.00,
                value_score INTEGER DEFAULT 0,
                recommendation TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS savings_insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                month INTEGER,
                year INTEGER,
                hidden_expenses TEXT,
                potential_savings REAL DEFAULT 0.00,
                recommendations TEXT,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Verify subscriptions schema
        const pragmaInfo = await query(`PRAGMA table_info(subscriptions)`);
        const colNames = pragmaInfo.map(c => c.name);
        console.log('[DB] Verified subscriptions table columns:', colNames.join(', '));
        console.log('[DB] Tables initialized successfully.');

        // Seed initial data if empty
        const users = await query('SELECT * FROM users LIMIT 1');
        if (users.length === 0) {
            await seedData();
        }
    } catch (error) {
        console.error('[DB Error] Initialization failed:', error);
    }
}

async function seedData() {
    console.log('[DB] Seeding initial FinPilot AI data...');
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);

    // 1. Users
    await query(`
        INSERT INTO users (name, email, password_hash, role, xp, level_name)
        VALUES ('Alex Johnson', 'alex@finpilot.ai', ?, 'user', 480, 'Money Master')
    `, [defaultPasswordHash]);

    await query(`
        INSERT INTO users (name, email, password_hash, role, xp, level_name)
        VALUES ('Admin Demo', 'admin@finpilot.ai', ?, 'admin', 990, 'Millionaire')
    `, [defaultPasswordHash]);

    // User Settings
    await query(`
        INSERT INTO user_settings (user_id, country, currency, theme, monthly_income_target, impulse_timer_seconds)
        VALUES (1, 'United States', '$', 'dark', 5200.00, 30)
    `);

    // Fixed Deductions (Taxes, Insurance, EMI, Rent/Retirement)
    await query(`INSERT INTO deductions (user_id, title, amount, category, frequency) VALUES (1, 'Income Tax & Payroll', 780.00, 'Taxes', 'Monthly')`);
    await query(`INSERT INTO deductions (user_id, title, amount, category, frequency) VALUES (1, 'Health & Dental Insurance', 220.00, 'Insurance', 'Monthly')`);
    await query(`INSERT INTO deductions (user_id, title, amount, category, frequency) VALUES (1, '401(k) / Retirement Fund', 300.00, 'Retirement', 'Monthly')`);
    await query(`INSERT INTO deductions (user_id, title, amount, category, frequency) VALUES (1, 'Apartment Rent / Mortgage', 1200.00, 'Housing', 'Monthly')`);

    // Income
    await query(`INSERT INTO income (user_id, title, amount, category, frequency) VALUES (1, 'Tech Salary', 4800.00, 'Salary', 'Monthly')`);
    await query(`INSERT INTO income (user_id, title, amount, category, frequency) VALUES (1, 'Freelance UI Design', 400.00, 'Side Hustle', 'One-time')`);

    // Expenses (including mood, impulse, satisfaction score, carbon)
    const sampleExpenses = [
        [1, 'Groceries & Whole Foods', 142.50, 'Food & Groceries', 'Supermarket', 'Happy', 0, 9, 'Low', '2026-07-20'],
        [1, 'Bubble Tea & Snacks', 87.00, 'Dining & Drinks', 'Tea Station', 'Stressed', 1, 4, 'Medium', '2026-07-22'],
        [1, 'Uber Ride Home', 32.00, 'Transportation', 'Downtown', 'Stressed', 0, 6, 'High', '2026-07-24'],
        [1, 'Electronics & Gaming Gear', 320.00, 'Shopping', 'Amazon', 'Bored', 1, 4, 'Medium', '2026-07-25'],
        [1, 'Electric & Utility Bill', 95.00, 'Utilities', 'City Power', 'Neutral', 0, 10, 'Low', '2026-07-26'],
        [1, 'Coffee & Pastry', 6.00, 'Dining & Drinks', 'Local Cafe', 'Happy', 0, 8, 'Low', '2026-07-27'],
        [1, 'Weekend Restaurant Dinner', 78.00, 'Dining & Drinks', 'Bistro Restaurant', 'Excited', 0, 8, 'Medium', '2026-07-28'],
        [1, 'Micro Purchase - Snack', 4.00, 'Shopping', 'Convenience Store', 'Bored', 0, 5, 'Low', '2026-07-28'],
        [1, 'Micro Purchase - App Subscription', 6.00, 'Shopping', 'App Store', 'Bored', 0, 5, 'Low', '2026-07-28'],
        [1, 'Micro Purchase - Parking', 3.00, 'Transportation', 'City Lot', 'Neutral', 0, 7, 'Low', '2026-07-29']
    ];

    for (const exp of sampleExpenses) {
        await query(`
            INSERT INTO expenses (user_id, title, amount, category, location, mood, is_impulse, satisfaction_score, carbon_score, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, exp);
    }

    // Budgets
    await query(`INSERT INTO budgets (user_id, category, monthly_limit) VALUES (1, 'Food & Groceries', 600.00)`);
    await query(`INSERT INTO budgets (user_id, category, monthly_limit) VALUES (1, 'Dining & Drinks', 250.00)`);
    await query(`INSERT INTO budgets (user_id, category, monthly_limit) VALUES (1, 'Shopping', 300.00)`);
    await query(`INSERT INTO budgets (user_id, category, monthly_limit) VALUES (1, 'Transportation', 150.00)`);

    // Savings Goals (Dream Goals)
    await query(`
        INSERT INTO savings_goals (user_id, title, target_amount, current_amount, target_date, image_emoji)
        VALUES (1, 'Japan Trip 🎌', 5000.00, 3150.00, '2026-09-30', '✈️')
    `);
    await query(`
        INSERT INTO savings_goals (user_id, title, target_amount, current_amount, target_date, image_emoji)
        VALUES (1, 'Emergency Fund 🛡️', 10000.00, 6800.00, '2026-12-31', '🏦')
    `);

    // Shared Goals / Buddy
    await query(`
        INSERT INTO shared_goals (user_id, buddy_name, title, target_amount, user_progress_pct, buddy_progress_pct)
        VALUES (1, 'Sarah M.', 'European Summer Vacation', 2000.00, 63, 71)
    `);

    // Subscriptions
    await query(`INSERT INTO subscriptions (user_id, service_name, cost_per_month, last_used_days, is_flagged_unused) VALUES (1, 'Spotify Premium', 15.00, 42, 1)`);
    await query(`INSERT INTO subscriptions (user_id, service_name, cost_per_month, last_used_days, is_flagged_unused) VALUES (1, 'Netflix Standard', 18.00, 5, 0)`);
    await query(`INSERT INTO subscriptions (user_id, service_name, cost_per_month, last_used_days, is_flagged_unused) VALUES (1, 'Gym Membership', 45.00, 35, 1)`);
    await query(`INSERT INTO subscriptions (user_id, service_name, cost_per_month, last_used_days, is_flagged_unused) VALUES (1, 'Adobe Creative Cloud', 55.00, 18, 0)`);

    // Price Watch
    await query(`
        INSERT INTO price_watch (user_id, item_name, initial_price, current_price, alert_sent)
        VALUES (1, 'PlayStation 5 Pro', 520.00, 445.00, 1)
    `);
    await query(`
        INSERT INTO price_watch (user_id, item_name, initial_price, current_price, alert_sent)
        VALUES (1, 'Noise Cancelling Headphones', 280.00, 240.00, 0)
    `);

    // Achievements
    const badges = [
        ['no_shopping_30', 'No Shopping 30 Days', 'Zero non-essential shopping for 30 consecutive days', '🛍️', 150],
        ['saved_first_500', 'Saved First $500', 'Accumulated your first $500 in visual savings goals', '💰', 100],
        ['budget_streak_100', '100 Consecutive Budget Days', 'Log and stay under budget for 100 days', '🔥', 250],
        ['impulse_slayer', 'Impulse Slayer', 'Cancelled 5 impulse purchases via Countdown Lock', '🛡️', 200]
    ];
    for (const b of badges) {
        await query(`INSERT INTO achievements (badge_key, title, description, icon, xp_reward) VALUES (?, ?, ?, ?, ?)`, b);
        await query(`INSERT INTO user_achievements (user_id, badge_key) VALUES (1, ?)`, [b[0]]);
    }

    // Daily Challenges
    await query(`
        INSERT INTO challenges (user_id, title, potential_savings, xp_reward, is_completed)
        VALUES (1, 'Spend less than $8 on dining today', 15.00, 120, 0)
    `);
    await query(`
        INSERT INTO challenges (user_id, title, potential_savings, xp_reward, is_completed)
        VALUES (1, 'Avoid ordering food / takeout tonight', 18.00, 100, 1)
    `);

    // Notifications
    await query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (1, '🔥 Unused Subscription Alert', 'You havent used Spotify in 42 days. Cancel for $180/yr savings!', 'warning')
    `);
    await query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (1, '🏆 Weekly Spending Roast', 'You spent $87 on bubble tea this month. You are personally funding the tea industry! 🧋', 'roast')
    `);

    // Clean up any existing price drop notifications
    await query("DELETE FROM notifications WHERE type = 'price_drop' OR title LIKE '%Price Drop%'");


    console.log('[DB] Seed completed successfully!');
}

module.exports = {
    query,
    initDb
};
