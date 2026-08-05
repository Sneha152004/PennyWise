// PennyWise - Single Page Application Frontend Controller

let currentCurrency = '$';
let currentCountry = 'United States';
let currentUserToken = localStorage.getItem('pennywise_token') || localStorage.getItem('finpilot_token') || null;
let currentCalDate = new Date();
let cachedUserExpenses = [];
let selectedCalendarDayDateStr = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    startLiveClock();
    loadDashboardData();
    loadProfileData();
    loadGamificationData();
    loadSubscriptionsData();
    renderNoSpendCalendar();
    runFutureSimulator();
    runTimeMachine();

    if (currentUserToken) {
        fetchWithAuth('/api/auth/profile')
            .then(r => r.json())
            .then(d => {
                if (d.user && d.user.name) {
                    document.getElementById('auth-btn-label').innerText = d.user.name;
                }
            })
            .catch(() => {});
    } else {
        setTimeout(openAuthModal, 300);
    }
});

function startLiveClock() {
    const updateClock = () => {
        const clockElem = document.getElementById('dashboard-live-clock');
        if (!clockElem) return;
        const now = new Date();
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        clockElem.innerText = now.toLocaleDateString('en-US', options);
    };
    updateClock();
    setInterval(updateClock, 1000);
}


// Theme Management (Enforced Dark Mode)
function initTheme() {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('pennywise_theme', 'dark');
}



// Helper Currency Formatter
function fmt(val) {
    const num = parseFloat(val) || 0;
    return `${currentCurrency}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Universal Fetch Wrapper with Auth Token Header
async function fetchWithAuth(url, options = {}) {
    options.headers = options.headers || {};
    if (currentUserToken && !options.headers['Authorization']) {
        options.headers['Authorization'] = `Bearer ${currentUserToken}`;
    }
    const res = await fetch(url, options);
    if (res.status === 401 || res.status === 403) {
        if (currentUserToken) {
            currentUserToken = null;
            localStorage.removeItem('finpilot_token');
        }
        openAuthModal();
    }
    return res;
}



// SPA Navigation Handler
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));

            link.classList.add('active');
            const targetSec = document.getElementById(targetId);
            if (targetSec) targetSec.classList.add('active');

            const titleMap = {
                'sec-dashboard': 'Dashboard Overview',
                'sec-profile': 'Profile, Deductions & Country Currency',
                'sec-ai-suite': 'AI Behavior Suite (21 Modules)',
                'sec-analytics': 'Analytics & Mood Psychology',
                'sec-calendar': 'No-Spend Calendar & Streaks',
                'sec-goals': 'Dream Savings Goals',
                'sec-gamification': 'Money Game & Badges',
                'sec-subscriptions': 'Subscription Killer & Watchlist',
                'sec-scanner': 'OCR Receipt Scanner'
            };
            if (titleMap[targetId]) {
                document.getElementById('header-heading').innerText = titleMap[targetId];
            }
        });
    });

    document.getElementById('btn-quick-expense').addEventListener('click', () => openModal('modal-add-expense'));
    document.getElementById('btn-impulse-lock').addEventListener('click', () => openImpulseLock());
}

// Modal Helpers
function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

// AUTHENTICATION & LOGIN/REGISTER MODAL
function openAuthModal() {
    openModal('modal-auth');
}

function toggleAuthForm(mode) {
    if (mode === 'register') {
        document.getElementById('form-login-box').style.display = 'none';
        document.getElementById('form-register-box').style.display = 'block';
        document.getElementById('auth-modal-title').innerText = '📝 Register Account';
    } else {
        document.getElementById('form-login-box').style.display = 'block';
        document.getElementById('form-register-box').style.display = 'none';
        document.getElementById('auth-modal-title').innerText = '🔐 Account Login';
    }
}

async function submitLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) return alert('Please enter email and password.');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);

        localStorage.setItem('pennywise_token', data.token);
        localStorage.setItem('finpilot_token', data.token);
        currentUserToken = data.token;
        currentCurrency = data.user.currency || '$';
        currentCountry = data.user.country || 'United States';

        document.getElementById('auth-btn-label').innerText = data.user.name;
        closeModal('modal-auth');
        alert(`Welcome back, ${data.user.name}!`);

        loadDashboardData();
        loadProfileData();
    } catch (err) {
        alert('Login failed: ' + err.message);
    }
}

async function submitRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const countryVal = document.getElementById('reg-country').value.split('|');

    if (!name || !email || !password) return alert('Please fill in all registration fields.');

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, country: countryVal[0], currency: countryVal[1] })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);

        localStorage.setItem('pennywise_token', data.token);
        localStorage.setItem('finpilot_token', data.token);
        currentUserToken = data.token;
        currentCurrency = countryVal[1];
        currentCountry = countryVal[0];

        document.getElementById('auth-btn-label').innerText = data.user.name;
        closeModal('modal-auth');
        alert(`Account created successfully! Welcome to PennyWise, ${name}.`);

        loadDashboardData();
        loadProfileData();
    } catch (err) {
        alert('Registration failed: ' + err.message);
    }
}


// PROFILE, COUNTRY/CURRENCY & DEDUCTIONS MANAGEMENT
async function loadProfileData() {
    try {
        const res = await fetchWithAuth('/api/auth/profile');
        const data = await res.json();
        if (data.error) return;

        currentCurrency = data.settings.currency || '$';
        currentCountry = data.settings.country || 'United States';

        // Update Country Dropdown Select
        const countrySelect = document.getElementById('profile-country-select');
        for (let opt of countrySelect.options) {
            if (opt.value.startsWith(currentCountry)) {
                opt.selected = true;
                break;
            }
        }

        document.getElementById('profile-target-income').value = data.settings.monthly_income_target || 5200;
        document.getElementById('prof-gross-inc').innerText = fmt(data.financial_summary.gross_income);
        document.getElementById('prof-total-ded').innerText = fmt(data.financial_summary.total_deductions);
        document.getElementById('prof-net-home').innerText = fmt(data.financial_summary.net_take_home);

        // Render Deductions Table
        const tbody = document.getElementById('tbody-deductions');
        tbody.innerHTML = data.deductions.map(d => `
            <tr style="border-bottom:1px solid var(--border-glass);">
                <td style="padding:10px; font-weight:600;">${d.title}</td>
                <td style="padding:10px; color:var(--text-muted);">${d.category}</td>
                <td style="padding:10px; font-weight:700; color:var(--accent-yellow);">${fmt(d.amount)}</td>
                <td style="padding:10px;">${d.frequency}</td>
                <td style="padding:10px;">
                    <button class="btn btn-danger" style="padding:4px 10px; font-size:11px;" onclick="deleteDeduction(${d.id})"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Error loading profile data:', err);
    }
}

async function saveProfileSettings() {
    const val = document.getElementById('profile-country-select').value.split('|');
    const country = val[0];
    const currency = val[1];
    const incomeTarget = document.getElementById('profile-target-income').value;

    await fetchWithAuth('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, currency, monthly_income_target: incomeTarget })
    });

    currentCurrency = currency;
    currentCountry = country;
    alert(`Preferences updated to ${country} (${currency})!`);

    loadDashboardData();
    loadProfileData();
}

function setDeductionPreset(name, category, defaultAmount) {
    document.getElementById('profile-ded-title').value = name;
    document.getElementById('profile-ded-amount').value = defaultAmount;
    document.getElementById('profile-ded-category').value = category;
}

async function submitProfileDeduction() {
    const title = document.getElementById('profile-ded-title').value.trim();
    const amountStr = document.getElementById('profile-ded-amount').value;
    const category = document.getElementById('profile-ded-category').value;
    const amount = parseFloat(amountStr);

    if (!title || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid deduction name and monthly amount.');
        return;
    }

    const res = await fetchWithAuth('/api/auth/deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, amount, category })
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
        document.getElementById('profile-ded-title').value = '';
        document.getElementById('profile-ded-amount').value = '';
        loadProfileData();
        loadDashboardData();
    }
}

async function submitNewDeduction() {
    const title = document.getElementById('ded-title').value;
    const amount = document.getElementById('ded-amount').value;
    const category = document.getElementById('ded-category').value;

    if (!title || !amount) return alert('Title and amount are required.');

    await fetchWithAuth('/api/auth/deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, amount, category })
    });

    closeModal('modal-add-deduction');
    loadProfileData();
    loadDashboardData();
}

async function deleteDeduction(id) {
    if (!confirm('Are you sure you want to remove this deduction?')) return;
    await fetchWithAuth(`/api/auth/deductions/${id}`, { method: 'DELETE' });
    loadProfileData();
    loadDashboardData();
}


// DASHBOARD & SUMMARY DATA (AI FINANCIAL COMMAND CENTER)
let chartWeeklyTrendInstance = null;

function renderWeeklyTrendChart(trendData) {
    const canvas = document.getElementById('chart-weekly-trend');
    if (!canvas || !trendData) return;
    const ctx = canvas.getContext('2d');
    if (chartWeeklyTrendInstance) chartWeeklyTrendInstance.destroy();

    chartWeeklyTrendInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: trendData.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Daily Spending',
                data: trendData.amounts || [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(99, 102, 241, 0.75)',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
                y: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } }
            }
        }
    });
}

