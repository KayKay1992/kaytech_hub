const WorkspacePlan = require('../models/WorkspacePlan');
const WorkspaceSubscription = require('../models/WorkspaceSubscription');
const WorkspacePayment = require('../models/WorkspacePayment');
const { uploadImage, deleteFile, keyFromUrl } = require('../utils/upload');
const { sendPaymentConfirmedEmail } = require('../utils/email');
const { logAction } = require('../utils/auditLog');

const { DURATIONS } = WorkspacePlan;
const { PAYMENT_METHODS } = WorkspacePayment;
const PLAN_STATUSES = ['active', 'inactive'];
const PAYMENT_STATUSES = ['pending', 'paid'];
const SUBSCRIPTION_STATUSES = ['pending', 'active', 'expired'];

const computeEndDate = (startDate, duration) => {
  const end = new Date(startDate);
  switch (duration) {
    case 'day': end.setDate(end.getDate() + 1); break;
    case 'week': end.setDate(end.getDate() + 7); break;
    case 'month': end.setMonth(end.getMonth() + 1); break;
    case 'year': end.setFullYear(end.getFullYear() + 1); break;
    default: break;
  }
  return end;
};

const parsePerks = (raw) => {
  const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return (list || []).map((p) => String(p).trim()).filter(Boolean);
};

// ---- Plans ----

// GET /api/admin/space/plans — every plan regardless of status
const listPlans = async (req, res) => {
  try {
    const plans = await WorkspacePlan.find().sort({ duration: 1, price: 1 });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load workspace plans', error: err.message });
  }
};

// GET /api/admin/space/plans/:id
const getPlan = async (req, res) => {
  try {
    const plan = await WorkspacePlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Workspace plan not found' });
    }
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load workspace plan', error: err.message });
  }
};

// POST /api/admin/space/plans — optional cover image (field: image)
const createPlan = async (req, res) => {
  try {
    const { name, duration, price, status } = req.body;

    if (!name || !duration || !price) {
      return res.status(400).json({ message: 'Name, duration, and price are required' });
    }
    if (!DURATIONS.includes(duration)) {
      return res.status(400).json({ message: `Duration must be one of: ${DURATIONS.join(', ')}` });
    }
    if (status && !PLAN_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${PLAN_STATUSES.join(', ')}` });
    }

    let image_url = '';
    if (req.file) {
      const result = await uploadImage(req.file, 'workspace-images');
      image_url = result.url;
    }

    const plan = await WorkspacePlan.create({
      name,
      duration,
      price,
      perks: req.body.perks !== undefined ? parsePerks(req.body.perks) : [],
      image_url,
      status: status || 'active',
    });

    res.status(201).json({ plan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create workspace plan', error: err.message });
  }
};

// PATCH /api/admin/space/plans/:id
const updatePlan = async (req, res) => {
  try {
    const { name, duration, price, status } = req.body;

    if (duration && !DURATIONS.includes(duration)) {
      return res.status(400).json({ message: `Duration must be one of: ${DURATIONS.join(', ')}` });
    }
    if (status && !PLAN_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${PLAN_STATUSES.join(', ')}` });
    }

    const plan = await WorkspacePlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Workspace plan not found' });
    }

    if (name !== undefined) plan.name = name;
    if (duration !== undefined) plan.duration = duration;
    if (price !== undefined) plan.price = price;
    if (status !== undefined) plan.status = status;
    if (req.body.perks !== undefined) plan.perks = parsePerks(req.body.perks);

    if (req.file) {
      const oldKey = keyFromUrl(plan.image_url);
      const result = await uploadImage(req.file, 'workspace-images');
      plan.image_url = result.url;
      if (oldKey) deleteFile(oldKey).catch(() => {});
    }

    await plan.save();
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update workspace plan', error: err.message });
  }
};

// ---- Subscriptions ----

