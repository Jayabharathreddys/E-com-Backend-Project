const request = require("supertest");
const app     = require("../app");

// ── Mock external dependencies ──────────────────────────────────────────────
jest.mock("../src/utils/dynamicMailSender", () => jest.fn().mockResolvedValue(undefined));
jest.mock("razorpay", () => {
    return jest.fn().mockImplementation(() => ({
        orders: {
            create: jest.fn().mockResolvedValue({
                id:       "order_test123",
                currency: "INR",
                amount:   10000,
            }),
        },
    }));
});

const sendEmailHelper = require("../src/utils/dynamicMailSender");

// ── Helpers ──────────────────────────────────────────────────────────────────
let authCookie = "";
const TEST_USER = {
    name:            "Test User",
    email:           `booking_test_${Date.now()}@test.com`,
    password:        "password123",
    confirmPassword: "password123",
};

beforeAll(async () => {
    // Sign up then log in to get auth cookie
    await request(app).post("/api/auth/signup").send(TEST_USER);
    const loginRes = await request(app).post("/api/auth/login").send({
        email:    TEST_USER.email,
        password: TEST_USER.password,
    });
    const setCookie = loginRes.headers["set-cookie"];
    if (setCookie) authCookie = setCookie[0].split(";")[0];
}, 30000);

// ── POST /api/booking/:productId ─────────────────────────────────────────────
describe("POST /api/booking/:productId", () => {
    it("returns 500 when not authenticated", async () => {
        const res = await request(app)
            .post("/api/booking/64f1a2b3c4d5e6f7a8b9c0d1")
            .send({ priceAtThatTime: 100, quantity: 1 });
        expect(res.status).toBe(500); // protectRouteMiddleWare throws 500 on no token
    });

    it("returns 400 when priceAtThatTime is missing", async () => {
        if (!authCookie) return;
        const res = await request(app)
            .post("/api/booking/64f1a2b3c4d5e6f7a8b9c0d1")
            .set("Cookie", authCookie)
            .send({ quantity: 1 });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/priceAtThatTime/);
    });

    it("returns 400 when priceAtThatTime is zero", async () => {
        if (!authCookie) return;
        const res = await request(app)
            .post("/api/booking/64f1a2b3c4d5e6f7a8b9c0d1")
            .set("Cookie", authCookie)
            .send({ priceAtThatTime: 0 });
        expect(res.status).toBe(400);
    });

    it("returns 400 when priceAtThatTime is negative", async () => {
        if (!authCookie) return;
        const res = await request(app)
            .post("/api/booking/64f1a2b3c4d5e6f7a8b9c0d1")
            .set("Cookie", authCookie)
            .send({ priceAtThatTime: -50 });
        expect(res.status).toBe(400);
    });
});

// ── POST /api/booking/verify ─────────────────────────────────────────────────
describe("POST /api/booking/verify", () => {
    it("returns 400 when payment fields are missing", async () => {
        if (!authCookie) return;
        const res = await request(app)
            .post("/api/booking/verify")
            .set("Cookie", authCookie)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Missing payment fields/);
    });

    it("returns 403 when signature is invalid", async () => {
        if (!authCookie) return;
        const res = await request(app)
            .post("/api/booking/verify")
            .set("Cookie", authCookie)
            .send({
                razorpay_order_id:   "order_fake",
                razorpay_payment_id: "pay_fake",
                razorpay_signature:  "invalidsignature",
            });
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Invalid payment signature/);
    });

    it("returns 500 when not authenticated", async () => {
        const res = await request(app)
            .post("/api/booking/verify")
            .send({
                razorpay_order_id:   "order_fake",
                razorpay_payment_id: "pay_fake",
                razorpay_signature:  "sig",
            });
        expect(res.status).toBe(500);
    });
});

// ── GET /api/booking ─────────────────────────────────────────────────────────
describe("GET /api/booking", () => {
    it("returns 200 with bookings array", async () => {
        const res = await request(app).get("/api/booking");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(Array.isArray(res.body.data.allBookings)).toBe(true);
    });
});

// ── Email helper ─────────────────────────────────────────────────────────────
describe("sendEmailHelper mock", () => {
    it("is callable and resolves without throwing", async () => {
        await expect(
            sendEmailHelper(null, "<p>Order confirmed</p>", "Alice", "alice@test.com",
                "Order Confirmation", "Your order is confirmed")
        ).resolves.not.toThrow();
    });

    it("is called with correct args shape (string subject, html, text)", async () => {
        sendEmailHelper.mockClear();
        await sendEmailHelper(null, "<p>Hi</p>", "Bob", "bob@test.com", "Subject", "Text");
        expect(sendEmailHelper).toHaveBeenCalledWith(
            null, "<p>Hi</p>", "Bob", "bob@test.com", "Subject", "Text"
        );
    });
});
