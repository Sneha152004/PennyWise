# 💸 PennyWise — AI-Powered Financial Command Center & Behavioral Economics Platform

> An intelligent financial behavior platform combining real-time spend analytics, behavioral economics, impulse locks, mood tracking, and automated AI smart alerts.

---

## 🌟 Key Features

### 📊 1. AI Financial Command Center
- **Financial Health Score (0–100)**: Dynamic circular progress ring calculating overall financial stability using savings rates, impulse frequency, expense-to-income ratios, and mood stability.
- **Monthly Spending Trend**: Real-time spending comparison between current and previous months with percentage indicators (`↑ 87.5%` / `First month of usage`).
- **Largest Expense Categories**: Automatic grouping and ranking of top category drains (Shopping, Food & Groceries, Dining & Drinks).
- **Spending Insights Card**: Highlights highest expense, lowest expense, most frequent category, monthly transaction count, and average daily spending (`₹242/day`).
- **Interactive Weekly Trend Graph**: 7-day daily spending bar graph powered by Chart.js.

### 🧠 2. Data-Driven AI Smart Alerts
- **Category Spike Alert**: Triggers when spending in a category spikes compared to the previous month.
- **Mood Pattern Alert**: Detects emotional spending triggers (e.g. *"40% of purchases happened when bored"*).
- **Impulse Share Alert**: Warns when impulse purchases exceed healthy thresholds.
- **Weekend Overspending Alert**: Identifies weekend spending patterns.
- *Strict Rule: Alerts generate strictly from empirical database activity — no static mock alerts.*

### 🔐 3. Behavioral Control Suite
- **Impulse Purchase Lock**: Mandatory cooldown timer for non-essential purchases with a working "Still Buy" option and regret predictor.
- **Mood-Based Expense Logging**: Log purchases with emotional tags (`Happy`, `Stressed`, `Bored`, `Neutral`, `Calm`).
- **No-Spend Calendar**: Locked strictly to the current real-world month to track spend-free streaks.

### 📄 4. Monthly Report System & Validation
- **Account Validation Engine**: Ensures report generation is permitted strictly between the user's registration date and the current month.
- **Automated Validation Messages**:
  - Future month selected: *"Monthly reports are not available for future months."*
  - Pre-registration month selected: *"You did not have a PennyWise account during this month."*
  - Valid month with no data: *"No financial activity found for this month."*
- **PDF Export**: Generates comprehensive PDF reports with category breakdowns, financial health scores, and subscription analysis.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3 / PostgreSQL compatible schema
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS Design System with Glassmorphism & Canvas Particle FX
- **Data Visualization**: Chart.js
- **Document Generation**: PDFKit
- **Testing**: Jest (Unit & Integration E2E Test Suite)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sneha152004/PennyWise.git
   cd PennyWise
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

4. **Access the platform**:
   Open your browser and navigate to: **`http://localhost:3000`**

---

## 🧪 Running Automated Tests

Run the complete test suite (27 unit & E2E integration tests):

```bash
npm test
```

---

## 📁 Project Structure

```
PennyWise/
├── db/
│   ├── db.js                 # Database wrapper & connection pool
│   ├── schema.sqlite.sql     # SQLite database schema definition
│   └── schema.postgres.sql   # PostgreSQL production schema
├── routes/
│   ├── auth.js               # Registration, Login, JWT & Account cleanup
│   ├── dashboard.get.js      # Financial Command Center & AI Alerts calculations
│   ├── expenses.js           # Expense management & date validation
│   ├── ai.js                 # Regret predictor & opportunity cost simulator
│   ├── subscriptions.js      # Unused subscription detection
│   └── gamification.js       # XP, levels, and achievement badges
├── public/
│   ├── index.html            # Single Page Application (SPA) layout
│   ├── css/
│   │   └── styles.css        # Glassmorphism design system & utility classes
│   └── js/
│       ├── app.js            # SPA controller & dynamic DOM renderer
│       └── theme-engine.js   # Dark mode styling engine
├── tests/
│   ├── unit/                 # Auth, Expenses, Budget & AI Unit tests
│   └── integration/          # System Integration E2E workflows
├── server.js                 # Express application server entrypoint
└── README.md
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