function initDashboardParticles() {
    const canvas = document.getElementById('dashboard-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
    let height = canvas.height = canvas.parentElement.offsetHeight || 400;

    const particles = [];
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 2.5 + 1,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            alpha: Math.random() * 0.5 + 0.2
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

async function loadDashboardData() {
    try {
        initAnalyticsMonthInput();
        initDashboardParticles();
        const res = await fetchWithAuth('/api/dashboard');
        const data = await res.json();
        if (data.error) return;

        if (data.summary && data.summary.created_at) {
            const rawDate = String(data.summary.created_at).trim();
            const dateMatch = rawDate.match(/^(\d{4})-(\d{2})/);
            if (dateMatch) {
                userCreatedYear = parseInt(dateMatch[1], 10);
                userCreatedMonth = parseInt(dateMatch[2], 10);
            }
        }
        updateMonthSelectorOptions(userCreatedYear, userCreatedMonth);

        currentCurrency = data.summary.currency || '$';

        // 1. Update Personalized Greeting
        const greetingElem = document.getElementById('dash-personalized-greeting');
        if (greetingElem) greetingElem.innerText = data.summary.greeting || `Good evening, ${data.summary.user_name || 'Alex'} 👋`;

        // 2. Update Health Score Badge & Ring Meter
        if (data.summary.health_score) {
            const hs = data.summary.health_score;
            const valElem = document.getElementById('dash-health-score-val');
            const badgeElem = document.getElementById('dash-health-score-badge');
            const statusBadgeElem = document.getElementById('dash-health-status-badge');
            const ringPath = document.getElementById('dash-health-ring-path');

            if (valElem) valElem.innerText = hs.score;
            if (badgeElem) badgeElem.innerHTML = hs.badge_text;
            if (statusBadgeElem) statusBadgeElem.innerHTML = hs.badge_text;
            if (ringPath) ringPath.setAttribute('stroke-dasharray', `${hs.score}, 100`);
        }

        // 3. Update Command Center KPI Cards
        const incElem = document.getElementById('kpi-income');
        const dedElem = document.getElementById('kpi-deductions');
        const takeElem = document.getElementById('kpi-takehome');
        const savElem = document.getElementById('kpi-savings');

        if (incElem) incElem.innerText = fmt(data.summary.total_income);
        if (dedElem) dedElem.innerText = fmt(data.summary.total_deductions);
        if (takeElem) takeElem.innerText = fmt(data.summary.net_take_home_income);
        if (savElem) savElem.innerText = fmt(data.summary.net_savings);

        const lvlNameElem = document.getElementById('user-level-name');
        const xpLabelElem = document.getElementById('user-xp-label');
        if (lvlNameElem) lvlNameElem.innerHTML = `<i class="fa-solid fa-crown text-yellow-400"></i> ${data.summary.level_name}`;
        if (xpLabelElem) xpLabelElem.innerText = `${data.summary.xp} XP`;

        // 4. Update Spending Trend & Weekly Graph
        const monthHeader = document.getElementById('dash-spending-month-header');
        if (monthHeader && data.summary.current_month_name) {
            monthHeader.innerText = data.summary.current_month_name;
        }

        const thisMonthElem = document.getElementById('dash-spending-this-month');
        const lastMonthElem = document.getElementById('dash-spending-last-month');
        const changePctElem = document.getElementById('dash-spending-change-pct');

        if (thisMonthElem) thisMonthElem.innerText = fmt(data.summary.spending_this_month);
        if (lastMonthElem) lastMonthElem.innerText = fmt(data.summary.spending_last_month);
        if (changePctElem) {
            changePctElem.innerText = data.summary.spending_change_text || 'First month of usage';
            changePctElem.style.color = data.summary.spending_change_direction === 'up' ? 'var(--accent-red)' : '#10b981';
        }

        renderWeeklyTrendChart(data.summary.weekly_spending_trend);

        // 5. Update Largest Expense Categories Card
        const catBox = document.getElementById('dash-largest-categories-list');
        if (catBox) {
            if (!data.summary.largest_categories || data.summary.largest_categories.length === 0) {
                catBox.innerHTML = `<div style="grid-column: span 2; color:var(--text-muted); font-size:12px;">No logged expenses for this month.</div>`;
            } else {
                catBox.innerHTML = data.summary.largest_categories.map(c => `
                    <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:10px 12px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:13px; font-weight:800;">${c.icon} ${c.category}</div>
                        <div style="font-size:13px; font-weight:800; color:var(--accent-red);">${fmt(c.amount)}</div>
                    </div>
                `).join('');
            }
        }

        // 6. Update Spending Insights Card (REPLACED DREAM GOAL SUMMARY)
        const insightsBox = document.getElementById('dash-spending-insights-box');
        if (insightsBox && data.summary.spending_insights) {
            const si = data.summary.spending_insights;
            insightsBox.innerHTML = `
                <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:10px 12px; border-radius:var(--radius-sm);">
                    <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">🔥 Highest Expense</div>
                    <div style="font-size:13px; font-weight:800; color:var(--accent-red); margin-top:2px;">${si.highest_expense}</div>
                </div>
                <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:10px 12px; border-radius:var(--radius-sm);">
                    <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">💧 Lowest Expense</div>
                    <div style="font-size:13px; font-weight:800; color:var(--accent-green); margin-top:2px;">${si.lowest_expense}</div>
                </div>
                <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:10px 12px; border-radius:var(--radius-sm);">
                    <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">📊 Frequent Category</div>
                    <div style="font-size:13px; font-weight:800; color:var(--accent-yellow); margin-top:2px;">${si.most_frequent_category}</div>
                </div>
                <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:10px 12px; border-radius:var(--radius-sm);">
                    <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">📝 Transactions</div>
                    <div style="font-size:13px; font-weight:800; color:var(--primary); margin-top:2px;">${si.total_transactions} txs</div>
                </div>
                <div style="grid-column: span 2; background:rgba(6,182,212,0.1); border:1px solid var(--accent-cyan); padding:10px 12px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12px; font-weight:700; color:var(--accent-cyan);"><i class="fa-solid fa-calculator"></i> Average Daily Spending:</span>
                    <span style="font-size:14px; font-weight:800; color:var(--text-main);">${si.avg_daily_spending}</span>
                </div>
            `;
        }

        // 7. Render Recent Transactions Table
        const expRes = await fetchWithAuth('/api/expenses');
        const expenses = await expRes.json();
        cachedUserExpenses = expenses || [];

        const tbody = document.getElementById('tbody-expenses');
        if (tbody) {
            tbody.innerHTML = (Array.isArray(expenses) ? expenses : []).slice(0, 7).map(e => {
                const formattedDate = e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const formattedTime = e.created_at ? new Date(e.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                return `
                    <tr style="border-bottom:1px solid var(--border-glass);">
                        <td style="padding:10px; font-weight:600;">${e.title} ${e.is_impulse ? '<span style="color:var(--accent-red); font-size:10px;">[Impulse]</span>' : ''}</td>
                        <td style="padding:10px; color:var(--text-muted);">${e.category}</td>
                        <td style="padding:10px; font-weight:700; color:var(--accent-red);">${fmt(e.amount)}</td>
                        <td style="padding:10px; font-size:12px; color:var(--text-muted);">${formattedDate} ${formattedTime ? `<span style="font-size:11px; opacity:0.8;">• ${formattedTime}</span>` : ''}</td>
                        <td style="padding:10px;"><span style="background:rgba(99,102,241,0.15); padding:2px 8px; border-radius:12px; font-size:11px;">${e.mood || 'Neutral'}</span></td>
                    </tr>
                `;
            }).join('');
        }

        // 8. Render AI Smart Alerts Widget (PURE DATA-DRIVEN, NO SUBSCRIPTIONS!)
        const notifBox = document.getElementById('notifications-container');
        if (notifBox) {
            if (!data.ai_smart_alerts || data.ai_smart_alerts.length === 0) {
                notifBox.innerHTML = `<div style="color:var(--accent-green); font-size:12px; padding:12px; background:rgba(16,185,129,0.1); border-radius:var(--radius-sm); font-weight:700;"><i class="fa-solid fa-shield-check"></i> Great job! No financial overspending or risk alerts detected from your database logs.</div>`;
            } else {
                notifBox.innerHTML = data.ai_smart_alerts.map(a => `
                    <div class="feature-box" style="border-left: 4px solid var(--primary); padding:10px 14px; margin-bottom:0;">
                        <div style="font-size:13px; font-weight:800; color:var(--text-main); margin-bottom:2px;">${a.icon} ${a.title}</div>
                        <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">${a.message}</div>
                    </div>
                `).join('');
            }
        }

        // Render Visual Goals & Journey Maps
        const goalsBox = document.getElementById('goals-container');
        if (goalsBox) {
            if (!data.goals || data.goals.length === 0) {
                goalsBox.innerHTML = `<div style="color:var(--text-muted); font-size:13px; text-align:center; padding:24px;" class="glass-card">No dream goals set yet. Choose a theme and launch your first Dream Journey Map above!</div>`;
            } else {
                goalsBox.innerHTML = data.goals.map(g => renderDreamJourneyMap(g)).join('');
            }
        }

        // Render Analytics Expenses Table & Charts for selected month
        const monthSelect = document.getElementById('analytics-month-select');
        const yearNumInput = document.getElementById('analytics-year-num');
        let selMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        let selYear = String(new Date().getFullYear());
        if (monthSelect && monthSelect.value && yearNumInput && yearNumInput.value) {
            selMonth = String(monthSelect.value).padStart(2, '0');
            selYear = String(yearNumInput.value);
        }

        await loadAnalyticsDataForMonth(selYear, selMonth);
        renderNoSpendCalendar();
    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}

async function deleteExpenseItem(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    await fetchWithAuth(`/api/expenses/${id}`, { method: 'DELETE' });
    loadDashboardData();
}

// Render Charts with Chart.js
let chartCatInstance = null;
let chartMoodInstance = null;

function renderCharts(expenses, moodData, deductions) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const textColor = isLight ? '#0f172a' : '#f3f4f6';
    const mutedColor = isLight ? '#475569' : '#9ca3af';

    const catTotals = {};
    if (expenses && expenses.length) {
        expenses.forEach(e => {
            catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount);
        });
    }

    // Group ALL deductions into a SINGLE "Fixed Deductions" category
    if (deductions && deductions.length) {
        const totalDeductionsSum = deductions.reduce((acc, d) => acc + parseFloat(d.amount || 0), 0);
        if (totalDeductionsSum > 0) {
            catTotals['Fixed Deductions'] = totalDeductionsSum;
        }
    }

    const labels = Object.keys(catTotals);
    const dataValues = Object.values(catTotals);
    const palette = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#3b82f6'];
    const backgroundColors = labels.map((_, i) => palette[i % palette.length]);

    const ctxCat = document.getElementById('chart-category').getContext('2d');
    if (chartCatInstance) chartCatInstance.destroy();
    chartCatInstance = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Food & Groceries', 'Shopping', 'Transport'],
            datasets: [{
                data: dataValues.length ? dataValues : [250, 330, 193.5],
                backgroundColor: backgroundColors.length ? backgroundColors : palette.slice(0, 3)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: textColor, font: { size: 12 } } } }
        }
    });


    const ctxMood = document.getElementById('chart-mood').getContext('2d');
    const moodLabels = (moodData && moodData.length) ? moodData.map(m => m.mood) : [];
    const moodValues = (moodData && moodData.length) ? moodData.map(m => m.avg_amount) : [];

    if (chartMoodInstance) chartMoodInstance.destroy();
    chartMoodInstance = new Chart(ctxMood, {
        type: 'bar',
        data: {
            labels: moodLabels.length ? moodLabels : ['Happy', 'Stressed', 'Bored', 'Neutral'],
            datasets: [{
                label: `Avg Spending (${currentCurrency})`,
                data: moodValues.length ? moodValues : [42, 118, 85, 30],
                backgroundColor: 'rgba(236, 72, 153, 0.7)',
                borderColor: '#ec4899',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: mutedColor } },
                y: { ticks: { color: mutedColor } }
            },
            plugins: { legend: { display: false } }
        }
    });
}


