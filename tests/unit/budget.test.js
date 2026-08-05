const request = require('supertest');
const express = require('express');
const cors = require('cors');
const db = require('../../db/db');
const { router: authRouter } = require('../../routes/auth');
const dashboardRouter = require('../../routes/dashboard');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);

beforeAll(async () => {
    await db.initDb();
});

describe('Budget & Reports Module Unit Tests', () => {
    let token = '';

    beforeAll(async () => {
        const email = `qa_budget_${Date.now()}@finpilot.ai`;
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Budget Tester', email, password: 'password123' });
        token = res.body.token;
    });

    let budgetId = null;

    test('1. Create new monthly category budget', async () => {
        const res = await request(app)
            .post('/api/dashboard/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Dining Out', monthly_limit: 350.00, alert_threshold: 80 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id');
        budgetId = res.body.id;
    });

    test('2. Update monthly budget limit', async () => {
        const res = await request(app)
            .put(`/api/dashboard/budgets/${budgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ monthly_limit: 400.00, alert_threshold: 85 });
        expect(res.statusCode).toBe(200);
    });

    test('3. Fetch dashboard summary including budgets', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('budgets');
        const found = res.body.budgets.find(b => b.id === budgetId);
        expect(found).toBeDefined();
        expect(found.monthly_limit).toBe(400.00);
    });

    test('4. Delete budget', async () => {
        const res = await request(app)
            .delete(`/api/dashboard/budgets/${budgetId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    test('5. Generate monthly summary report', async () => {
        const genRes = await request(app)
            .post('/api/dashboard/reports/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({ report_type: 'Monthly Summary', file_format: 'PDF' });
        expect(genRes.statusCode).toBe(200);
        expect(genRes.body).toHaveProperty('report');

        const listRes = await request(app)
            .get('/api/dashboard/reports')
            .set('Authorization', `Bearer ${token}`);
        expect(listRes.statusCode).toBe(200);
        expect(Array.isArray(listRes.body)).toBe(true);
        expect(listRes.body.length).toBeGreaterThan(0);
    });
});
