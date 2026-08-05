const Payment = require('../models/Payment');
const ServicePayment = require('../models/ServicePayment');
const MentorshipPayment = require('../models/MentorshipPayment');
const WorkspacePayment = require('../models/WorkspacePayment');
const CorporateInvoice = require('../models/CorporateInvoice');
const InstructorPayout = require('../models/InstructorPayout');
const { toCSV } = require('../utils/csv');

// `to` is inclusive of the whole day it names.
const parseRange = (req) => {
  const { from, to } = req.query;
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (end) end.setHours(23, 59, 59, 999);
  return { start, end };
};

const inRange = (date, start, end) => {
  if (!date) return false;
  const t = new Date(date).getTime();
  if (start && t < start.getTime()) return false;
  if (end && t > end.getTime()) return false;
  return true;
};

const toDateStr = (date) => new Date(date).toISOString().slice(0, 10);

const sendCSV = (res, filename, rows, columns) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(toCSV(rows, columns));
};

const REVENUE_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'business_line', label: 'Business Line' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'status', label: 'Status' },
];

// GET /api/admin/reports/export/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
// Combines every revenue source (Academy, Services, Mentorship, Space,
// Corporate Training) into one sorted CSV. Only actually-collected money is
// included (Payment.status/CorporateInvoice.status === 'paid') — same
// "revenue means money in hand" definition the Admin Dashboard's Full
// Analytics already uses, since this export is meant for real bookkeeping.
const exportRevenueCSV = async (req, res) => {
  try {
    const { start, end } = parseRange(req);

    const [payments, servicePayments, mentorshipPayments, workspacePayments, corporateInvoices] = await Promise.all([
      Payment.find({ status: 'paid' })
        .populate('student_id', 'name')
        .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } }),
      ServicePayment.find()
        .populate({ path: 'service_request_id', select: 'name service_id', populate: { path: 'service_id', select: 'title' } }),
      MentorshipPayment.find()
        .populate({ path: 'mentorship_registration_id', select: 'full_name program_id', populate: { path: 'program_id', select: 'name' } }),
      WorkspacePayment.find()
        .populate({ path: 'workspace_subscription_id', select: 'full_name plan_id', populate: { path: 'plan_id', select: 'name' } }),
      CorporateInvoice.find({ status: 'paid' }).populate('client_id', 'company_name'),
    ]);

    const rows = [];

    payments.forEach((p) => {
      const date = p.paid_at || p.created_at;
      if (!inRange(date, start, end)) return;
      const studentName = p.student_id?.name || 'Unknown Student';
      const courseTitle = p.cohort_id?.course_id?.title || '';
      rows.push({
        date: toDateStr(date),
        business_line: 'Academy',
        description: `${studentName}${courseTitle ? ` - ${courseTitle}` : ''}`,
        amount: p.amount,
        payment_method: p.payment_method || '',
        status: p.status,
      });
    });

    servicePayments.forEach((p) => {
      if (!inRange(p.date, start, end)) return;
      const clientName = p.service_request_id?.name || 'Unknown Client';
      const serviceTitle = p.service_request_id?.service_id?.title || '';
      rows.push({
        date: toDateStr(p.date),
        business_line: 'Services',
        description: `${clientName}${serviceTitle ? ` - ${serviceTitle}` : ''}`,
        amount: p.amount,
        payment_method: p.payment_method,
        status: 'paid',
      });
    });

    mentorshipPayments.forEach((p) => {
      if (!inRange(p.date, start, end)) return;
      const name = p.mentorship_registration_id?.full_name || 'Unknown Mentee';
      const program = p.mentorship_registration_id?.program_id?.name || '';
      rows.push({
        date: toDateStr(p.date),
        business_line: 'Mentorship',
        description: `${name}${program ? ` - ${program}` : ''}`,
        amount: p.amount,
        payment_method: p.payment_method,
        status: 'paid',
      });
    });

    workspacePayments.forEach((p) => {
      if (!inRange(p.date, start, end)) return;
      const name = p.workspace_subscription_id?.full_name || 'Unknown Member';
      const plan = p.workspace_subscription_id?.plan_id?.name || '';
      rows.push({
        date: toDateStr(p.date),
        business_line: 'Space',
        description: `${name}${plan ? ` - ${plan} Plan` : ''}`,
        amount: p.amount,
        payment_method: p.payment_method,
        status: 'paid',
      });
    });

    corporateInvoices.forEach((inv) => {
      const date = inv.paid_at || inv.due_date;
      if (!inRange(date, start, end)) return;
      const client = inv.client_id?.company_name || 'Unknown Client';
      rows.push({
        date: toDateStr(date),
        business_line: 'Corporate Training',
        description: `${client} - ${inv.description} (${inv.invoice_number})`,
        amount: inv.amount,
        payment_method: inv.payment_method || '',
        status: inv.status,
      });
    });

    rows.sort((a, b) => a.date.localeCompare(b.date));

    const filename = `revenue-export_${req.query.from || 'all'}_to_${req.query.to || 'all'}.csv`;
    sendCSV(res, filename, rows, REVENUE_COLUMNS);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate revenue export', error: err.message });
  }
};

const PAYOUT_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'instructor_name', label: 'Instructor' },
  { key: 'cohort', label: 'Cohort' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
];

// GET /api/admin/reports/export/payouts?from=YYYY-MM-DD&to=YYYY-MM-DD
// Instructor payouts are an expense, not revenue, so this is a separate
// export. Each completed "Mark as Paid" event (transactions[].type ===
// 'payout') becomes its own dated, paid row. Any cohort currently carrying
// a positive unpaid_amount also gets one 'unpaid' row (dated to its most
// recent accrual) so the accountant can see money owed but not yet sent.
const exportPayoutsCSV = async (req, res) => {
  try {
    const { start, end } = parseRange(req);

    const payouts = await InstructorPayout.find()
      .populate('instructor_id', 'name')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } });

    const rows = [];

    payouts.forEach((p) => {
      const instructorName = p.instructor_id?.name || 'Unknown Instructor';
      const courseTitle = p.cohort_id?.course_id?.title || '';
      const cohortName = p.cohort_id?.name || '';
      const cohortLabel = [courseTitle, cohortName].filter(Boolean).join(' - ') || 'Unknown Cohort';

      p.transactions
        .filter((t) => t.type === 'payout')
        .forEach((t) => {
          if (!inRange(t.created_at, start, end)) return;
          rows.push({
            date: toDateStr(t.created_at),
            instructor_name: instructorName,
            cohort: cohortLabel,
            amount: t.amount,
            status: 'paid',
          });
        });

      if (p.unpaid_amount > 0) {
        const lastAccrual = p.transactions
          .filter((t) => t.type === 'accrual')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const date = lastAccrual?.created_at || p.updated_at || p.created_at;
        if (inRange(date, start, end)) {
          rows.push({
            date: toDateStr(date),
            instructor_name: instructorName,
            cohort: cohortLabel,
            amount: p.unpaid_amount,
            status: 'unpaid',
          });
        }
      }
    });

    rows.sort((a, b) => a.date.localeCompare(b.date));

    const filename = `instructor-payouts-export_${req.query.from || 'all'}_to_${req.query.to || 'all'}.csv`;
    sendCSV(res, filename, rows, PAYOUT_COLUMNS);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate payouts export', error: err.message });
  }
};

module.exports = { exportRevenueCSV, exportPayoutsCSV };