// Render Heatmap Calendar (Dynamic & Interactive - Current Month Only)
function changeCalendarMonth(delta) {
    alert("The No-Spend Calendar is only available for the current month.");
}

async function renderNoSpendCalendar() {
    const grid = document.getElementById('no-spend-calendar-grid');
    if (!grid) return;

    // Lock strictly to current real-world month and year
    const now = new Date();
    currentCalDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthLabel = document.getElementById('cal-month-year-label');
    if (monthLabel) monthLabel.innerText = `${monthNames[month]} ${year}`;

    if (!cachedUserExpenses || !cachedUserExpenses.length) {
        try {
            const expRes = await fetchWithAuth('/api/expenses');
            cachedUserExpenses = await expRes.json();
        } catch (e) {
            cachedUserExpenses = [];
        }
    }

    const expenseByDate = {};
    (cachedUserExpenses || []).forEach(exp => {
        let dateKey = '';
        if (exp.date) {
            dateKey = exp.date.substring(0, 10);
        } else if (exp.created_at) {
            dateKey = new Date(exp.created_at).toISOString().substring(0, 10);
        }
        if (dateKey) {
            if (!expenseByDate[dateKey]) expenseByDate[dateKey] = [];
            expenseByDate[dateKey].push(exp);
        }
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(d => html += `<div class="cal-day-header">${d}</div>`);

    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div class="cal-cell empty"></div>`;
    }

    const todayStr = new Date().toISOString().substring(0, 10);

    let monthSpendDays = 0;
    let monthNoSpendDays = 0;
    let monthTotalOutflow = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        const dateKey = `${year}-${mStr}-${dStr}`;

        const dayExpenses = expenseByDate[dateKey] || [];
        const dayTotal = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        const isToday = (dateKey === todayStr);

        if (dayTotal > 0) {
            monthSpendDays++;
            monthTotalOutflow += dayTotal;
            html += `
                <div class="cal-cell spent ${isToday ? 'today' : ''}" 
                     onclick="openNoSpendDayModal('${dateKey}')" 
                     title="${dateKey}: ${fmt(dayTotal)} spent (${dayExpenses.length} items)">
                    <span>${day}</span>
                    <span style="font-size:9px; margin-top:2px; font-weight:800;">${fmt(dayTotal)}</span>
                </div>
            `;
        } else {
            monthNoSpendDays++;
            html += `
                <div class="cal-cell no-spend ${isToday ? 'today' : ''}" 
                     onclick="openNoSpendDayModal('${dateKey}')" 
                     title="${dateKey}: No-Spend Day! 🎉">
                    <span>${day}</span>
                    <span style="font-size:9px; margin-top:2px; opacity:0.8;">$0</span>
                </div>
            `;
        }
    }

    grid.innerHTML = html;

    // Month-Scoped No-Spend Streak Calculation
    let currentMonthStreak = 0;
    let bestMonthStreak = 0;
    let runningStreak = 0;

    const isCurrentMonth = (year === new Date().getFullYear() && month === new Date().getMonth());
    const evalEndDay = isCurrentMonth ? new Date().getDate() : totalDaysInMonth;

    // 1. Current active streak leading up to today (or end of month)
    for (let d = evalEndDay; d >= 1; d--) {
        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        const k = `${year}-${mStr}-${dStr}`;
        const dayExp = expenseByDate[k] || [];
        const sum = dayExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

        if (sum === 0) {
            currentMonthStreak++;
        } else {
            // Money spent on this day breaks the active streak!
            break;
        }
    }

    // 2. Peak / Best streak achieved anywhere in this month
    for (let d = 1; d <= totalDaysInMonth; d++) {
        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        const k = `${year}-${mStr}-${dStr}`;
        const dayExp = expenseByDate[k] || [];
        const sum = dayExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

        if (sum === 0) {
            runningStreak++;
            if (runningStreak > bestMonthStreak) bestMonthStreak = runningStreak;
        } else {
            runningStreak = 0;
        }
    }

    const statStreak = document.getElementById('cal-stat-streak');
    const statNoSpend = document.getElementById('cal-stat-nospend');
    const statSpend = document.getElementById('cal-stat-spend');
    const statTotal = document.getElementById('cal-stat-total');

    if (statStreak) statStreak.innerText = `🔥 ${currentMonthStreak} Days`;
    if (statNoSpend) statNoSpend.innerText = `🟢 ${monthNoSpendDays} Days`;
    if (statSpend) statSpend.innerText = `🔴 ${monthSpendDays} Days`;
    if (statTotal) statTotal.innerText = fmt(monthTotalOutflow);
}

function openNoSpendDayModal(dateKey) {
    selectedCalendarDayDateStr = dateKey;
    const dayExpenses = (cachedUserExpenses || []).filter(exp => {
        let k = exp.date ? exp.date.substring(0, 10) : (exp.created_at ? new Date(exp.created_at).toISOString().substring(0, 10) : '');
        return k === dateKey;
    });

    const totalSpent = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const formattedDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    document.getElementById('ns-day-title').innerText = `📅 ${formattedDate}`;

    const badgeBox = document.getElementById('ns-day-status-badge');
    if (totalSpent === 0) {
        badgeBox.innerHTML = `
            <div style="background:rgba(16,185,129,0.15); border:1px solid var(--accent-green); padding:12px; border-radius:var(--radius-md); text-align:center;">
                <div style="font-size:24px; margin-bottom:4px;">🟢</div>
                <strong style="color:var(--accent-green); font-size:15px;">NO-SPEND DAY!</strong>
                <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">You spent $0.00 today and built your savings streak! 🎉</div>
            </div>
        `;
    } else {
        badgeBox.innerHTML = `
            <div style="background:rgba(239,68,68,0.15); border:1px solid var(--accent-red); padding:12px; border-radius:var(--radius-md); text-align:center;">
                <div style="font-size:24px; margin-bottom:4px;">🔴</div>
                <strong style="color:var(--accent-red); font-size:15px;">SPEND DAY: ${fmt(totalSpent)}</strong>
                <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Logged ${dayExpenses.length} transaction(s) on this date.</div>
            </div>
        `;
    }

    const itemsList = document.getElementById('ns-day-items-list');
    if (dayExpenses.length === 0) {
        itemsList.innerHTML = `<div style="color:var(--text-muted); font-size:12px; font-style:italic;">No itemized expenses logged for this date.</div>`;
    } else {
        itemsList.innerHTML = dayExpenses.map(e => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-inner); padding:10px 12px; border-radius:var(--radius-sm); margin-bottom:6px; border:1px solid var(--border-glass);">
                <div>
                    <div style="font-weight:700; font-size:13px;">${e.title} ${e.is_impulse ? '<span style="color:var(--accent-red); font-size:10px;">[Impulse]</span>' : ''}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${e.category} • Mood: ${e.mood || 'Neutral'}</div>
                </div>
                <div style="font-weight:800; color:var(--accent-red); font-size:14px;">${fmt(e.amount)}</div>
            </div>
        `).join('');
    }

    openModal('modal-nospend-day');
}

