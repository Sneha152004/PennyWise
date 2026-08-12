const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generateDiagrams() {
    const assetsDir = path.join(__dirname, '..', 'report', 'assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    console.log("🚀 Launching Playwright to render high-res architecture & system diagrams...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });

    // HTML templates for SVG rendering
    const createDiagramHtml = (title, svgContent) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 30px;
                    background: #0f172a;
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    color: #f8fafc;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    width: 1200px;
                    height: 800px;
                }
                .title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #6366f1;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .container {
                    background: rgba(30, 41, 59, 0.8);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                    width: 1060px;
                    height: 660px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                svg {
                    width: 100%;
                    height: 100%;
                }
            </style>
        </head>
        <body>
            <div class="title">${title}</div>
            <div class="container">
                ${svgContent}
            </div>
        </body>
        </html>
    `;

    // 1. High-Level Architecture Diagram
    const archSvg = `
        <svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
                </linearGradient>
            </defs>
            <!-- Frontend Layer -->
            <rect x="50" y="80" width="260" height="440" rx="16" fill="url(#grad1)" opacity="0.15" stroke="#6366f1" stroke-width="2"/>
            <text x="180" y="115" fill="#a5b4fc" font-size="18" font-weight="bold" text-anchor="middle">PRESENTATION LAYER</text>
            <rect x="70" y="140" width="220" height="70" rx="10" fill="#1e293b" stroke="#6366f1" stroke-width="1.5"/>
            <text x="180" y="170" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">HTML5 / CSS3 SPA Interface</text>
            <text x="180" y="190" fill="#94a3b8" font-size="12" text-anchor="middle">Glassmorphism UI, Responsive Cards</text>

            <rect x="70" y="230" width="220" height="70" rx="10" fill="#1e293b" stroke="#6366f1" stroke-width="1.5"/>
            <text x="180" y="260" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">Vanilla JS Controller</text>
            <text x="180" y="280" fill="#94a3b8" font-size="12" text-anchor="middle">app.js, Fetch API, Auth Handling</text>

            <rect x="70" y="320" width="220" height="70" rx="10" fill="#1e293b" stroke="#6366f1" stroke-width="1.5"/>
            <text x="180" y="350" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">Chart.js Visualization</text>
            <text x="180" y="370" fill="#94a3b8" font-size="12" text-anchor="middle">Mood Charts, Budget Progress</text>

            <rect x="70" y="410" width="220" height="70" rx="10" fill="#1e293b" stroke="#6366f1" stroke-width="1.5"/>
            <text x="180" y="440" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">Local State Management</text>
            <text x="180" y="460" fill="#94a3b8" font-size="12" text-anchor="middle">JWT Storage, User Profiles</text>

            <!-- Arrows 1 -->
            <line x1="310" y1="300" x2="370" y2="300" stroke="#a5b4fc" stroke-width="3" marker-end="url(#arrow)"/>
            <text x="340" y="290" fill="#a5b4fc" font-size="11" text-anchor="middle">REST / JSON</text>

            <!-- Application Layer -->
            <rect x="370" y="80" width="260" height="440" rx="16" fill="url(#grad2)" opacity="0.15" stroke="#3b82f6" stroke-width="2"/>
            <text x="500" y="115" fill="#93c5fd" font-size="18" font-weight="bold" text-anchor="middle">APPLICATION BACKEND</text>

            <rect x="390" y="140" width="220" height="70" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="500" y="170" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">Node.js / Express Server</text>
            <text x="500" y="190" fill="#94a3b8" font-size="12" text-anchor="middle">server.js, Middleware Stack</text>

            <rect x="390" y="230" width="220" height="70" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="500" y="260" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">JWT Auth Guard</text>
            <text x="500" y="280" fill="#94a3b8" font-size="12" text-anchor="middle">bcrypt Password Hashing</text>

            <rect x="390" y="320" width="220" height="70" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="500" y="350" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">AI Behavior Suite</text>
            <text x="500" y="370" fill="#94a3b8" font-size="12" text-anchor="middle">Regret Engine, Buy Advisor</text>

            <rect x="390" y="410" width="220" height="70" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="500" y="440" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">PDFKit Report Engine</text>
            <text x="500" y="460" fill="#94a3b8" font-size="12" text-anchor="middle">Dynamic PDF Generation</text>

            <!-- Arrows 2 -->
            <line x1="630" y1="300" x2="690" y2="300" stroke="#93c5fd" stroke-width="3"/>

            <!-- Database Layer -->
            <rect x="690" y="80" width="260" height="440" rx="16" fill="url(#grad3)" opacity="0.15" stroke="#10b981" stroke-width="2"/>
            <text x="820" y="115" fill="#6ee7b7" font-size="18" font-weight="bold" text-anchor="middle">PERSISTENCE LAYER</text>

            <rect x="710" y="160" width="220" height="100" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
            <text x="820" y="195" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">Neon PostgreSQL (Cloud)</text>
            <text x="820" y="220" fill="#6ee7b7" font-size="12" text-anchor="middle">Production Database</text>
            <text x="820" y="240" fill="#94a3b8" font-size="11" text-anchor="middle">21 Tables, SSL WebSockets</text>

            <rect x="710" y="300" width="220" height="100" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
            <text x="820" y="335" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">Local SQLite (Fallback)</text>
            <text x="820" y="360" fill="#6ee7b7" font-size="12" text-anchor="middle">finpilot.db</text>
            <text x="820" y="380" fill="#94a3b8" font-size="11" text-anchor="middle">Local Testing & Development</text>
        </svg>
    `;

    // Render & Save Fig 3.1
    console.log("Generating Diagram 3.1: Architecture...");
    await page.setContent(createDiagramHtml("Figure 3.1 — High-Level System Architecture", archSvg));
    await page.screenshot({ path: path.join(assetsDir, 'fig_3_1_architecture.png') });

    // 2. Use Case Diagram
    const usecaseSvg = `
        <svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
            <!-- Actor -->
            <circle cx="120" cy="270" r="30" fill="#6366f1"/>
            <line x1="120" y1="300" x2="120" y2="380" stroke="#6366f1" stroke-width="4"/>
            <line x1="80" y1="330" x2="160" y2="330" stroke="#6366f1" stroke-width="4"/>
            <line x1="120" y1="380" x2="80" y2="450" stroke="#6366f1" stroke-width="4"/>
            <line x1="120" y1="380" x2="160" y2="450" stroke="#6366f1" stroke-width="4"/>
            <text x="120" y="480" fill="#ffffff" font-size="16" font-weight="bold" text-anchor="middle">User / Account Owner</text>

            <!-- System Boundary -->
            <rect x="250" y="40" width="700" height="520" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
            <text x="600" y="75" fill="#93c5fd" font-size="18" font-weight="bold" text-anchor="middle">PennyWise System Boundary</text>

            <!-- Use Cases -->
            <g transform="translate(300, 100)">
                <ellipse cx="140" cy="30" rx="110" ry="25" fill="#0f172a" stroke="#6366f1" stroke-width="2"/>
                <text x="140" y="35" fill="#ffffff" font-size="13" text-anchor="middle">Register & JWT Login</text>

                <ellipse cx="440" cy="30" rx="110" ry="25" fill="#0f172a" stroke="#6366f1" stroke-width="2"/>
                <text x="440" y="35" fill="#ffffff" font-size="13" text-anchor="middle">Manage Income & Deductions</text>

                <ellipse cx="140" cy="110" rx="110" ry="25" fill="#0f172a" stroke="#10b981" stroke-width="2"/>
                <text x="140" y="115" fill="#ffffff" font-size="13" text-anchor="middle">Record Expense & Mood</text>

                <ellipse cx="440" cy="110" rx="110" ry="25" fill="#0f172a" stroke="#10b981" stroke-width="2"/>
                <text x="440" y="115" fill="#ffffff" font-size="13" text-anchor="middle">View Dashboard Analytics</text>

                <ellipse cx="140" cy="190" rx="110" ry="25" fill="#0f172a" stroke="#f59e0b" stroke-width="2"/>
                <text x="140" y="195" fill="#ffffff" font-size="13" text-anchor="middle">Ask "Should I Buy It?"</text>

                <ellipse cx="440" cy="190" rx="110" ry="25" fill="#0f172a" stroke="#f59e0b" stroke-width="2"/>
                <text x="440" y="195" fill="#ffffff" font-size="13" text-anchor="middle">Evaluate Regret Predictor</text>

                <ellipse cx="140" cy="270" rx="110" ry="25" fill="#0f172a" stroke="#ec4899" stroke-width="2"/>
                <text x="140" y="275" fill="#ffffff" font-size="13" text-anchor="middle">Track Dream Savings Goals</text>

                <ellipse cx="440" cy="270" rx="110" ry="25" fill="#0f172a" stroke="#ec4899" stroke-width="2"/>
                <text x="440" y="275" fill="#ffffff" font-size="13" text-anchor="middle">Analyze Subscriptions</text>

                <ellipse cx="140" cy="350" rx="110" ry="25" fill="#0f172a" stroke="#8b5cf6" stroke-width="2"/>
                <text x="140" y="355" fill="#ffffff" font-size="13" text-anchor="middle">Earn XP & Badges</text>

                <ellipse cx="440" cy="350" rx="110" ry="25" fill="#0f172a" stroke="#8b5cf6" stroke-width="2"/>
                <text x="440" y="355" fill="#ffffff" font-size="13" text-anchor="middle">Check No-Spend Calendar</text>

                <ellipse cx="290" cy="430" rx="120" ry="28" fill="#0f172a" stroke="#06b6d4" stroke-width="2"/>
                <text x="290" y="435" fill="#ffffff" font-size="13" font-weight="bold" text-anchor="middle">Generate Monthly PDF Report</text>
            </g>

            <!-- Connecting Lines -->
            <line x1="160" y1="310" x2="440" y2="130" stroke="#475569" stroke-width="1.5"/>
            <line x1="160" y1="310" x2="440" y2="210" stroke="#475569" stroke-width="1.5"/>
            <line x1="160" y1="310" x2="440" y2="290" stroke="#475569" stroke-width="1.5"/>
            <line x1="160" y1="310" x2="440" y2="370" stroke="#475569" stroke-width="1.5"/>
            <line x1="160" y1="310" x2="440" y2="470" stroke="#475569" stroke-width="1.5"/>
        </svg>
    `;

    console.log("Generating Diagram 3.2: Use Case...");
    await page.setContent(createDiagramHtml("Figure 3.2 — System Use Case Diagram", usecaseSvg));
    await page.screenshot({ path: path.join(assetsDir, 'fig_3_2_usecase.png') });

    // 3. ER Diagram
    const erSvg = `
        <svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
            <!-- Entities -->
            <!-- Users -->
            <rect x="400" y="50" width="200" height="120" rx="10" fill="#1e1b4b" stroke="#6366f1" stroke-width="2"/>
            <rect x="400" y="50" width="200" height="35" rx="10" fill="#6366f1"/>
            <text x="500" y="73" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">USERS</text>
            <text x="415" y="100" fill="#a5b4fc" font-size="12">🔑 id (PK)</text>
            <text x="415" y="120" fill="#ffffff" font-size="12">• email, name, password</text>
            <text x="415" y="140" fill="#ffffff" font-size="12">• currency, monthly_budget</text>

            <!-- Expenses -->
            <rect x="80" y="240" width="200" height="130" rx="10" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
            <rect x="80" y="240" width="200" height="35" rx="10" fill="#10b981"/>
            <text x="180" y="263" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">EXPENSES</text>
            <text x="95" y="290" fill="#6ee7b7" font-size="12">🔑 id (PK)</text>
            <text x="95" y="310" fill="#93c5fd" font-size="12">🔗 user_id (FK)</text>
            <text x="95" y="330" fill="#ffffff" font-size="12">• amount, title, category</text>
            <text x="95" y="350" fill="#ffffff" font-size="12">• mood, impulse_flag, date</text>

            <!-- Savings Goals -->
            <rect x="380" y="240" width="240" height="130" rx="10" fill="#831843" stroke="#ec4899" stroke-width="2"/>
            <rect x="380" y="240" width="240" height="35" rx="10" fill="#ec4899"/>
            <text x="500" y="263" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">SAVINGS_GOALS (Dream Goals)</text>
            <text x="395" y="290" fill="#fbcfe8" font-size="12">🔑 id (PK)</text>
            <text x="395" y="310" fill="#93c5fd" font-size="12">🔗 user_id (FK)</text>
            <text x="395" y="330" fill="#ffffff" font-size="12">• title, target_amount, saved_amount</text>
            <text x="395" y="350" fill="#ffffff" font-size="12">• level, category, target_date</text>

            <!-- Subscriptions -->
            <rect x="700" y="240" width="220" height="130" rx="10" fill="#78350f" stroke="#f59e0b" stroke-width="2"/>
            <rect x="700" y="240" width="220" height="35" rx="10" fill="#f59e0b"/>
            <text x="810" y="263" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">SUBSCRIPTIONS</text>
            <text x="715" y="290" fill="#fde68a" font-size="12">🔑 id (PK)</text>
            <text x="715" y="310" fill="#93c5fd" font-size="12">🔗 user_id (FK)</text>
            <text x="715" y="330" fill="#ffffff" font-size="12">• service_name, cost_per_month</text>
            <text x="715" y="350" fill="#ffffff" font-size="12">• status, value_score, usage</text>

            <!-- Deductions -->
            <rect x="180" y="440" width="200" height="110" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="280" y="465" fill="#93c5fd" font-size="13" font-weight="bold" text-anchor="middle">DEDUCTIONS</text>
            <text x="195" y="490" fill="#94a3b8" font-size="11">🔑 id (PK), 🔗 user_id (FK)</text>
            <text x="195" y="510" fill="#ffffff" font-size="11">• type, amount, category</text>

            <!-- Reports -->
            <rect x="620" y="440" width="200" height="110" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="720" y="465" fill="#93c5fd" font-size="13" font-weight="bold" text-anchor="middle">REPORTS</text>
            <text x="635" y="490" fill="#94a3b8" font-size="11">🔑 id (PK), 🔗 user_id (FK)</text>
            <text x="635" y="510" fill="#ffffff" font-size="11">• month, year, pdf_path</text>

            <!-- Lines -->
            <line x1="430" y1="170" x2="220" y2="240" stroke="#6366f1" stroke-width="2"/>
            <line x1="500" y1="170" x2="500" y2="240" stroke="#6366f1" stroke-width="2"/>
            <line x1="570" y1="170" x2="770" y2="240" stroke="#6366f1" stroke-width="2"/>
            <line x1="500" y1="170" x2="280" y2="440" stroke="#475569" stroke-width="1.5" stroke-dasharray="4"/>
            <line x1="500" y1="170" x2="720" y2="440" stroke="#475569" stroke-width="1.5" stroke-dasharray="4"/>
        </svg>
    `;

    console.log("Generating Diagram 3.3: ER Diagram...");
    await page.setContent(createDiagramHtml("Figure 3.3 — Entity-Relationship (ER) Diagram", erSvg));
    await page.screenshot({ path: path.join(assetsDir, 'fig_3_3_er.png') });

    // 4. Data Flow Diagram
    const dataflowSvg = `
        <svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
            <!-- Steps -->
            <!-- Step 1 -->
            <rect x="50" y="240" width="180" height="120" rx="12" fill="#1e293b" stroke="#6366f1" stroke-width="2"/>
            <text x="140" y="275" fill="#a5b4fc" font-size="14" font-weight="bold" text-anchor="middle">1. USER ACTION</text>
            <text x="140" y="305" fill="#ffffff" font-size="12" text-anchor="middle">Click "Save Expense" /</text>
            <text x="140" y="325" fill="#ffffff" font-size="12" text-anchor="middle">Submit AI Query</text>

            <line x1="230" y1="300" x2="290" y2="300" stroke="#6366f1" stroke-width="3"/>

            <!-- Step 2 -->
            <rect x="290" y="240" width="190" height="120" rx="12" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
            <text x="385" y="275" fill="#93c5fd" font-size="14" font-weight="bold" text-anchor="middle">2. FETCH + JWT</text>
            <text x="385" y="305" fill="#ffffff" font-size="12" text-anchor="middle">frontend fetch API</text>
            <text x="385" y="325" fill="#ffffff" font-size="12" text-anchor="middle">Bearer Token Header</text>

            <line x1="480" y1="300" x2="540" y2="300" stroke="#3b82f6" stroke-width="3"/>

            <!-- Step 3 -->
            <rect x="540" y="240" width="190" height="120" rx="12" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
            <text x="635" y="275" fill="#fde68a" font-size="14" font-weight="bold" text-anchor="middle">3. EXPRESS ROUTE</text>
            <text x="635" y="305" fill="#ffffff" font-size="12" text-anchor="middle">JWT Verification</text>
            <text x="635" y="325" fill="#ffffff" font-size="12" text-anchor="middle">AI & Risk Calculation</text>

            <line x1="730" y1="300" x2="790" y2="300" stroke="#f59e0b" stroke-width="3"/>

            <!-- Step 4 -->
            <rect x="790" y="240" width="170" height="120" rx="12" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
            <text x="875" y="275" fill="#6ee7b7" font-size="14" font-weight="bold" text-anchor="middle">4. NEON DB</text>
            <text x="875" y="305" fill="#ffffff" font-size="12" text-anchor="middle">SQL Query</text>
            <text x="875" y="325" fill="#ffffff" font-size="12" text-anchor="middle">RETURNING id</text>

            <!-- Return Loop -->
            <path d="M 875 360 L 875 480 L 140 480 L 140 360" fill="none" stroke="#ec4899" stroke-width="2.5" stroke-dasharray="6"/>
            <rect x="420" y="455" width="200" height="40" rx="8" fill="#ec4899"/>
            <text x="520" y="480" fill="#ffffff" font-size="13" font-weight="bold" text-anchor="middle">5. JSON Response & Chart Render</text>
        </svg>
    `;

    console.log("Generating Diagram 3.4: Data Flow...");
    await page.setContent(createDiagramHtml("Figure 3.4 — Request / Response Data Flow Diagram", dataflowSvg));
    await page.screenshot({ path: path.join(assetsDir, 'fig_3_4_dataflow.png') });

    console.log("🎉 All Architecture & System Diagrams Rendered Successfully!");
    await browser.close();
}

generateDiagrams().catch(err => {
    console.error("Diagram generation failed:", err);
    process.exit(1);
});
