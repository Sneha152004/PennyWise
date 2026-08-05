const request = require('supertest');
const express = require('express');
const cors = require('cors');
const db = require('../../db/db');
const { router: authRouter } = require('../../routes/auth');
const aiRouter = require('../../routes/ai');
const subscriptionsRouter = require('../../routes/subscriptions');
const gamificationRouter = require('../../routes/gamification');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/gamification', gamificationRouter);

beforeAll(async () => {
    await db.initDb();
});

describe('AI Behavior Suite & Features Unit Tests', () => {
    let token = '';

    beforeAll(async () => {
        const email = `qa_ai_${Date.now()}@finpilot.ai`;
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'AI Tester', email, password: 'password123' });
        token = res.body.token;
    });

    test('1. "Should I Buy It?" Purchase Advisor', async () => {
        const res = await request(app)
            .post('/api/ai/should-i-buy')
            .set('Authorization', `Bearer ${token}`)
            .send({ item_name: 'Smart Watch', price: 250 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('recommendation');
        expect(res.body).toHaveProperty('explanation');
    });

    test('2. Regret Predictor Analysis', async () => {
        const res = await request(app)
            .post('/api/ai/predict-regret')
            .set('Authorization', `Bearer ${token}`)
            .send({ item_name: 'Fast Food Dinner', category: 'Dining & Drinks', price: 45 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('prediction');
        expect(res.body).toHaveProperty('average_satisfaction');
    });

    test('3. Opportunity Cost Calculator', async () => {
        const res = await request(app)
            .post('/api/ai/opportunity-cost')
            .set('Authorization', `Bearer ${token}`)
            .send({ item_name: 'Designer Shoes', price: 180 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('equivalents');
        expect(Array.isArray(res.body.equivalents)).toBe(true);
    });

    test('4. Future Savings Simulator', async () => {
        const res = await request(app)
            .post('/api/ai/future-simulator')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Food', reduction_pct: 20 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('savings_1_year');
        expect(res.body).toHaveProperty('savings_5_years');
    });

    test('5. Subscription Detector (Subscription Killer)', async () => {
        const res = await request(app)
            .get('/api/subscriptions')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('subscriptions');
        expect(res.body).toHaveProperty('potential_yearly_savings');
    });

    test('6. Gamification Badges & Savings Challenges', async () => {
        const res = await request(app)
            .get('/api/gamification')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('badges');
        expect(res.body).toHaveProperty('challenges');
    });
});