function openAddExpenseForSelectedDate() {
    closeModal('modal-nospend-day');
    openModal('modal-add-expense');
}

// AI Functions
async function runShouldIBuyIt() {
    const item = document.getElementById('sib-name').value || 'iPhone 17 Pro';
    const price = document.getElementById('sib-price').value || 1200;

    const res = await fetchWithAuth('/api/ai/should-i-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: item, price })
    });
    const data = await res.json();
    if (data.currency) currentCurrency = data.currency;

    const box = document.getElementById('sib-result');
    box.style.display = 'block';
    box.innerHTML = `
        <h4>Recommendation: <span style="color:${data.recommendation === 'Yes' ? 'var(--accent-green)' : 'var(--accent-yellow)'};">${data.recommendation}</span></h4>
        <p>${data.explanation}</p>
    `;
}

async function runRegretPredictor() {
    const itemInput = document.getElementById('rp-item');
    const priceInput = document.getElementById('rp-price');
    const catInput = document.getElementById('rp-category');
    const moodInput = document.getElementById('rp-mood');

    const item = itemInput && itemInput.value ? itemInput.value.trim() : 'Gaming Chair';
    const price = priceInput && priceInput.value ? parseFloat(priceInput.value) : 500;
    const category = catInput ? catInput.value : 'Shopping';
    const mood = moodInput ? moodInput.value : 'Stressed';

    const res = await fetchWithAuth('/api/ai/predict-regret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: item, price, category, mood })
    });
    const data = await res.json();
    if (data.currency) currentCurrency = data.currency;

    const box = document.getElementById('rp-result');
    box.style.display = 'block';

    let riskColor = 'var(--accent-green)';
    if (data.regret_score > 80) riskColor = 'var(--accent-red)';
    else if (data.regret_score >= 61) riskColor = '#f97316';
    else if (data.regret_score >= 31) riskColor = 'var(--accent-yellow)';

    box.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-glass); padding-bottom:10px; margin-bottom:12px;">
            <div>
                <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">REGRET RISK SCORE</div>
                <div style="font-size:24px; font-weight:800; color:${riskColor}; margin-top:2px;">
                    ${data.regret_score}/100
                </div>
            </div>
            <div style="text-align:right;">
                <span style="font-size:13px; font-weight:800; padding:6px 14px; border-radius:20px; background:rgba(99,102,241,0.15); color:${riskColor}; border:1px solid ${riskColor};">
                    ${data.risk_level}
                </span>
            </div>
        </div>

        <div style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:8px;">
            <i class="fa-solid fa-bullseye"></i> Prediction: <span style="color:${riskColor};">${data.prediction}</span>
        </div>

        <div style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Calculated Risk Factors:</div>
        <ul style="margin-left:18px; font-size:12px; color:var(--text-main); line-height:1.6; margin-bottom:12px;">
            ${(data.reasons || []).map(r => `<li>${r}</li>`).join('')}
        </ul>

        <div style="background:rgba(6,182,212,0.12); border:1px solid var(--accent-cyan); padding:10px 12px; border-radius:var(--radius-sm); font-size:12px; margin-bottom:14px; color:var(--text-main);">
            <strong>💡 Recommendation:</strong> ${data.recommendation}
        </div>

        <!-- Learning System 7-Day Feedback Prompt -->
        <div style="border-top:1px dashed var(--border-glass); padding-top:10px;">
            <div style="font-size:11px; color:var(--text-muted); font-weight:700; margin-bottom:6px;">LEARNING SYSTEM: Do you think this purchase was worth it?</div>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary" style="flex:1; font-size:11px; padding:4px;" onclick="submitPurchaseFeedback('${item}', ${data.regret_score}, 'Yes')">🟢 Yes</button>
                <button class="btn btn-secondary" style="flex:1; font-size:11px; padding:4px;" onclick="submitPurchaseFeedback('${item}', ${data.regret_score}, 'Neutral')">🟡 Neutral</button>
                <button class="btn btn-secondary" style="flex:1; font-size:11px; padding:4px;" onclick="submitPurchaseFeedback('${item}', ${data.regret_score}, 'No')">🔴 No</button>
            </div>
            <div id="rp-feedback-msg" style="font-size:11px; color:var(--accent-green); font-weight:700; margin-top:6px; display:none;"></div>
        </div>
    `;
}

async function submitPurchaseFeedback(title, score, feedbackVal) {
    const res = await fetchWithAuth('/api/ai/purchase-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_title: title, regret_score: score, feedback: feedbackVal })
    });
    const data = await res.json();
    const msgBox = document.getElementById('rp-feedback-msg');
    if (msgBox) {
        msgBox.style.display = 'block';
        msgBox.innerText = `✓ Feedback recorded (${feedbackVal}). Learning engine updated!`;
    }
}

async function runOpportunityCost() {
    const itemStr = document.getElementById('occ-item').value || `Coffee (${fmt(6)})`;
    const priceMatch = itemStr.match(/\d+/);
    const price = priceMatch ? priceMatch[0] : 6;

    const res = await fetchWithAuth('/api/ai/opportunity-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: itemStr, price })
    });
    const data = await res.json();
    if (data.currency) currentCurrency = data.currency;

    const box = document.getElementById('occ-result');
    box.style.display = 'block';
    box.innerHTML = `
        <h4>This ${data.item_name} (${fmt(data.price)}) equals:</h4>
        <ul style="margin-left:20px; font-size:13px; color:var(--text-muted); line-height:1.8;">
            ${data.equivalents.map(eq => `<li>${eq}</li>`).join('')}
        </ul>
    `;
}

async function runFutureSimulator() {
    const pct = document.getElementById('sim-slider').value;
    const res = await fetchWithAuth('/api/ai/future-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Food', reduction_pct: pct })
    });
    const data = await res.json();
    if (data.currency) currentCurrency = data.currency;

    document.getElementById('sim-result').innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>Savings after 1 year:</span>
            <strong style="color:var(--accent-green); font-size:16px;">+${fmt(data.savings_1_year)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
            <span>Savings after 5 years:</span>
            <strong style="color:var(--primary); font-size:18px;">+${fmt(data.savings_5_years)}</strong>
        </div>
    `;
}

async function runTimeMachine() {
    const amount = document.getElementById('tm-amount').value || 120;
    const res = await fetchWithAuth('/api/ai/time-machine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_habit_saving: amount })
    });
    const data = await res.json();
    if (data.currency) currentCurrency = data.currency;

    document.getElementById('tm-result').innerHTML = `
        <div style="font-size:13px; line-height:1.8; color:var(--text-muted);">
            <div>• <strong>1 Month:</strong> +${fmt(data.timeline['1_month'])}</div>
            <div>• <strong>6 Months:</strong> +${fmt(data.timeline['6_months'])}</div>
            <div>• <strong>1 Year:</strong> +${fmt(data.timeline['1_year'])}</div>
            <div>• <strong>5 Years:</strong> <span style="color:var(--accent-green); font-weight:800;">+${fmt(data.timeline['5_years'])}</span></div>
            <div style="margin-top:8px; border-top:1px solid var(--border-glass); padding-top:8px; color:#ffffff;">
                Could realistically fund: ${data.funded_items.join(', ')}
            </div>
        </div>
    `;
}


// AI Coach Chat
async function sendCoachMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const box = document.getElementById('chat-messages');
    box.innerHTML += `<div style="text-align:right; margin-bottom:8px; color:var(--text-main);"><strong>You:</strong> ${msg}</div>`;
    input.value = '';

    const res = await fetchWithAuth('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    if (data.currency) currentCurrency = data.currency;

    box.innerHTML += `<div style="color:var(--primary); margin-bottom:8px;"><strong>Coach:</strong> ${data.reply}</div>`;

    box.scrollTop = box.scrollHeight;
}

// Impulse Lock Timer Modal
let timerInterval = null;
let currentImpulseTitle = '';
let currentImpulsePrice = 0;

function openImpulseLock() {
    clearInterval(timerInterval);
    currentImpulseTitle = '';
    currentImpulsePrice = 0;
    const titleInput = document.getElementById('impulse-title');
    const amountInput = document.getElementById('impulse-amount');
    if (titleInput) titleInput.value = '';
    if (amountInput) amountInput.value = '';
    document.getElementById('impulse-input-section').style.display = 'block';
    document.getElementById('impulse-eval-section').style.display = 'none';
    const btn = document.getElementById('btn-impulse-confirm');
    if (btn) btn.disabled = false;
    openModal('modal-impulse');
}

