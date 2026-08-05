const cron = require('node-cron');
const { runAutomaticReminders } = require('../services/paymentReminderService');

// Runs once a day at 08:00 server time. The service itself decides which
// enrollments are actually due (see REMINDER_INTERVAL_DAYS in
// paymentReminderService.js) — this schedule just needs to run at least
// once a day for that gate to work correctly.
cron.schedule('0 8 * * *', async () => {
  try {
    const { checked, sent } = await runAutomaticReminders();
    console.log(`[payment-reminder-cron] checked ${checked} outstanding enrollment(s), sent ${sent} reminder(s)`);
  } catch (err) {
    console.error('[payment-reminder-cron] run failed:', err.message);
  }
});
