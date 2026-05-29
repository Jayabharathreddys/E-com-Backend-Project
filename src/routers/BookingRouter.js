const express = require("express");
const BookingRouter = express.Router();
const shortid = require("shortid");
const crypto = require("crypto");
const BookingModel = require("../models/BookingModel");
const { protectRouteMiddleWare } = require("../controllers/AuthController");
const Razorpay = require("razorpay");
const UserModel = require("../models/UserModel");

const getRazorpayInstance = () => new Razorpay({
    key_id:    process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const initialBookingController = async (req, res) => {
    const userId = req.userId;
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    try {
        const bookingObject = await BookingModel.create({
            user:    userId,
            product: productId,
            status:  "pending"
        });

        const userObject = await UserModel.findById(userId);
        if (userObject) {
            userObject.bookings.push(bookingObject._id);
            await userObject.save();
        }

        const options = {
            amount:          quantity * 100,   // paise; frontend sends price or quantity
            currency:        "INR",
            receipt:         shortid.generate(),
            payment_capture: 1
        };

        const orderObject = await getRazorpayInstance().orders.create(options);
        bookingObject.payment_order_id = orderObject.id;
        await bookingObject.save();

        res.status(200).json({
            status:   "success",
            message:  "Order placed successfully",
            id:       orderObject.id,
            currency: orderObject.currency,
            amount:   orderObject.amount
        });
    } catch (err) {
        res.status(500).json({ status: "failure", message: err.message });
    }
};

const getAllBookings = async (req, res) => {
    try {
        const allBookings = await BookingModel.find();
        res.status(200).json({
            status:  "success",
            message: "All bookings fetched successfully",
            data:    { allBookings }
        });
    } catch (err) {
        res.status(500).json({ status: "failure", message: err.message });
    }
};

const verifyPaymentController = async (req, res) => {
    try {
        const { WEBHOOK_SECRET } = process.env;
        const shasum = crypto.createHmac("sha256", WEBHOOK_SECRET || "");
        shasum.update(JSON.stringify(req.body));
        const freshSignature = shasum.digest("hex");
        const razorPaySign   = req.headers["x-razorpay-signature"];

        if (freshSignature === razorPaySign) {
            res.status(200).json({ message: "OK" });
        } else {
            res.status(403).json({ message: "Invalid signature" });
        }
    } catch (err) {
        res.status(500).json({ status: "failure", message: err.message });
    }
};

BookingRouter.post("/:productId", protectRouteMiddleWare, initialBookingController);
BookingRouter.post("/verify",     protectRouteMiddleWare, verifyPaymentController);
BookingRouter.get("/",            getAllBookings);

module.exports = BookingRouter;
