const request = require('supertest');
const express = require('express');
const cors = require('cors');
const db = require('../../db/db');
const { router: authRouter } = require('../../routes/auth');
const dashboardRouter = require('../../routes/dashboard');
const expensesRouter = require('../../routes/expenses');
const aiRouter = require('../../routes/ai');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/ai', aiRouter);

beforeAll(async () => {
    await db.initDb();
});

describe('System Integration E2E Workflows', () => {

    test('Flow 1: Register -> Login -> Add expense -> Update budget -> Generate report', async () => {
        const user = {
            name: 'Workflow One User',
            email: `qa_flow1_${Date.now()}@finpilot.ai`,
            password: 'password123'
        };

        // Step 1: Register
        const regRes = await request(app)
            .post('/api/auth/register')
            .send(user);
        expect(regRes.statusCode).toBe(200);

        // Step 2: Login
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: user.email, password: user.password });
        expect(loginRes.statusCode).toBe(200);
        const token = loginRes.body.token;

        // Step 3: Add expense
        const expRes = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Coffee & Snacks', amount: 15.50, category: 'Dining & Drinks', mood: 'Happy' });
        expect(expRes.statusCode).toBe(200);

        // Step 4: Create & Update budget
        const budgetRes = await request(app)
            .post('/api/dashboard/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Dining & Drinks', monthly_limit: 150.00 });
        expect(budgetRes.statusCode).toBe(200);
        const budgetId = budgetRes.body.id;

        const updateBudgetRes = await request(app)
            .put(`/api/dashboard/budgets/${budgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ monthly_limit: 200.00 });
        expect(updateBudgetRes.statusCode).toBe(200);

        // Step 5: Generate report
        const reportRes = await request(app)
            .post('/api/dashboard/reports/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({ report_type: 'Monthly Summary', file_format: 'PDF' });
        expect(reportRes.statusCode).toBe(200);
        expect(reportRes.body.report).toHaveProperty('title');
    });

    test('Flow 2: Login -> Add income -> AI insight -> Dashboard update', async () => {
        const user = {
            name: 'Workflow Two User',
            email: `qa_flow2_${Date.now()}@finpilot.ai`,
            password: 'password123'
        };

        const regRes = await request(app)
            .post('/api/auth/register')
            .send(user);
        const token = regRes.body.token;

        // Step 1: Add income
        const incRes = await request(app)
            .post('/api/expenses/income')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Freelance Design Bonus', amount: 850.00, category: 'Side Hustle' });
        expect(incRes.statusCode).toBe(200);

        // Step 2: Query AI insight (Should I Buy It)
        const aiRes = await request(app)
            .post('/api/ai/should-i-buy')
            .set('Authorization', `Bearer ${token}`)
            .send({ item_name: 'New Monitor', price: 300 });
        expect(aiRes.statusCode).toBe(200);
        expect(aiRes.body).toHaveProperty('recommendation');

        // Step 3: Fetch Dashboard update
        const dashRes = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${token}`);
        expect(dashRes.statusCode).toBe(200);
        expect(dashRes.body.summary.total_income).toBeGreaterThanOrEqual(850.00);
    });

    test('Flow 3: Delete account -> Verify data cleanup across tables', async () => {
        const user = {
            name: 'Workflow Three User',
            email: `qa_flow3_${Date.now()}@finpilot.ai`,
            password: 'password123'
        };

        const regRes = await request(app)
            .post('/api/auth/register')
            .send(user);
        const token = regRes.body.token;
        const userId = regRes.body.user.id;

        // Add dummy data for this user
        await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Test Item', amount: 25.00, category: 'Shopping' });

        await request(app)
            .post('/api/dashboard/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Shopping', monthly_limit: 100.00 });

        // Delete account
        const delRes = await request(app)
            .delete('/api/auth/account')
            .set('Authorization', `Bearer ${token}`);
        expect(delRes.statusCode).toBe(200);

        // Verify data cleanup in database directly
        const dbUsers = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        expect(dbUsers.length).toBe(0);

        const dbExpenses = await db.query('SELECT * FROM expenses WHERE user_id = ?', [userId]);
        expect(dbExpenses.length).toBe(0);

        const dbBudgets = await db.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);
        expect(dbBudgets.length).toBe(0);
    });
});
