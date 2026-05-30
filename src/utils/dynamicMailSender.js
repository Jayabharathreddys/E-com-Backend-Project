const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
    host:   "smtp.sendgrid.net",
    port:   465,
    secure: true,
    auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
    },
});

async function emailSender(to, subject, html, text) {
    const emailObject = {
        to,
        from:    process.env.SENDER_EMAIL,
        subject,
        text,
        html,
    };
    await transporter.sendMail(emailObject);
}

/**
 * sendEmailHelper — dual-purpose helper used by both OTP and order confirmation.
 *
 * When otp is non-null:  replaces #{USER_NAME} and #{OTP} placeholders (OTP flow).
 * When otp is null:      htmlTemplate is already fully rendered (order flow passes pre-rendered HTML).
 * customSubject / customText override the defaults when provided.
 */
async function sendEmailHelper(otp, htmlTemplate, userName, to, customSubject, customText) {
    let finalHtml = htmlTemplate;
    let subject   = customSubject || "RESET PASSWORD Verification OTP";
    let text      = customText;

    if (otp !== null && otp !== undefined) {
        finalHtml = htmlTemplate
            .replace("#{USER_NAME}", userName)
            .replace("#{OTP}", otp);
        text = text || `Hi ${userName}, your OTP to reset your password is ${otp}`;
    }

    await emailSender(to, subject, finalHtml, text || "");
}

module.exports = sendEmailHelper;
