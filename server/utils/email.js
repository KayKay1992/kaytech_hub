// Shared Resend wrapper. Reuse this for any future transactional email
// instead of writing a second email-sending implementation.
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's sandbox sender works with no domain setup; swap in
// RESEND_FROM_EMAIL once a verified sending domain is configured.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'KayTech Hub <onboarding@resend.dev>';

const SITE_URL = process.env.FRONTEND_URL || 'https://kaytechhub.com';

const money = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

// Every trigger point below is fired from inside a larger admin/public action
// (approving a scholarship, marking a payment paid, converting a
// registration, registering for an event) that must succeed even if the
// email fails to send. Swallow and log here so callers never need their own
// try/catch around a send call.
const safeSend = async (payload) => {
  try {
    const { error } = await resend.emails.send(payload);
    if (error) {
      console.error(`Failed to send email "${payload.subject}" to ${payload.to}:`, error.message || error);
    }
  } catch (err) {
    console.error(`Failed to send email "${payload.subject}" to ${payload.to}:`, err.message);
  }
};

// Shared layout for every transactional email below — simple and readable,
// consistent branding, no heavy layout/animation (that's a website-only thing).
const wrapEmail = (bodyHtml) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #10142B;">
    <div style="padding: 20px 0; border-bottom: 3px solid #FFB020;">
      <span style="font-size: 20px; font-weight: 700;">KayTech Hub</span>
    </div>
    <div style="padding: 24px 0;">
      ${bodyHtml}
    </div>
    <div style="padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #5B6072;">
      <a href="${SITE_URL}" style="color: #10142B;">Visit KayTech Hub</a>
    </div>
  </div>
`;

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

// SCHOLARSHIP DECISION ------------------------------------------------------

const sendScholarshipApprovedEmail = async (to, { applicantName, courseTitle }) => {
  await safeSend({
    from: FROM_ADDRESS,
    to,
    subject: 'Your KayTech Hub scholarship application has been approved!',
    html: wrapEmail(`
      <h2 style="color: #10142B;">Congratulations, ${applicantName}!</h2>
      <p>We're delighted to let you know your scholarship application has been <strong>approved</strong>.</p>
      ${courseTitle ? `<p>You've been assigned to: <strong>${courseTitle}</strong>.</p>` : ''}
      <p>Our team will follow up with you shortly on next steps. Welcome aboard!</p>
    `),
  });
};

const sendScholarshipRejectedEmail = async (to, { applicantName }) => {
  await safeSend({
    from: FROM_ADDRESS,
    to,
    subject: 'An update on your KayTech Hub scholarship application',
    html: wrapEmail(`
      <h2 style="color: #10142B;">Thank you for applying, ${applicantName}</h2>
      <p>After careful review, we're unable to offer you a place on this scholarship program. This was a competitive process, and it's no reflection on your potential.</p>
      <p>We'd love for you to apply for a future scholarship program, or explore our regular courses in the meantime.</p>
    `),
  });
};

// PAYMENT CONFIRMED ----------------------------------------------------------

const sendPaymentConfirmedEmail = async (to, { name, amount, itemLabel, paymentMethod, date }) => {
  await safeSend({
    from: FROM_ADDRESS,
    to,
    subject: 'Payment received — KayTech Hub receipt',
    html: wrapEmail(`
      <h2 style="color: #10142B;">Payment received</h2>
      <p>Hi ${name}, this confirms we've received your payment.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 0; color: #5B6072;">Amount</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${money(amount)}</td></tr>
        <tr><td style="padding: 8px 0; color: #5B6072; border-top: 1px solid #e5e5e5;">For</td><td style="padding: 8px 0; text-align: right; border-top: 1px solid #e5e5e5;">${itemLabel}</td></tr>
        <tr><td style="padding: 8px 0; color: #5B6072; border-top: 1px solid #e5e5e5;">Method</td><td style="padding: 8px 0; text-align: right; border-top: 1px solid #e5e5e5; text-transform: capitalize;">${String(paymentMethod || '').replace('_', ' ')}</td></tr>
        <tr><td style="padding: 8px 0; color: #5B6072; border-top: 1px solid #e5e5e5;">Date</td><td style="padding: 8px 0; text-align: right; border-top: 1px solid #e5e5e5;">${new Date(date).toLocaleDateString()}</td></tr>
      </table>
      <p>Thank you for your payment!</p>
    `),
  });
};

// REGISTRATION CONVERTED TO ENROLLMENT --------------------------------------

const sendEnrollmentWelcomeEmail = async (to, { name, courseTitle, cohortName }) => {
  const loginUrl = `${SITE_URL}/login`;
  await safeSend({
    from: FROM_ADDRESS,
    to,
    subject: `Welcome to ${courseTitle} — you're enrolled!`,
    html: wrapEmail(`
      <h2 style="color: #10142B;">Welcome, ${name}!</h2>
      <p>You've been enrolled in <strong>${courseTitle}</strong>${cohortName ? ` — <strong>${cohortName}</strong>` : ''}.</p>
      <p>Log in to your dashboard to get started:</p>
      <p style="margin: 24px 0;">
        <a href="${loginUrl}" style="background: #FFB020; color: #10142B; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">Go to dashboard</a>
      </p>
      <p>We're looking forward to having you in the cohort!</p>
    `),
  });
};