async function startImpulseEvaluation() {
    const titleInput = document.getElementById('impulse-title');
    const amountInput = document.getElementById('impulse-amount');
    
    currentImpulseTitle = titleInput ? titleInput.value.trim() : '';
    currentImpulsePrice = amountInput ? parseFloat(amountInput.value) : 0;

    if (!currentImpulseTitle || isNaN(currentImpulsePrice) || currentImpulsePrice <= 0) {
        alert('Please enter a product name and a valid price.');
        return;
    }

    // Switch view to Step 2: Show evaluation & 30s timer
    document.getElementById('impulse-input-section').style.display = 'none';
    document.getElementById('impulse-eval-section').style.display = 'block';

    const aiBox = document.getElementById('impulse-ai-box');
    aiBox.innerHTML = `<div style="color:var(--primary); font-size:13px;"><i class="fa-solid fa-spinner fa-spin"></i> Analyzing your monthly income, net savings, and goals...</div>`;

    // Enable "Still Buy" button so user is never stuck
    const btn = document.getElementById('btn-impulse-confirm');
    if (btn) btn.disabled = false;

    // 1. Fetch AI Recommendation & Economic Analysis
    fetchWithAuth('/api/ai/should-i-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: currentImpulseTitle, price: currentImpulsePrice })
    }).then(r => r.json()).then(data => {
        if (data.currency) currentCurrency = data.currency;
        const color = data.recommendation === 'Yes' ? 'var(--accent-green)' : (data.recommendation === 'No' ? 'var(--accent-red)' : 'var(--accent-yellow)');
        aiBox.innerHTML = `
            <div style="font-size:14px; font-weight:700; margin-bottom:6px;">
                Economic Recommendation: <span style="color:${color}; font-size:16px;">${data.recommendation}</span>
            </div>
            <div style="font-size:13px; color:var(--text-main); line-height:1.5;">${data.explanation}</div>
            <div style="margin-top:8px; border-top:1px solid var(--border-glass); padding-top:6px; font-size:12px; color:var(--text-muted); display:flex; justify-content:space-between;">
                <span>Price: <strong style="color:var(--accent-red);">${fmt(currentImpulsePrice)}</strong></span>
                <span>Current Net Balance: <strong style="color:var(--accent-green);">${fmt(data.current_balance)}</strong></span>
            </div>
        `;
    }).catch(err => {
        aiBox.innerHTML = `<div style="color:var(--accent-red);">Failed to fetch AI analysis. Proceeding with cooling-off timer...</div>`;
    });

    // 2. Cooling-off countdown display
    let sec = 30;
    const timerElem = document.getElementById('timer-countdown');
    if (timerElem) timerElem.innerText = sec;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        sec--;
        if (timerElem) timerElem.innerText = Math.max(0, sec);
        if (sec <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
}

function cancelImpulsePurchase() {
    clearInterval(timerInterval);
    closeModal('modal-impulse');
    alert('🎉 Success! Impulse purchase cancelled. +20 XP awarded for self-control!');
    loadDashboardData();
}

async function confirmImpulsePurchase() {
    const titleInput = document.getElementById('impulse-title');
    const amountInput = document.getElementById('impulse-amount');
    
    const title = currentImpulseTitle || (titleInput ? titleInput.value.trim() : '') || 'Impulse Buy';
    const amount = currentImpulsePrice || (amountInput ? parseFloat(amountInput.value) : 0);

    if (!title || isNaN(amount) || amount <= 0) {
        alert('Please enter a product name and valid amount.');
        return;
    }

    clearInterval(timerInterval);

    try {
        const res = await fetchWithAuth('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                amount: amount,
                category: 'Shopping',
                is_impulse: true,
                mood: 'Stressed'
            })
        });

        const data = await res.json();
        if (data.error) {
            alert('Failed to log expense: ' + data.error);
            return;
        }

        closeModal('modal-impulse');
        alert(`🛒 Expense logged: "${title}" (${fmt(amount)}) added to your logged expenses.`);
        
        // Refresh dashboard, analytics, and gamification
        await loadDashboardData();
        await loadGamificationData();
    } catch (err) {
        console.error('Error confirming impulse purchase:', err);
        alert('Error recording impulse expense.');
    }
}

// Add Expense
async function submitNewExpense() {
    const title = document.getElementById('new-exp-title').value;
    const amount = document.getElementById('new-exp-amount').value;
    const category = document.getElementById('new-exp-cat').value;
    const mood = document.getElementById('new-exp-mood').value;

    if (!title || !amount) return alert('Please enter title and amount.');

    await fetchWithAuth('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, amount, category, mood })
    });
    closeModal('modal-add-expense');
    loadDashboardData();
}

