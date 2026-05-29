const express = require("express");
const rateLimiter = require('../utils/rateLimiter');

const { 
    signupController, 
    loginController, 
    forgetPasswordController, 
    resetPasswordController,
    logoutController
} = require("../controllers/AuthController");

const AuthRouter = express.Router();

AuthRouter.post("/signup", signupController);
AuthRouter.post("/login",  rateLimiter, loginController);          // rate-limited
AuthRouter.patch("/forgetpassword", rateLimiter, forgetPasswordController);
AuthRouter.patch("/resetPassword/:userId", resetPasswordController);
AuthRouter.get("/logout",  logoutController);   // GET kept for browser nav
AuthRouter.post("/logout", logoutController);   // POST added for Navbar fetch

module.exports = AuthRouter;
