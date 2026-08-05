const request = require('supertest');
const express = require('express');
const cors = require('cors');
const db = require('../../db/db');
const { router: authRouter } = require('../../routes/auth');
const expensesRouter = require('../../routes/expenses');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/expenses', expensesRouter);

beforeAll(async () => {
    await db.initDb();
});

describe('Expenses Module Unit Tests', () => {
    let token = '';

    beforeAll(async () => {
        const email = `qa_exp_${Date.now()}@finpilot.ai`;
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Expense Tester', email, password: 'password123' });
        token = res.body.token;
    });

    let expenseId = null;

    test('1. Add new expense with category and mood', async () => {
        const res = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Organic Market Groceries',
                amount: 75.50,
                category: 'Food & Groceries',
                location: 'Whole Foods Market',
                mood: 'Happy'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id');
        expenseId = res.body.id;
    });

    test('2. List user expenses', async () => {
        const res = await request(app)
            .get('/api/expenses')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].title).toBe('Organic Market Groceries');
    });

    test('3. Edit expense details', async () => {
        const res = await request(app)
            .put(`/api/expenses/${expenseId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Organic Market Groceries (Updated)',
                amount: 82.00,
                category: 'Food & Groceries',
                mood: 'Neutral'
            });
        expect(res.statusCode).toBe(200);

        // Verify updated expense
        const getRes = await request(app)
            .get('/api/expenses')
            .set('Authorization', `Bearer ${token}`);
        const updated = getRes.body.find(e => e.id === expenseId);
        expect(updated.title).toBe('Organic Market Groceries (Updated)');
        expect(updated.amount).toBe(82.00);
    });

    test('4. Update expense satisfaction score', async () => {
        const res = await request(app)
            .put(`/api/expenses/${expenseId}/satisfaction`)
            .set('Authorization', `Bearer ${token}`)
            .send({ score: 9 });
        expect(res.statusCode).toBe(200);
    });

    test('5. Delete expense', async () => {
        const res = await request(app)
            .delete(`/api/expenses/${expenseId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);

        // Verify expense is deleted
        const getRes = await request(app)
            .get('/api/expenses')
            .set('Authorization', `Bearer ${token}`);
        const found = getRes.body.find(e => e.id === expenseId);
        expect(found).toBeUndefined();
    });
});
