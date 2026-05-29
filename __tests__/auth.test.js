const request = require('supertest');
const app = require('../app');

// Use a unique email per test run to avoid duplicate key errors
const uniqueEmail = `testuser_${Date.now()}@test.com`;

describe('POST /api/auth/signup', () => {
    it('returns 400 if password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ name: 'Test User', email: 'missing@test.com' });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe('failure');
    });

    it('returns 400 if passwords do not match', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({
                name: 'Test User',
                email: `mismatch_${Date.now()}@test.com`,
                password: 'pass1234',
                confirmPassword: 'different'
            });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe('failure');
        expect(res.body.message).toMatch(/do not match/i);
    });

    it('creates a new user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({
                name: 'Test User',
                email: uniqueEmail,
                password: 'Test@1234',
                confirmPassword: 'Test@1234'
            });
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.message).toBe('user created successfully');
    });

    it('returns 500 for duplicate email', async () => {
        // Second signup with same email should fail with duplicate key
        const res = await request(app)
            .post('/api/auth/signup')
            .send({
                name: 'Test User',
                email: uniqueEmail,
                password: 'Test@1234',
                confirmPassword: 'Test@1234'
            });
        expect(res.status).toBe(500);
    });
});

describe('POST /api/auth/login', () => {
    it('returns 404 for non-existent user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nonexistent@test.com', password: 'wrongpassword' });
        expect(res.status).toBe(404);
        expect(res.body.status).toBe('failure');
    });

    it('returns 404 if email is missing (findOne returns null)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'somepassword' });
        expect(res.status).toBe(404);
    });

    it('returns 200 and sets JWT cookie for valid credentials', async () => {
        // First signup a fresh user
        const email = `logintest_${Date.now()}@test.com`;
        await request(app)
            .post('/api/auth/signup')
            .send({ name: 'Login Tester', email, password: 'Test@1234', confirmPassword: 'Test@1234' });

        // Then login with same credentials
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email, password: 'Test@1234' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.headers['set-cookie']).toBeDefined();
    });
});
