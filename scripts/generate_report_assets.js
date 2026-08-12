const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
    const assetsDir = path.join(__dirname, '..', 'report', 'assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    console.log("🚀 Launching Headless Chromium Browser...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 },
        deviceScaleFactor: 2
    });
    const page = await context.newPage();

    console.log("1. Navigating to Landing Page...");
    await page.goto('http://127.0.0.1:3000');
    await page.waitForTimeout(1000);

    // Capture Fig 4.2: Registration / Login Interface
    console.log("Capturing Fig 4.2: Auth Interface...");
    await page.evaluate(() => {
        if (typeof showAuthPage === 'function') showAuthPage();
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_2_auth.png') });

    // Perform API Login & Store Token
    console.log("Logging in via API...");
    const loginRes = await page.evaluate(async () => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'alex@finpilot.ai', password: 'password123' })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('pennywise_token', data.token);
            localStorage.setItem('pennywise_user', JSON.stringify(data.user));
            return true;
        }
        return false;
    });

    if (!loginRes) {
        console.error("Login failed!");
        process.exit(1);
    }

    console.log("Reloading authenticated dashboard...");
    await page.goto('http://127.0.0.1:3000');
    await page.waitForTimeout(1500);

    const gotoSec = async (secId) => {
        await page.evaluate((id) => {
            document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
            const el = document.getElementById(id);
            if (el) el.classList.add('active');
        }, secId);
        await page.waitForTimeout(1000);
    };

    // Capture Fig 4.1: PennyWise Dashboard
    console.log("Capturing Fig 4.1: Dashboard...");
    await gotoSec('sec-dashboard');
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_1_dashboard.png') });

    // Capture Fig 4.3: Expense Management Interface
    console.log("Capturing Fig 4.3: Expenses...");
    await gotoSec('sec-dashboard');
    await page.evaluate(() => {
        const expTbl = document.querySelector('.table-responsive');
        if (expTbl) expTbl.scrollIntoView();
    });
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_3_expenses.png') });

    // Capture Fig 4.4: Analytics and Mood Analysis
    console.log("Capturing Fig 4.4: Analytics...");
    await gotoSec('sec-analytics');
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_4_analytics.png') });

    // Capture Fig 4.5: AI Behavior Suite
    console.log("Capturing Fig 4.5: AI Suite...");
    await gotoSec('sec-ai-suite');
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_5_ai_suite.png') });

    // Capture Fig 4.6: Should I Buy It? Advisor Result
    console.log("Capturing Fig 4.6: Should I Buy It Advisor...");
    await gotoSec('sec-ai-suite');
    await page.evaluate(() => {
        const n = document.getElementById('sib-name');
        const p = document.getElementById('sib-price');
        if (n) n.value = 'Wireless Headphones';
        if (p) p.value = '120';
        if (typeof runShouldIBuyIt === 'function') runShouldIBuyIt();
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_6_buy_advisor.png') });

    // Capture Fig 4.7: Regret Predictor Result
    console.log("Capturing Fig 4.7: Regret Predictor...");
    await gotoSec('sec-ai-suite');
    await page.evaluate(() => {
        const i = document.getElementById('rp-item');
        const p = document.getElementById('rp-price');
        if (i) i.value = 'Designer Sneakers';
        if (p) p.value = '250';
        if (typeof runRegretPredictor === 'function') runRegretPredictor();
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_7_regret_predictor.png') });

    // Capture Fig 4.8: Dream Savings Goals
    console.log("Capturing Fig 4.8: Dream Savings Goals...");
    await gotoSec('sec-goals');
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_8_dream_goals.png') });

    // Capture Fig 4.9: Subscription Killer
    console.log("Capturing Fig 4.9: Subscription Killer...");
    await gotoSec('sec-subscriptions');
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_9_subscriptions.png') });

    // Capture Fig 4.10: Money Game, XP and Badges
    console.log("Capturing Fig 4.10: Gamification...");
    await gotoSec('sec-gamification');
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_10_gamification.png') });

    // Capture Fig 4.11: No-Spend Calendar
    console.log("Capturing Fig 4.11: No-Spend Calendar...");
    await gotoSec('sec-calendar');
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_11_nospend_calendar.png') });

    // Capture Fig 4.12: Monthly Report / PDF
    console.log("Capturing Fig 4.12: Monthly Report...");
    await gotoSec('sec-analytics');
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_12_monthly_report.png') });

    // Capture Fig 4.13: Profile and Deduction Management
    console.log("Capturing Fig 4.13: Profile...");
    await gotoSec('sec-profile');
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_13_profile.png') });

    // Capture Fig 4.14: Future Savings / Opportunity Cost Tools
    console.log("Capturing Fig 4.14: Future Savings & Opportunity Cost...");
    await gotoSec('sec-ai-suite');
    await page.evaluate(() => {
        const futSim = document.getElementById('future-savings-box') || document.querySelector('.glass-card');
        if (futSim) futSim.scrollIntoView();
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(assetsDir, 'fig_4_14_future_savings.png') });

    console.log("🎉 All 14 Screenshots Captured Successfully!");
    await browser.close();
}

captureScreenshots().catch(err => {
    console.error("Screenshot capture failed:", err);
    process.exit(1);
});