// EVENT REGISTRATION CONFIRMATION --------------------------------------------

const sendEventRegistrationEmail = async (to, { fullName, eventTitle, eventDate, location, isPaid, price }) => {
  await safeSend({
    from: FROM_ADDRESS,
    to,
    subject: `You're registered: ${eventTitle}`,
    html: wrapEmail(`
      <h2 style="color: #10142B;">You're all set, ${fullName}!</h2>
      <p>Your registration for <strong>${eventTitle}</strong> is confirmed.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 0; color: #5B6072;">Date</td><td style="padding: 8px 0; text-align: right;">${new Date(eventDate).toLocaleString()}</td></tr>
        <tr><td style="padding: 8px 0; color: #5B6072; border-top: 1px solid #e5e5e5;">Location</td><td style="padding: 8px 0; text-align: right; border-top: 1px solid #e5e5e5;">${location}</td></tr>
      </table>
      ${isPaid ? `<p>This is a paid event — a reminder that payment of <strong>${money(price)}</strong> is expected on the event date.</p>` : ''}
      <p>See you there!</p>
    `),
  });
};

// COHORT WAITLIST — NEW COHORT OPEN ------------------------------------------

const sendCohortWaitlistOpenEmail = async (to, { name, courseTitle, cohortName, registerUrl }) => {
  await safeSend({
    from: FROM_ADDRESS,
    to,
    subject: `A new cohort just opened for ${courseTitle}`,
    html: wrapEmail(`
      <h2 style="color: #10142B;">Good news, ${name}!</h2>
      <p>You joined the waitlist for <strong>${courseTitle}</strong> when the last cohort filled up — a new cohort${cohortName ? `, <strong>${cohortName}</strong>,` : ''} is now open.</p>
      <p style="margin: 24px 0;">
        <a href="${registerUrl}" style="background: #FFB020; color: #10142B; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">Register now</a>
      </p>
      <p>Spots are limited, so don't wait too long!</p>
    `),
  });
};

// OUTSTANDING BALANCE REMINDER ------------------------------------------------

const sendPaymentReminderEmail = async (to, { name, courseTitle, cohortName, amountPaid, balanceRemaining }) => {
  await safeSend({
    from: FROM_ADDRESS,
    to,
    subject: `Friendly reminder: outstanding balance for ${courseTitle}`,
    html: wrapEmail(`
      <h2 style="color: #10142B;">Hi ${name}, just a friendly reminder</h2>
      <p>You have an outstanding balance of <strong>${money(balanceRemaining)}</strong> for <strong>${courseTitle}</strong>${cohortName ? ` (${cohortName})` : ''}.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 0; color: #5B6072;">Paid so far</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${money(amountPaid)}</td></tr>
        <tr><td style="padding: 8px 0; color: #5B6072; border-top: 1px solid #e5e5e5;">Balance remaining</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-top: 1px solid #e5e5e5;">${money(balanceRemaining)}</td></tr>
      </table>
      <p>You can complete payment via bank transfer — please reach out if you have any questions or need to arrange installments.</p>
      <p>Thanks for being part of KayTech Hub!</p>
    `),
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendScholarshipApprovedEmail,
  sendScholarshipRejectedEmail,
  sendPaymentConfirmedEmail,
  sendEnrollmentWelcomeEmail,
  sendEventRegistrationEmail,
  sendCohortWaitlistOpenEmail,
  sendPaymentReminderEmail,
};
