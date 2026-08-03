// Honeypot spam guard for public, unauthenticated forms. The client renders
// a form field (default name "website") that's invisible to real users but
// present in the DOM for bots that auto-fill every field. If it comes back
// with any value, we silently pretend the submission succeeded instead of
// saving it or returning an error — a real error would teach bots to leave
// the field alone.
const checkHoneypot = (fieldName = 'website') => (req, res, next) => {
  const value = req.body?.[fieldName];
  if (typeof value === 'string' && value.trim() !== '') {
    return res.status(201).json({ message: 'Thanks — your submission has been received.' });
  }
  next();
};

module.exports = { checkHoneypot };