// Gamification Data & Custom Daily Missions
async function loadGamificationData() {
    const res = await fetchWithAuth('/api/gamification');
    const data = await res.json();
    if (data.error) return;

    // Update Overall Level Badge
    const lvlBadge = document.getElementById('gamification-level-badge');
    if (lvlBadge) {
        lvlBadge.innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${data.level_name} (${data.xp} XP)`;
    }

    // Update Sidebar User Widget
    const userLvlName = document.getElementById('user-level-name');
    const userXpLabel = document.getElementById('user-xp-label');
    const userXpFill = document.getElementById('user-xp-fill');
    if (userLvlName) userLvlName.innerHTML = `<i class="fa-solid fa-crown text-yellow-400"></i> ${data.level_name}`;
    if (userXpLabel) userXpLabel.innerText = `${data.xp} XP`;
    if (userXpFill) {
        const fillPct = Math.min(100, Math.floor((data.xp % 250) / 2.5));
        userXpFill.style.width = `${fillPct}%`;
    }

    // Render Badges
    const badgesBox = document.getElementById('badges-container');
    badgesBox.innerHTML = data.badges.map(b => `
        <div class="badge-item ${b.unlocked ? 'unlocked' : 'locked'}">
            <div class="badge-icon">${b.icon}</div>
            <div style="font-weight:700; font-size:14px;">${b.title}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${b.description}</div>
            <div style="color:var(--accent-yellow); font-size:11px; font-weight:700; margin-top:6px;">+${b.xp_reward} XP</div>
        </div>
    `).join('');

    // Render Today's Active Daily Missions
    const chalBox = document.getElementById('challenges-container');
    if (!data.challenges || data.challenges.length === 0) {
        chalBox.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:13px; padding:20px;">No active missions for today. Set a custom mission above!</div>`;
    } else {
        chalBox.innerHTML = data.challenges.map(c => `
            <div class="feature-box" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px; border-left:4px solid ${c.is_completed ? 'var(--accent-green)' : 'var(--primary)'};">
                <div>
                    <h4 style="margin-bottom:4px; font-size:15px; color:${c.is_completed ? 'var(--accent-green)' : 'var(--text-main)'};">
                        ${c.is_completed ? '<i class="fa-solid fa-circle-check text-green-400"></i>' : '<i class="fa-solid fa-flag text-indigo-400"></i>'} ${c.title}
                    </h4>
                    <p style="font-size:13px; color:var(--text-muted); margin:0;">
                        Target Savings: <strong>${fmt(c.potential_savings)}</strong> | 
                        Reward: <span style="color:#fcd34d; font-weight:800;">+${c.xp_reward} XP</span>
                    </p>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn ${c.is_completed ? 'btn-secondary' : 'btn-primary'}" style="font-weight:800; font-size:12px;" ${c.is_completed ? 'disabled' : ''} onclick="completeChallenge(${c.id})">
                        ${c.is_completed ? '<i class="fa-solid fa-check"></i> Completed' : '<i class="fa-solid fa-bolt"></i> Complete (+' + c.xp_reward + ' XP)'}
                    </button>
                    <button class="btn btn-danger" style="padding:4px 8px; font-size:12px;" onclick="deleteDailyMission(${c.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    const buddyBox = document.getElementById('buddy-container');
    if (buddyBox && data.shared_goals) {
        buddyBox.innerHTML = data.shared_goals.map(s => `
            <div class="feature-box">
                <h4>${s.title} (with ${s.buddy_name})</h4>
                <div style="margin-top:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                        <span>Your Progress</span>
                        <span>${s.user_progress_pct}%</span>
                    </div>
                    <div class="xp-bar-bg"><div class="xp-bar-fill" style="width:${s.user_progress_pct}%;"></div></div>
                </div>
            </div>
        `).join('');
    }
}

// Add Custom Daily Mission
async function addCustomDailyMission() {
    const titleInput = document.getElementById('custom-mission-title');
    const savingsInput = document.getElementById('custom-mission-savings');
    const xpInput = document.getElementById('custom-mission-xp');

    const title = titleInput ? titleInput.value.trim() : '';
    const potential_savings = savingsInput ? savingsInput.value : 15;
    const xp_reward = xpInput ? xpInput.value : 50;

    if (!title) return alert('Please enter a daily mission name (e.g. Skip Buying Coffee Today).');

    const res = await fetchWithAuth('/api/gamification/custom-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, potential_savings, xp_reward })
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
        if (titleInput) titleInput.value = '';
        loadGamificationData();
    }
}

// Delete Daily Mission
async function deleteDailyMission(id) {
    if (!confirm('Are you sure you want to remove this daily mission?')) return;
    await fetchWithAuth(`/api/gamification/challenge/${id}`, { method: 'DELETE' });
    loadGamificationData();
}

// Complete Daily Mission
async function completeChallenge(id) {
    const res = await fetchWithAuth(`/api/gamification/complete-challenge/${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.xp_gained) {
        alert(`🎉 Mission Completed! You gained +${data.xp_gained} XP!`);
    }
    loadGamificationData();
    loadDashboardData();
}

// Subscriptions & Usage Tracking Module
async function loadSubscriptionsData() {
    const res = await fetchWithAuth('/api/subscriptions');
    const data = await res.json();
    if (data.error) return;

    const subsBox = document.getElementById('subs-container');
    if (!data.subscriptions || data.subscriptions.length === 0) {
        subsBox.innerHTML = `<div style="color:var(--text-muted); font-size:13px; text-align:center; padding:16px;">No subscriptions currently tracked. Add one above!</div>`;
    } else {
        subsBox.innerHTML = data.subscriptions.map(s => {
            const daysAgoText = s.days_since_last_use === 0 ? 'Today' : `${s.days_since_last_use} days ago`;
            
            let statusBadge = '🟢 Active';
            let statusColor = 'var(--accent-green)';
            let statusBg = 'rgba(16,185,129,0.15)';
            if (s.status === 'Moderate usage') {
                statusBadge = '🟡 Moderate';
                statusColor = 'var(--accent-yellow)';
                statusBg = 'rgba(245,158,11,0.15)';
            } else if (s.status === 'Low usage') {
                statusBadge = '🟠 Low usage';
                statusColor = 'var(--accent-yellow)';
                statusBg = 'rgba(245,158,11,0.15)';
            } else if (s.status === 'Unused') {
                statusBadge = '🔴 Unused';
                statusColor = 'var(--accent-red)';
                statusBg = 'rgba(239,68,68,0.15)';
            }

            let recColor = 'var(--accent-green)';
            if (s.recommendation === 'Review subscription') recColor = 'var(--accent-yellow)';
            if (s.recommendation === 'Consider cancelling') recColor = 'var(--accent-red)';

            const scoreColor = s.value_score >= 80 ? 'var(--accent-green)' : (s.value_score >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)');

            return `
                <div class="feature-box" style="margin-bottom:14px; border-left:4px solid ${statusColor};">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <div>
                            <div style="font-size:16px; font-weight:800; display:flex; align-items:center; gap:8px;">
                                ${s.service_name} 
                                <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; background:rgba(99,102,241,0.15); color:var(--primary);">${s.category || 'Entertainment'}</span>
                            </div>
                            <div style="font-size:14px; font-weight:800; color:var(--accent-red); margin-top:2px;">
                                ${fmt(s.cost_per_month)}/month
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:11px; font-weight:800; padding:4px 10px; border-radius:14px; background:${statusBg}; color:${statusColor}; border:1px solid ${statusColor};">
                                ${statusBadge}
                            </span>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin:10px 0; font-size:12px; background:var(--bg-inner); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-glass);">
                        <div>
                            <span style="color:var(--text-muted);">Last used:</span> 
                            <strong style="color:var(--text-main);">${daysAgoText}</strong>
                        </div>
                        <div>
                            <span style="color:var(--text-muted);">Value score:</span> 
                            <strong style="color:${scoreColor};">${s.value_score}/100</strong>
                        </div>
                    </div>

                    <div style="font-size:12px; margin-bottom:12px;">
                        <span style="color:var(--text-muted);">Recommendation:</span> 
                        <strong style="color:${recColor};">${s.recommendation}</strong>
                    </div>

                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <button class="btn btn-primary" style="padding:4px 10px; font-size:12px;" onclick="markSubUsed(${s.id})">
                            <i class="fa-solid fa-check"></i> Mark Used Today
                        </button>
                        <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px;" onclick="openSubAnalytics(${s.id})">
                            <i class="fa-solid fa-chart-pie"></i> Usage Analytics
                        </button>
                        <button class="btn btn-danger" style="padding:4px 8px; font-size:12px;" onclick="removeSub(${s.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    await loadSavingsOpportunities();
}

async function addSubscription() {
    const nameInput = document.getElementById('sub-name-input');
    const catSelect = document.getElementById('sub-category-select');
    const costInput = document.getElementById('sub-cost-input');
    const renewalInput = document.getElementById('sub-renewal-input');
    const lastusedInput = document.getElementById('sub-lastused-input');

    const service_name = nameInput ? nameInput.value.trim() : '';
    const category = catSelect ? catSelect.value : 'Entertainment';
    const cost_per_month = costInput ? costInput.value : '';
    const renewal_date = renewalInput ? renewalInput.value : '';
    const last_used_date = lastusedInput ? lastusedInput.value : '';

    if (!service_name || !cost_per_month) {
        alert('Please enter Service Name and Monthly Cost.');
        return;
    }

    const res = await fetchWithAuth('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_name,
            category,
            cost_per_month: parseFloat(cost_per_month),
            renewal_date,
            last_used_date
        })
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
        if (nameInput) nameInput.value = '';
        if (costInput) costInput.value = '';
        loadSubscriptionsData();
    }
}

async function markSubUsed(id) {
    const res = await fetchWithAuth(`/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_used: true })
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
        loadSubscriptionsData();
    }
}

async function openSubAnalytics(id) {
    const res = await fetchWithAuth(`/api/subscriptions/${id}/analytics`);
    const data = await res.json();
    if (data.error) {
        alert(data.error);
        return;
    }

    const sub = data.subscription;
    const titleElem = document.getElementById('sub-analytics-title');
    const bodyElem = document.getElementById('sub-analytics-body');

    if (titleElem) {
        titleElem.innerHTML = `<i class="fa-solid fa-chart-pie text-indigo-400"></i> ${sub.service_name} Usage Analytics`;
    }

    if (bodyElem) {
        bodyElem.innerHTML = `
            <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:14px; border-radius:var(--radius-md); margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:18px; font-weight:800;">${sub.service_name}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${sub.category || 'Entertainment'}</div>
                    </div>
                    <div style="font-size:18px; font-weight:900; color:var(--accent-red);">${fmt(sub.cost_per_month)}/mo</div>
                </div>
            </div>

            <!-- Metrics Grid -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px;">
                <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:12px; border-radius:var(--radius-md); text-align:center;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Months Subscribed</div>
                    <div style="font-size:20px; font-weight:800; color:var(--primary); margin-top:2px;">${data.months_subscribed} Mo</div>
                </div>
                <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:12px; border-radius:var(--radius-md); text-align:center;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Money Spent</div>
                    <div style="font-size:20px; font-weight:800; color:var(--accent-red); margin-top:2px;">${fmt(data.total_money_spent)}</div>
                </div>
                <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:12px; border-radius:var(--radius-md); text-align:center;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Average Cost per Use</div>
                    <div style="font-size:20px; font-weight:800; color:var(--accent-yellow); margin-top:2px;">${fmt(data.average_cost_per_use)}</div>
                </div>
                <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:12px; border-radius:var(--radius-md); text-align:center;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Value Score</div>
                    <div style="font-size:20px; font-weight:800; color:var(--accent-green); margin-top:2px;">${data.recommendation_score}/100</div>
                </div>
            </div>

            <!-- Recommendation & Potential Savings -->
            <div style="background:rgba(16,185,129,0.12); border:1.5px solid var(--accent-green); padding:14px; border-radius:var(--radius-md); margin-bottom:16px;">
                <div style="font-size:12px; font-weight:700; color:var(--text-muted);">AI RECOMMENDATION</div>
                <div style="font-size:15px; font-weight:800; color:var(--accent-green); margin-top:2px;">
                    <i class="fa-solid fa-lightbulb"></i> ${sub.recommendation}
                </div>
                <div style="font-size:12px; color:var(--text-main); margin-top:6px;">
                    Cancelling this subscription saves <strong>${fmt(data.savings_if_cancelled)}/year</strong>!
                </div>
            </div>

            <!-- Monthly Usage History -->
            <div style="font-size:13px; font-weight:800; margin-bottom:8px;"><i class="fa-solid fa-clock-rotate-left"></i> Monthly Usage History & Trend</div>
            <div style="max-height:160px; overflow-y:auto; background:var(--bg-inner); border:1px solid var(--border-glass); border-radius:var(--radius-md); padding:10px;">
                ${(!data.usage_history || data.usage_history.length === 0)
                    ? `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No historical monthly records archived yet. Fresh record will generate at month end!</div>`
                    : data.usage_history.map(h => `
                        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-glass); padding:6px 0; font-size:12px;">
                            <span>Month ${h.month}/${h.year}</span>
                            <span>Total Uses: <strong>${h.total_uses}</strong></span>
                            <span style="color:var(--accent-green); font-weight:700;">Score: ${h.value_score}/100</span>
                        </div>
                    `).join('')
                }
            </div>
        `;
    }

    openModal('modal-sub-analytics');
}

async function removeSub(id) {
    if (!confirm('Are you sure you want to remove this subscription from tracking?')) return;

    const res = await fetchWithAuth(`/api/subscriptions/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
        const alertBox = document.getElementById('sub-savings-alert');
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.innerHTML = `
                <div style="font-weight:700; color:var(--accent-green); font-size:14px;"><i class="fa-solid fa-circle-check"></i> ${data.message}</div>
                <div style="font-size:13px; color:var(--text-main); margin-top:4px;">
                    🎉 By removing this subscription, you are now saving <strong>${fmt(data.monthly_savings)}/month</strong> (<strong>${fmt(data.yearly_savings)}/year</strong>) more!
                </div>
            `;
        }
        loadSubscriptionsData();
        loadDashboardData();
    }
}


// Additional Checklist Handlers: Logout, Forgot Password, Delete Account, Reports
function logoutUser() {
    localStorage.removeItem('pennywise_token');
    localStorage.removeItem('finpilot_token');
    currentUserToken = null;
    document.getElementById('auth-btn-label').innerText = 'Login / Account';
    alert('Logged out successfully.');
    window.location.reload();
}


async function submitForgotPassword() {
    const email = prompt('Enter your registered email address:');
    if (!email) return;
    const newPassword = prompt('Enter your new password:');
    if (!newPassword) return;

    const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else alert(data.message);
}

async function deleteAccount() {
    if (!confirm('Are you sure you want to permanently delete your account and all associated data?')) return;

    const res = await fetchWithAuth('/api/auth/account', { method: 'DELETE' });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
        alert(data.message);
        logoutUser();
    }
}

async function generateMonthlyReport() {
    try {
        const headers = currentUserToken ? { 'Authorization': `Bearer ${currentUserToken}` } : {};
        const res = await fetch('/api/dashboard/reports/download', { headers });
        if (!res.ok) throw new Error('Failed to generate PDF report');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FinPilot_Monthly_Report_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert('Error downloading report: ' + err.message);
    }
}

// Dream Goals Management Handlers
async function addDreamGoal() {
    const title = document.getElementById('goal-title-input').value.trim();
    const theme = typeof getSelectedGoalTheme === 'function' ? getSelectedGoalTheme() : 'tokyo';
    const target = document.getElementById('goal-target-input').value;
    const current = document.getElementById('goal-current-input').value || 0;
    const date = document.getElementById('goal-date-input').value;

    if (!title || !target) {
        alert('Please enter a Goal Name and Target Budget.');
        return;
    }

    const res = await fetchWithAuth('/api/dashboard/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title,
            target_amount: parseFloat(target),
            current_amount: parseFloat(current),
            target_date: date,
            theme
        })
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
        document.getElementById('goal-title-input').value = '';
        document.getElementById('goal-target-input').value = '';
        document.getElementById('goal-current-input').value = '0';
        document.getElementById('goal-date-input').value = '';
        const customInput = document.getElementById('goal-custom-destination-input');
        if (customInput) customInput.value = '';
        loadDashboardData();
    }
}

async function addGoalSavingsModal(id, currentSaved, currentTarget) {
    const addedStr = prompt(`Enter amount to ADD to your goal savings (${currentCurrency}):`, '100');
    if (addedStr === null) return;
    const added = parseFloat(addedStr);
    if (isNaN(added) || added <= 0) {
        alert('Please enter a valid positive savings amount to add.');
        return;
    }

    const res = await fetchWithAuth(`/api/dashboard/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add_amount: added })
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
        if (data.level_up) {
            showAchievementPopup({
                title: `🏆 Milestone Level Unlocked!`,
                subtitle: `Congratulations! You unlocked Level ${data.new_level}: ${data.unlocked_title}!`,
                xp: data.xp_gained || 50,
                badge: data.unlocked_title
            });
        }
        loadDashboardData();
    }
}

