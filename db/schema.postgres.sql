-- FinPilot AI PostgreSQL Production Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    xp INTEGER DEFAULT 150,
    level_name VARCHAR(50) DEFAULT 'Investor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Settings (with Country & Currency)
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    country VARCHAR(100) DEFAULT 'United States',
    currency VARCHAR(10) DEFAULT '$',
    theme VARCHAR(20) DEFAULT 'dark',
    monthly_income_target NUMERIC(12,2) DEFAULT 5000.00,
    impulse_timer_seconds INTEGER DEFAULT 30,
    roast_day VARCHAR(20) DEFAULT 'Sunday',
    notifications_enabled BOOLEAN DEFAULT true
);

-- Fixed Deductions (Taxes, Insurance, Rent, EMI, Retirement)
CREATE TABLE IF NOT EXISTS deductions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(50) DEFAULT 'Tax & Fixed',
    frequency VARCHAR(30) DEFAULT 'Monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login History
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Income
CREATE TABLE IF NOT EXISTS income (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(50) DEFAULT 'Salary',
    frequency VARCHAR(30) DEFAULT 'Monthly',
    date DATE DEFAULT CURRENT_DATE
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(30) DEFAULT 'fa-tag',
    color VARCHAR(20) DEFAULT '#6366f1',
    carbon_weight VARCHAR(20) DEFAULT 'Medium'
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    location VARCHAR(100) DEFAULT 'Online / General',
    mood VARCHAR(30) DEFAULT 'Neutral',
    is_impulse BOOLEAN DEFAULT false,
    satisfaction_score INTEGER DEFAULT NULL,
    carbon_score VARCHAR(20) DEFAULT 'Medium',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    monthly_limit NUMERIC(12,2) NOT NULL,
    alert_threshold INTEGER DEFAULT 80
);

-- Savings Goals
CREATE TABLE IF NOT EXISTS savings_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    target_amount NUMERIC(12,2) NOT NULL,
    current_amount NUMERIC(12,2) DEFAULT 0.00,
    target_date DATE,
    image_emoji VARCHAR(30) DEFAULT '🎯',
    theme VARCHAR(50) DEFAULT 'tokyo',
    current_level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    unlocked_title VARCHAR(100) DEFAULT 'Penny Beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shared Goals / Accountability Buddy
CREATE TABLE IF NOT EXISTS shared_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    buddy_name VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    target_amount NUMERIC(12,2) NOT NULL,
    user_progress_pct INTEGER DEFAULT 0,
    buddy_progress_pct INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    cost_per_month NUMERIC(10,2) NOT NULL,
    last_used_days INTEGER NOT NULL DEFAULT 0,
    is_flagged_unused BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'Active'
);

-- Price Watch
CREATE TABLE IF NOT EXISTS price_watch (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    initial_price NUMERIC(10,2) NOT NULL,
    current_price NUMERIC(10,2) NOT NULL,
    alert_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    badge_key VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(30) DEFAULT '🏆',
    xp_reward INTEGER DEFAULT 100
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_key VARCHAR(50) REFERENCES achievements(badge_key),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    potential_savings NUMERIC(10,2) DEFAULT 0.00,
    xp_reward INTEGER DEFAULT 50,
    is_completed BOOLEAN DEFAULT false,
    challenge_date DATE DEFAULT CURRENT_DATE
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    store_name VARCHAR(150),
    total_amount NUMERIC(10,2),
    items_json TEXT,
    receipt_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    report_type VARCHAR(30) DEFAULT 'Monthly',
    file_format VARCHAR(10) DEFAULT 'PDF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
