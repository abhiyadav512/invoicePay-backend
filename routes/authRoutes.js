const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  loginUser,
  registerUser,
  verifiyOtp,
} = require("../controllers/authController");

const validateRequest = require("../middleware/validateRequest");
const {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
} = require("../validator/authValidator");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// Rate limiter for login - max 10 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, 
  message: {
    success: false,
    message: "Too many login attempts, please try again later(15m).",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OTP verification - max 10 attempts per 15 minutes
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    success: false,
    message: "Too many OTP verification attempts, please try again later(15m).",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, validateRequest(loginSchema), loginUser);

router.post("/register", validateRequest(registerSchema), registerUser);

router.post(
  "/verifiy-otp",
  otpVerifyLimiter,
  validateRequest(verifyOtpSchema),
  verifiyOtp
);

router.get("/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ success: true, message: "Logged out" });
});

module.exports = router;