// GET /api/admin/space/subscriptions — all subscriptions, optional
// ?plan_id= / ?duration= / ?status= filters
const listSubscriptions = async (req, res) => {
  try {
    // Lazily flip anything past its end_date to 'expired' before returning
    // the list — there's no background scheduler in this app, so expiry is
    // computed on read instead of via a cron job.
    await WorkspaceSubscription.updateMany(
      { status: 'active', end_date: { $lte: new Date() } },
      { status: 'expired' }
    );

    const filter = {};
    if (req.query.plan_id) filter.plan_id = req.query.plan_id;
    if (req.query.status) filter.status = req.query.status;

    let subscriptions = await WorkspaceSubscription.find(filter)
      .populate('plan_id', 'name duration price')
      .sort({ created_at: -1 });

    if (req.query.duration) {
      subscriptions = subscriptions.filter((s) => s.plan_id?.duration === req.query.duration);
    }

    res.json({ subscriptions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load subscriptions', error: err.message });
  }
};

// PATCH /api/admin/space/subscriptions/:id — payment_status, status, notes,
// start_date. Marking a subscription active/paid computes start/end dates
// from the plan's duration — but only the first time it activates, so a
// later manual edit or renewal payment doesn't silently reset the membership.
const updateSubscription = async (req, res) => {
  try {
    const { payment_status, status, notes, start_date } = req.body;

    if (payment_status && !PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ message: `Payment status must be one of: ${PAYMENT_STATUSES.join(', ')}` });
    }
    if (status && !SUBSCRIPTION_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${SUBSCRIPTION_STATUSES.join(', ')}` });
    }

    const subscription = await WorkspaceSubscription.findById(req.params.id).populate('plan_id');
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const wasActive = subscription.status === 'active';

    if (payment_status !== undefined) subscription.payment_status = payment_status;
    if (status !== undefined) subscription.status = status;
    if (notes !== undefined) subscription.notes = notes;
    if (start_date !== undefined) subscription.start_date = start_date;

    const activating = !wasActive && (subscription.payment_status === 'paid' || subscription.status === 'active');
    if (activating) {
      subscription.status = 'active';
      subscription.start_date = subscription.start_date || new Date();
      subscription.end_date = computeEndDate(subscription.start_date, subscription.plan_id.duration);
    }

    await subscription.save();
    res.json({ subscription });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update subscription', error: err.message });
  }
};

// GET /api/admin/space/subscriptions/:id/payments
const listPaymentsForSubscription = async (req, res) => {
  try {
    const subscription = await WorkspaceSubscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const payments = await WorkspacePayment.find({ workspace_subscription_id: subscription._id }).sort({ date: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load payments', error: err.message });
  }
};

// POST /api/admin/space/subscriptions/:id/payments — multiple payments per
// subscription are allowed (deposits, renewals). Once cumulative payments
// reach the plan's price, payment_status flips to 'paid' and — the first
// time that happens — the subscription activates (start/end dates computed).
const createPaymentForSubscription = async (req, res) => {
  try {
    const subscription = await WorkspaceSubscription.findById(req.params.id).populate('plan_id');
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const { amount, payment_method, date, note } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Please enter a valid payment amount' });
    }
    if (!PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` });
    }

    const payment = await WorkspacePayment.create({
      workspace_subscription_id: subscription._id,
      amount,
      payment_method,
      date: date || Date.now(),
      note,
    });

    await sendPaymentConfirmedEmail(subscription.email, {
      name: subscription.full_name,
      amount: payment.amount,
      itemLabel: subscription.plan_id?.name ? `${subscription.plan_id.name} workspace plan` : 'workspace plan',
      paymentMethod: payment.payment_method,
      date: payment.date,
    });

    const [{ total } = { total: 0 }] = await WorkspacePayment.aggregate([
      { $match: { workspace_subscription_id: subscription._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const price = subscription.plan_id?.price || 0;
    const wasActive = subscription.status === 'active';
    if (total >= price) subscription.payment_status = 'paid';

    if (!wasActive && subscription.payment_status === 'paid') {
      subscription.status = 'active';
      subscription.start_date = subscription.start_date || new Date();
      subscription.end_date = computeEndDate(subscription.start_date, subscription.plan_id.duration);
    }

    await subscription.save();

    await logAction({
      actor_id: req.user._id,
      action_type: 'workspace_payment.marked_paid',
      target_type: 'WorkspaceSubscription',
      target_id: subscription._id,
      details: `Recorded ₦${Number(payment.amount).toLocaleString()} payment from ${subscription.full_name} for "${subscription.plan_id?.name || 'workspace plan'}"`,
    });

    res.status(201).json({ payment, subscription });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record payment', error: err.message });
  }
};

// DELETE /api/admin/space/subscriptions/:id/payments/:paymentId —
// recomputes payment_status from the remaining total; doesn't touch
// status/start_date/end_date once activated, since deactivating a live
// subscription is a separate manual decision (via PATCH the subscription).
const deletePaymentForSubscription = async (req, res) => {
  try {
    const payment = await WorkspacePayment.findOneAndDelete({
      _id: req.params.paymentId,
      workspace_subscription_id: req.params.id,
    });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const subscription = await WorkspaceSubscription.findById(req.params.id).populate('plan_id', 'price');
    if (subscription) {
      const [{ total } = { total: 0 }] = await WorkspacePayment.aggregate([
        { $match: { workspace_subscription_id: subscription._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const price = subscription.plan_id?.price || 0;
      subscription.payment_status = total >= price ? 'paid' : 'pending';
      await subscription.save();
    }

    res.json({ message: 'Payment deleted', id: payment._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete payment', error: err.message });
  }
};

// GET /api/admin/space/revenue — sum of every WorkspacePayment ever recorded
const getSpaceRevenue = async (req, res) => {
  try {
    const [{ total } = { total: 0 }] = await WorkspacePayment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load space revenue', error: err.message });
  }
};

module.exports = {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  listSubscriptions,
  updateSubscription,
  listPaymentsForSubscription,
  createPaymentForSubscription,
  deletePaymentForSubscription,
  getSpaceRevenue,
};
