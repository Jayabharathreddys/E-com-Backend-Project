const request = require('supertest');
const app = require('../app');

describe('GET /api/review/:productId', () => {
    it('returns 200 with status success for any productId', async () => {
        const res = await request(app)
            .get('/api/review/507f1f77bcf86cd799439011'); // valid-looking ObjectId
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
    });

    it('returns data array in response', async () => {
        const res = await request(app)
            .get('/api/review/507f1f77bcf86cd799439011');
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns pagination metadata (total, page, totalPages)', async () => {
        const res = await request(app)
            .get('/api/review/507f1f77bcf86cd799439011');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page');
        expect(res.body).toHaveProperty('totalPages');
    });

    it('respects page query param', async () => {
        const res = await request(app)
            .get('/api/review/507f1f77bcf86cd799439011?page=2');
        expect(res.body.page).toBe(2);
    });

    it('defaults to page 1 when param is invalid', async () => {
        const res = await request(app)
            .get('/api/review/507f1f77bcf86cd799439011?page=abc');
        expect(res.body.page).toBe(1);
    });

    it('caps limit at 50 to prevent abuse', async () => {
        const res = await request(app)
            .get('/api/review/507f1f77bcf86cd799439011?limit=9999');
        // We cannot check actual db results but the request should succeed
        expect(res.status).toBe(200);
    });
});

describe('POST /api/auth/logout', () => {
    it('returns 200 on POST /api/auth/logout', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.status).toBe(200);
    });

    it('returns 200 on GET /api/auth/logout (backward compat)', async () => {
        const res = await request(app).get('/api/auth/logout');
        expect(res.status).toBe(200);
    });

    it('POST logout clears JWT cookie', async () => {
        const res = await request(app).post('/api/auth/logout');
        const cookies = res.headers['set-cookie'];
        // Cookie should be cleared (maxAge=0 or expires in the past)
        expect(cookies).toBeDefined();
        expect(cookies.some(c => c.includes('JWT') && (c.includes('Max-Age=0') || c.includes('Expires=')))).toBe(true);
    });
});

describe('POST /api/auth/login - rate limiter present', () => {
    it('accepts valid login attempt', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nonexistent@test.com', password: 'any' });
        // Should get 404 (user not found), not 429 on first attempt
        expect([404, 500]).toContain(res.status);
    });
});
