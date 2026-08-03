// Shared Resend wrapper. Reuse this for any future transactional email
// instead of writing a second email-sending implementation.
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's sandbox sender works with no domain setup; swap in
// RESEND_FROM_EMAIL once a verified sending domain is configured.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'KayTech Hub <onboarding@resend.dev>';

const sendPasswordResetEmail = async (to, resetUrl) => {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Reset your KayTech Hub password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #10142B;">Reset your password</h2>
        <p>We received a request to reset the password for your KayTech Hub account. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #FFB020; color: #10142B; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">Reset password</a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail };
