const request = require('supertest');
const app = require('../app');

describe('GET /api/product/categories', () => {
    it('returns 200 with categories array', async () => {
        const res = await request(app).get('/api/product/categories');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toContain('electronics');
        expect(res.body.data).toContain('jewelery');
    });

    it('returns 4 categories', async () => {
        const res = await request(app).get('/api/product/categories');
        expect(res.body.data.length).toBe(4);
    });
});

describe('GET /api/product', () => {
    it('returns 200 with success status', async () => {
        const res = await request(app).get('/api/product');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
    });

    it('returns message array of products', async () => {
        const res = await request(app).get('/api/product');
        expect(Array.isArray(res.body.message)).toBe(true);
    });

    it('each product has required fields', async () => {
        const res = await request(app).get('/api/product');
        const products = res.body.message;
        if (products.length > 0) {
            const product = products[0];
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('price');
            expect(product).toHaveProperty('categories');
            expect(product).toHaveProperty('productImages');
        }
    });
});

describe('GET /api/unknown-route', () => {
    it('returns 404 for unknown routes', async () => {
        const res = await request(app).get('/api/unknown-route');
        expect(res.status).toBe(404);
        expect(res.body.status).toBe('failure');
    });
});
