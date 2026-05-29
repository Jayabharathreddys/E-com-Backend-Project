const express = require("express");
const ReviewRouter = express.Router();
const ReviewModel = require("../models/ReviewModel");
const { protectRouteMiddleWare } = require("../controllers/AuthController");
const ProductModel = require("../models/ProductModel");

const createReviewController = async (req, res) => {
    try {
        const { review, rating } = req.body;
        const { productId } = req.params;
        const userId = req.userId;

        // Input validation
        if (!review || !rating) {
            return res.status(400).json({ status: "failure", message: "review and rating are required" });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ status: "failure", message: "rating must be between 1 and 5" });
        }

        const reviewObject = await ReviewModel.create({
            review,
            rating,
            product: productId,
            user: userId
        });

        const productObject = await ProductModel.findById(productId);
        if (!productObject) {
            return res.status(404).json({ status: "failure", message: "product not found" });
        }

        // Recalculate running average
        if (Number(productObject.averageRating)) {
            const sum = productObject.averageRating * productObject.reviews.length;
            productObject.averageRating = (sum + reviewObject.rating) / (productObject.reviews.length + 1);
        } else {
            productObject.averageRating = reviewObject.rating;
        }

        productObject.reviews.push(reviewObject._id);
        await productObject.save();

        res.status(201).json({
            status: "success",
            data: reviewObject
        });
    } catch (err) {
        res.status(500).json({ status: "failure", message: err.message });
    }
};

const getAllReviewForAProductController = async (req, res) => {
    try {
        const { productId } = req.params;
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip  = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            ReviewModel.find({ product: productId })
                .populate("user", "name")   // include reviewer name
                .sort({ createdAt: -1 })    // newest first
                .skip(skip)
                .limit(limit),
            ReviewModel.countDocuments({ product: productId })
        ]);

        res.status(200).json({
            status: "success",
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: reviews
        });
    } catch (err) {
        res.status(500).json({ status: "failure", message: err.message });
    }
};

ReviewRouter.post("/:productId", protectRouteMiddleWare, createReviewController);
ReviewRouter.get("/:productId", getAllReviewForAProductController);

module.exports = ReviewRouter;