function addGoalSavings(id, currentSaved, currentTarget) {
    addGoalSavingsModal(id, currentSaved, currentTarget);
}


// Savings Opportunities & Hidden Expenses Engine (Tabbed Module)
let currentSavingsTab = 'leaks';

function switchSavingsTab(tabName) {
    currentSavingsTab = tabName;
    ['leaks', 'opps', 'coach'].forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        if (btn) {
            if (t === tabName) {
                btn.className = 'btn active-sub-tab';
            } else {
                btn.className = 'btn inactive-sub-tab';
            }
        }
    });
    loadSavingsOpportunities();
}

async function loadSavingsOpportunities() {
    const res = await fetchWithAuth('/api/subscriptions/savings-opportunities');
    const data = await res.json();
    if (data.error) return;

    window.lastSavingsData = data;

    // Update potential savings badge in header
    const badge = document.getElementById('potential-savings-badge');
    if (badge) {
        badge.innerHTML = `<i class="fa-solid fa-piggy-bank"></i> Potential Savings: ${fmt(data.total_potential_savings)}/mo`;
    }

    const container = document.getElementById('savings-opportunities-container');
    if (!container) return;

    let html = '';

    if (currentSavingsTab === 'leaks') {
        // Tab 1: 💸 Money Leaks
        const top3 = data.top_3_categories || [];

        html = `
            <!-- Monthly Comparison Pill -->
            <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:12px; border-radius:var(--radius-md); margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Current Month Outflow</div>
                    <div style="font-size:20px; font-weight:800; color:var(--text-main); margin-top:2px;">${fmt(data.current_month_total || 0)}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px; color:var(--text-muted); font-weight:700;">VS LAST MONTH</div>
                    <span style="font-size:12px; font-weight:800; padding:4px 10px; border-radius:12px; background:rgba(99,102,241,0.15); color:var(--primary); border:1px solid var(--border-glow);">
                        ${data.comparison_label || 'New spending pattern'}
                    </span>
                </div>
            </div>

            <!-- Top 3 Category Cards (Requirement 9 & 8: Hide zero categories) -->
            <div style="font-size:12px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;">Top Spending Categories</div>
            ${top3.length === 0 ? `
                <div style="color:var(--text-muted); font-size:12px; text-align:center; padding:12px; background:var(--bg-inner); border-radius:var(--radius-md); margin-bottom:14px;">
                    No expenses recorded this month yet. Add expenses to analyze leaks!
                </div>
            ` : `
                <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
                    ${top3.map(c => `
                        <div class="feature-box" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px;">
                            <div style="font-size:14px; font-weight:800; display:flex; align-items:center; gap:8px;">
                                <span>${c.icon}</span> <span>${c.name}</span>
                            </div>
                            <div style="font-size:15px; font-weight:800; color:var(--accent-red);">
                                ${fmt(c.amount)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}

            <button class="btn btn-secondary" style="width:100%; font-size:12px;" onclick="openSavingsDetailsModal()">
                <i class="fa-solid fa-chart-line"></i> View Details & Full Breakdown
            </button>
        `;
    } else if (currentSavingsTab === 'opps') {
        // Tab 2: 💡 Savings Opportunities
        html = `
            <!-- Total Potential Monthly Savings Banner -->
            <div style="background:rgba(16,185,129,0.12); border:1.5px solid var(--accent-green); padding:14px; border-radius:var(--radius-md); margin-bottom:14px;">
                <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Calculated Monthly Savings Potential</div>
                <div style="font-size:26px; font-weight:900; color:var(--accent-green); margin-top:2px;">
                    ${fmt(data.total_potential_savings)} <span style="font-size:13px; font-weight:600; color:var(--text-muted);">/ month</span>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; background:var(--bg-inner); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-glass); font-size:12px;">
                    <span><i class="fa-solid fa-fire text-amber-400"></i> Unused Subscriptions</span>
                    <strong style="color:var(--accent-green);">+${fmt(data.unused_sub_savings)}/mo</strong>
                </div>
                <div style="display:flex; justify-content:space-between; background:var(--bg-inner); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-glass); font-size:12px;">
                    <span><i class="fa-solid fa-scissors text-indigo-400"></i> Reducible Expenses</span>
                    <strong style="color:var(--accent-green);">+${fmt(data.reducible_expenses)}/mo</strong>
                </div>
            </div>

            <!-- Dream Goal Acceleration Impact -->
            ${(data.goal_impacts && data.goal_impacts.length > 0) ? `
                <div style="background:rgba(99,102,241,0.12); border:1.5px solid var(--border-glow); padding:12px; border-radius:var(--radius-md); margin-bottom:12px;">
                    <div style="font-size:12px; font-weight:800; color:#ffffff; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-rocket text-indigo-400"></i> Dream Goal Acceleration
                    </div>
                    ${data.goal_impacts.map(g => `
                        <div style="font-size:12px; font-weight:700; color:#fcd34d; margin-top:4px;">
                            🏖️ ${g.title} completed <strong>${g.months_earlier} month${g.months_earlier > 1 ? 's' : ''} earlier</strong>!
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <button class="btn btn-secondary" style="width:100%; font-size:12px;" onclick="openSavingsDetailsModal()">
                <i class="fa-solid fa-chart-line"></i> View Details
            </button>
        `;
    } else if (currentSavingsTab === 'coach') {
        // Tab 3: 🤖 AI Coach
        html = `
            <div style="background:rgba(99,102,241,0.12); border:1px solid var(--border-glow); padding:12px; border-radius:var(--radius-md); margin-bottom:14px; display:flex; align-items:center; gap:10px;">
                <i class="fa-solid fa-robot" style="font-size:24px; color:var(--primary);"></i>
                <div>
                    <div style="font-size:13px; font-weight:800; color:#ffffff;">FinPilot AI Behavioral Coach</div>
                    <div style="font-size:11px; color:var(--text-muted);">Real-time personalized advice from your spending data.</div>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
                ${(data.insights || []).map((ins, idx) => `
                    <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:10px 12px; border-radius:var(--radius-sm); font-size:12px; display:flex; align-items:flex-start; gap:8px;">
                        <span style="background:var(--primary-glow); color:var(--primary); font-weight:800; border-radius:50%; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; font-size:11px;">${idx + 1}</span>
                        <div style="color:var(--text-main); font-weight:600; line-height:1.4;">${ins}</div>
                    </div>
                `).join('')}
            </div>

            <button class="btn btn-secondary" style="width:100%; font-size:12px;" onclick="openSavingsDetailsModal()">
                <i class="fa-solid fa-chart-line"></i> View Details
            </button>
        `;
    }

    container.innerHTML = html;

    // Auto-update details modal if currently open (Requirement 12)
    const modal = document.getElementById('modal-savings-details');
    if (modal && modal.style.display === 'flex') {
        openSavingsDetailsModal();
    }
}

function openSavingsDetailsModal() {
    const data = window.lastSavingsData || {};

    const currentMonthTotal = data.currentMonthTotal ?? data.current_month_total ?? 0;
    const lastMonthTotal = data.lastMonthTotal ?? data.last_month_total ?? data.prev_month_total ?? 0;
    
    let trend = data.trend || data.comparison_label;
    if (!lastMonthTotal || lastMonthTotal === 0) {
        trend = "No previous data";
    }

    const cats = data.categoryBreakdown || data.active_categories || [];

    const body = document.getElementById('savings-details-body');
    if (!body) return;

    body.innerHTML = `
        <!-- Monthly Comparison Banner -->
        <div style="background:var(--bg-inner); border:1px solid var(--border-glass); padding:14px; border-radius:var(--radius-md); margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">This Month Spending</div>
                    <div style="font-size:22px; font-weight:800; color:var(--accent-red); margin-top:2px;">${fmt(currentMonthTotal)}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Last Month</div>
                    <div style="font-size:18px; font-weight:700; color:var(--text-main); margin-top:2px;">${fmt(lastMonthTotal)}</div>
                </div>
            </div>
            <div style="margin-top:10px; padding-top:8px; border-top:1px solid var(--border-glass); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; color:var(--text-muted);">Spending Trend:</span>
                <span style="font-size:12px; font-weight:800; padding:3px 10px; border-radius:12px; background:rgba(99,102,241,0.15); color:var(--primary); border:1px solid var(--border-glow);">
                    ${trend}
                </span>
            </div>
        </div>

        <!-- Category Expense Breakdown (Hide zero categories - Requirement 8) -->
        <div style="font-size:13px; font-weight:800; margin-bottom:8px; color:var(--text-main);"><i class="fa-solid fa-list-ul text-indigo-400"></i> Category Expense Breakdown</div>
        <div style="max-height:180px; overflow-y:auto; background:var(--bg-inner); border:1px solid var(--border-glass); border-radius:var(--radius-md); padding:10px; margin-bottom:16px;">
            ${cats.length === 0 ? `
                <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:12px;">No expenses recorded yet for this month.</div>
            ` : cats.map(c => `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-glass); padding:8px 0; font-size:13px;">
                    <span>${c.icon} ${c.name}</span>
                    <strong style="color:var(--accent-red);">${fmt(c.amount)}</strong>
                </div>
            `).join('')}
        </div>

        <!-- Dynamic AI Recommendations -->
        <div style="font-size:13px; font-weight:800; margin-bottom:8px; color:var(--text-main);"><i class="fa-solid fa-lightbulb text-amber-400"></i> Dynamic AI Recommendations</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
            ${(data.insights || data.recommendations || []).map(ins => `
                <div style="font-size:12px; color:var(--text-main); background:rgba(99,102,241,0.1); padding:8px 12px; border-radius:var(--radius-sm); border-left:3px solid var(--primary);">
                    ${ins}
                </div>
            `).join('')}
        </div>
    `;

    openModal('modal-savings-details');
}

// Global Account Creation Month State
let userCreatedYear = 2026;
let userCreatedMonth = 7;

function updateMonthSelectorOptions(createdYear, createdMonth) {
    const mSelect = document.getElementById('analytics-month-select');
    const yInput = document.getElementById('analytics-year-num');
    if (!mSelect || !yInput) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const currentSelYear = parseInt(yInput.value, 10) || currentYear;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    for (let i = 0; i < mSelect.options.length; i++) {
        const opt = mSelect.options[i];
        const monthNum = parseInt(opt.value, 10);

        const isBeforeRegistration = (currentSelYear < createdYear) || (currentSelYear === createdYear && monthNum < createdMonth);
        const isFutureMonth = (currentSelYear > currentYear) || (currentSelYear === currentYear && monthNum > currentMonth);

        if (isBeforeRegistration) {
            opt.disabled = true;
            opt.text = `❌ ${monthNames[monthNum - 1]} (before registration)`;
        } else if (isFutureMonth) {
            opt.disabled = true;
            opt.text = `❌ ${monthNames[monthNum - 1]} (future month)`;
        } else {
            opt.disabled = false;
            opt.text = `✅ ${monthNames[monthNum - 1]}`;
        }
    }
}

// Roll Down Month Dropdown & Typed Year Input Engine
function initAnalyticsMonthInput() {
    const mSelect = document.getElementById('analytics-month-select');
    const yInput = document.getElementById('analytics-year-num');
    if (!mSelect || !yInput) return;

    const now = new Date();
    if (!mSelect.value) {
        const padM = String(now.getMonth() + 1).padStart(2, '0');
        mSelect.value = padM;
    }
    if (!yInput.value) {
        yInput.value = now.getFullYear();
    }
    updateMonthSelectorOptions(userCreatedYear, userCreatedMonth);
}

async function onAnalyticsMonthChange() {
    const mSelect = document.getElementById('analytics-month-select');
    const yInput = document.getElementById('analytics-year-num');
    if (!mSelect || !yInput || !mSelect.value || !yInput.value) return;

    updateMonthSelectorOptions(userCreatedYear, userCreatedMonth);

    const monthStr = String(mSelect.value).padStart(2, '0');
    const monthInt = parseInt(monthStr, 10);
    const yearInt = parseInt(yInput.value, 10);

    if (isNaN(yearInt) || yearInt < 2000 || yearInt > 2100) return;
    const yearStr = String(yearInt);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[monthInt - 1] || monthStr;

    const titleDisp = document.getElementById('analytics-month-title-display');
    if (titleDisp) {
        titleDisp.innerText = `Analytics & Monthly Report - ${monthName} ${yearStr}`;
    }

    await loadAnalyticsDataForMonth(yearStr, monthStr);
}

async function loadAnalyticsDataForMonth(year, month) {
    const padMonth = String(month).padStart(2, '0');
    const res = await fetchWithAuth(`/api/expenses?month=${padMonth}&year=${year}`);
    const rawData = await res.json();

    const analyticsTbody = document.getElementById('tbody-analytics-expenses');

    if (rawData && rawData.not_available) {
        if (analyticsTbody) {
            const msg = rawData.message || 'Data is not available for this month.';
            analyticsTbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#f59e0b; font-weight:700;"><i class="fa-solid fa-circle-exclamation"></i> ${msg}</td></tr>`;
        }
        renderCharts([], [], []);
        await loadSavingsOpportunities(padMonth, year);
        return;
    }

    const targetYM = `${year}-${padMonth}`;
    const monthExpenses = Array.isArray(rawData) ? rawData.filter(e => {
        if (!e.date) return false;
        return String(e.date).startsWith(targetYM);
    }) : [];

    if (analyticsTbody) {
        if (monthExpenses.length > 0) {
            analyticsTbody.innerHTML = monthExpenses.map(e => {
                const formattedDate = e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const formattedTime = e.created_at ? new Date(e.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                return `
                    <tr style="border-bottom:1px solid var(--border-glass);">
                        <td style="padding:10px; font-weight:600;">${e.title} ${e.is_impulse ? '<span style="color:var(--accent-red); font-size:10px;">[Impulse]</span>' : ''}</td>
                        <td style="padding:10px; color:var(--text-muted);">${e.category}</td>
                        <td style="padding:10px; font-weight:700; color:var(--accent-red);">${fmt(e.amount)}</td>
                        <td style="padding:10px; font-size:12px; color:var(--text-muted);">${formattedDate} ${formattedTime ? `<span style="font-size:11px; opacity:0.8;">• ${formattedTime}</span>` : ''}</td>
                        <td style="padding:10px;"><span style="background:rgba(99,102,241,0.15); padding:2px 8px; border-radius:12px; font-size:11px;">${e.mood || 'Neutral'}</span></td>
                        <td style="padding:10px;">
                            <button class="btn btn-danger" style="padding:3px 8px; font-size:11px;" onclick="deleteExpenseItem(${e.id})"><i class="fa-solid fa-trash"></i> Delete</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            analyticsTbody.innerHTML = `<tr><td colspan="6" style="padding:16px; text-align:center; color:var(--text-muted);">No financial activity found for this month.</td></tr>`;
        }
    }

    renderCharts(monthExpenses, [], []);
    await loadSavingsOpportunities(padMonth, year);
}

async function downloadSelectedMonthPdf() {
    const mSelect = document.getElementById('analytics-month-select');
    const yInput = document.getElementById('analytics-year-num');
    let month = '', year = '';
    
    if (mSelect && mSelect.value && yInput && yInput.value) {
        month = String(mSelect.value).padStart(2, '0');
        year = String(yInput.value);
    } else {
        const now = new Date();
        year = String(now.getFullYear());
        month = String(now.getMonth() + 1).padStart(2, '0');
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[parseInt(month, 10) - 1] || 'Month';

    try {
        const res = await fetchWithAuth(`/api/dashboard/reports/download?month=${month}&year=${year}`);

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const msg = errData.error || `Monthly Report Not Available for ${monthName} ${year}.`;
            return alert(msg);
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/pdf')) {
            const errData = await res.json().catch(() => ({}));
            return alert(errData.error || `Monthly Report Not Available for ${monthName} ${year}.`);
        }

        const blob = await res.blob();
        const filename = `monthly_report_${monthName}_${year}.pdf`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (err) {
        console.error('PDF download error:', err);
        alert(`Monthly Report Not Available for ${monthName} ${year}.`);
    }
}



