const rateLimit = require("express-rate-limit");

/**
 * Strict limiter for sensitive auth routes:
 * login, register, forgot-password, reset-password
 * Allows 10 attempts per 15 minutes per IP.
 * Prevents brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    message: "Too many attempts from this IP. Please try again after 15 minutes.",
  },
  skipSuccessfulRequests: false,
});

/**
 * Limiter for password reset specifically — even stricter.
 * Allows 5 attempts per hour per IP.
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many password reset requests. Please try again after 1 hour.",
  },
});

/**
 * Limiter for the RAG search endpoint.
 * Protects Gemini API quota from being burned by bots.
 * Allows 30 searches per minute per IP.
 */
const ragSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many search requests. Please slow down and try again shortly.",
  },
});

/**
 * General API limiter — applied globally as a safety net.
 * Allows 200 requests per 15 minutes per IP.
 * Won't affect normal users but blocks scrapers and bots.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP. Please try again later.",
  },
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  ragSearchLimiter,
  generalLimiter,
};
