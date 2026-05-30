const express = require("express");
const BookingRouter = express.Router();
const shortid = require("shortid");
const crypto = require("crypto");
const BookingModel = require("../models/BookingModel");
const { protectRouteMiddleWare } = require("../controllers/AuthController");
const Razorpay = require("razorpay");
const UserModel = require("../models/UserModel");
const sendEmailHelper = require("../utils/dynamicMailSender");
const fs = require("fs");
const path = require("path");

const getRazorpayInstance = () => new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Load order confirmation email template
const orderTemplatePath = path.join(__dirname, "../templates/orderConfirmation.html");
const orderHtmlTemplate = fs.existsSync(orderTemplatePath)
    ? fs.readFileSync(orderTemplatePath, "utf-8")
    : "<p>Hi #{USER_NAME}, your order of Rs. #{AMOUNT} has been confirmed. Order ID: #{ORDER_ID}</p>";

/* ── POST /api/booking/:productId ─────────────────────────────────────────── */
const initialBookingController = async (req, res) => {
    const userId    = req.userId;
    const { productId } = req.params;
    const { priceAtThatTime, quantity = 1 } = req.body;

    if (!priceAtThatTime || isNaN(priceAtThatTime) || priceAtThatTime <= 0) {
        return res.status(400).json({ status: "failure", message: "priceAtThatTime is required and must be > 0" });
    }

    try {
        const bookingObject = await BookingModel.create({
            user:            userId,
            product:         productId,
            priceAtThatTime: priceAtThatTime,
            quantity:        quantity,
            status:          "pending"
        });

        const userObject = await UserModel.findById(userId);
        if (userObject) {
            userObject.bookings.push(bookingObject._id);
            await userObject.save();
        }

        const amountInPaise = Math.round(priceAtThatTime * quantity * 100);
        const options = {
            amount:          amountInPaise,
            currency:        "INR",
            receipt:         shortid.generate(),
            payment_capture: 1,
        };

        const orderObject = await getRazorpayInstance().orders.create(options);
        bookingObject.payment_order_id = orderObject.id;
        await bookingObject.save();

        res.status(200).json({
            status:   "success",
            message:  "Order placed successfully",
            id:       orderObject.id,
            currency: orderObject.currency,
            amount:   orderObject.amount,
            bookingId: bookingObject._id,
        });
    } catch (err) {
        res.status(500).json({ status: "failure", message: err.message });
    }
};

/* ── GET /api/booking ─────────────────────────────────────────────────────── */
const getAllBookings = async (req, res) => {
    try {
        const allBookings = await BookingModel.find().populate("user", "name email").populate("product", "name price");
        res.status(200).json({ status: "success", message: "All bookings fetched", data: { allBookings } });
    } catch (err) {
        res.status(500).json({ status: "failure", message: err.message });
    }
};

/* ── POST /api/booking/verify ─────────────────────────────────────────────── */
const verifyPaymentController = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ status: "failure", message: "Missing payment fields" });
        }

        // Verify HMAC signature
        const body      = razorpay_order_id + "|" + razorpay_payment_id;
        const expected  = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
                                .update(body).digest("hex");

        if (expected !== razorpay_signature) {
            return res.status(403).json({ status: "failure", message: "Invalid payment signature" });
        }

        // Mark booking as confirmed
        const booking = bookingId ? await BookingModel.findById(bookingId) : null;
        if (booking) {
            booking.status = "confirmed";
            booking.payment_id = razorpay_payment_id;
            await booking.save();
        }

        // Send email receipt
        try {
            const user = await UserModel.findById(req.userId);
            if (user && user.email) {
                const amountRs = booking ? (booking.priceAtThatTime * (booking.quantity || 1)).toFixed(2) : "N/A";
                const html = orderHtmlTemplate
                    .replace("#{USER_NAME}", user.name || "Customer")
                    .replace("#{AMOUNT}",    amountRs)
                    .replace("#{ORDER_ID}",  razorpay_order_id)
                    .replace("#{PAYMENT_ID}", razorpay_payment_id);
                const text = `Hi ${user.name}, your payment of Rs. ${amountRs} is confirmed. Order: ${razorpay_order_id}`;
                await sendEmailHelper(null, html, user.name, user.email, "Order Confirmation - JBE Commerce", text);
            }
        } catch (emailErr) {
            // Email failure must not fail the payment confirmation
            console.error("Email send failed:", emailErr.message);
        }

        res.status(200).json({ status: "success", message: "Payment verified successfully" });
    } catch (err) {
        res.status(500).json({ status: "failure", message: err.message });
    }
};

BookingRouter.post("/verify",     protectRouteMiddleWare, verifyPaymentController);
BookingRouter.post("/:productId", protectRouteMiddleWare, initialBookingController);
BookingRouter.get("/",            getAllBookings);

module.exports = BookingRouter;
