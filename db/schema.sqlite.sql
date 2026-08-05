-- FinPilot AI SQLite Local Database Schema

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    xp INTEGER DEFAULT 150,
    level_name TEXT DEFAULT 'Investor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY,
    country TEXT DEFAULT 'United States',
    currency TEXT DEFAULT '$',
    theme TEXT DEFAULT 'dark',
    monthly_income_target REAL DEFAULT 5000.00,
    impulse_timer_seconds INTEGER DEFAULT 30,
    roast_day TEXT DEFAULT 'Sunday',
    notifications_enabled INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deductions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT DEFAULT 'Tax & Fixed',
    frequency TEXT DEFAULT 'Monthly',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT DEFAULT 'Salary',
    frequency TEXT DEFAULT 'Monthly',
    date TEXT DEFAULT CURRENT_DATE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    icon TEXT DEFAULT 'fa-tag',
    color TEXT DEFAULT '#6366f1',
    carbon_weight TEXT DEFAULT 'Medium'
);

CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    location TEXT DEFAULT 'Online / General',
    mood TEXT DEFAULT 'Neutral',
    is_impulse INTEGER DEFAULT 0,
    satisfaction_score INTEGER DEFAULT NULL,
    carbon_score TEXT DEFAULT 'Medium',
    date TEXT DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT NOT NULL,
    monthly_limit REAL NOT NULL,
    alert_threshold INTEGER DEFAULT 80,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0.00,
    target_date TEXT,
    image_emoji TEXT DEFAULT '🎯',
    theme TEXT DEFAULT 'tokyo',
    current_level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    unlocked_title TEXT DEFAULT 'Penny Beginner',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shared_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    buddy_name TEXT NOT NULL,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    user_progress_pct INTEGER DEFAULT 0,
    buddy_progress_pct INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    service_name TEXT NOT NULL,
    category TEXT DEFAULT 'Entertainment',
    cost_per_month REAL NOT NULL,
    renewal_date TEXT DEFAULT CURRENT_DATE,
    last_used_date TEXT DEFAULT CURRENT_DATE,
    current_month_uses INTEGER DEFAULT 1,
    total_months_subscribed INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Active',
    value_score INTEGER DEFAULT 85,
    last_reset_month TEXT DEFAULT '',
    last_used_days INTEGER NOT NULL DEFAULT 0,
    is_flagged_unused INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

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
);

CREATE TABLE IF NOT EXISTS price_watch (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    item_name TEXT NOT NULL,
    initial_price REAL NOT NULL,
    current_price REAL NOT NULL,
    alert_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    badge_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🏆',
    xp_reward INTEGER DEFAULT 100
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    badge_key TEXT,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(badge_key) REFERENCES achievements(badge_key)
);

CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    potential_savings REAL DEFAULT 0.00,
    xp_reward INTEGER DEFAULT 50,
    is_completed INTEGER DEFAULT 0,
    challenge_date TEXT DEFAULT CURRENT_DATE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    store_name TEXT,
    total_amount REAL,
    items_json TEXT,
    receipt_date TEXT DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    report_type TEXT DEFAULT 'Monthly',
    file_format TEXT DEFAULT 'PDF',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
