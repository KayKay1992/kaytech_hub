// Shared rate limiters for public, unauthenticated endpoints. Reuse these
// instead of instantiating express-rate-limit ad hoc per route, so every
// public form gets the same consistent, documented limits.
const rateLimit = require('express-rate-limit');

const tooManyRequests = { message: 'Too many requests, please try again later.' };

// Default for public form submissions (contact, applications, registrations,
// reservations): 5 per 15 minutes per IP.
const standardFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});

// Account creation — same window as standard forms, but its own bucket so
// it isn't shared with unrelated public forms.
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});

// Forgot Password: can flood a stranger's inbox or be used to enumerate
// registered emails, so it gets the tightest limit — 3 per hour per IP.
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});

// Reset Password: guards against brute-forcing/hammering the token endpoint.
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});

// Alumni Directory "Reach Me" messages — must run after `protect` so
// req.user exists. Keyed per logged-in user (not per IP) since the whole
// point is capping how many directory members one account can message,
// not how many requests come from one network. 5 per hour.
const alumniContactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  message: { message: "You've sent several messages recently — please try again in a bit." },
});

module.exports = {
  standardFormLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  alumniContactLimiter,
};
