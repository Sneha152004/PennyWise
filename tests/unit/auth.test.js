const request = require('supertest');
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('../../db/db');
const { router: authRouter } = require('../../routes/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);

beforeAll(async () => {
    await db.initDb();
});

describe('Authentication Unit & Security Tests', () => {
    const testUser = {
        name: 'QA Test User',
        email: `qa_auth_${Date.now()}@finpilot.ai`,
        password: 'password123',
        country: 'United States',
        currency: '$'
    };
    let token = '';

    test('1. Register new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('email', testUser.email);
        token = res.body.token;
    });

    test('2. Login user with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(testUser.email);
    });

    test('3. Login failure with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'wrongpassword' });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('4. Access protected profile with valid token', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.user.email).toBe(testUser.email);
    });

    test('5. Reject protected route access without token (401 Unauthorized)', async () => {
        const res = await request(app)
            .get('/api/auth/profile');
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    test('6. Reject protected route access with invalid token (403 Forbidden)', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', 'Bearer invalid_junk_token_123');
        expect(res.statusCode).toBe(403);
        expect(res.body).toHaveProperty('error');
    });

    test('7. Forgot Password reset', async () => {
        const resetRes = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: testUser.email, newPassword: 'newpassword123' });
        expect(resetRes.statusCode).toBe(200);

        // Verify login with new password
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'newpassword123' });
        expect(loginRes.statusCode).toBe(200);
        token = loginRes.body.token;
    });

    test('8. Delete Account and verify complete cleanup', async () => {
        const delRes = await request(app)
            .delete('/api/auth/account')
            .set('Authorization', `Bearer ${token}`);
        expect(delRes.statusCode).toBe(200);

        // Confirm user cannot login anymore
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'newpassword123' });
        expect(loginRes.statusCode).toBe(400);
    });
});
