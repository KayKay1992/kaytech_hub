const MentorshipProgram = require('../models/MentorshipProgram');
const MentorshipRegistration = require('../models/MentorshipRegistration');
const MentorshipPayment = require('../models/MentorshipPayment');
const { uploadImage, deleteFile, keyFromUrl } = require('../utils/upload');
const { sendPaymentConfirmedEmail } = require('../utils/email');

const { PAYMENT_METHODS } = MentorshipPayment;
const PROGRAM_STATUSES = ['open', 'closed'];
const REGISTRATION_STATUSES = ['registered', 'attending', 'completed'];
const PAYMENT_STATUSES = ['pending', 'paid'];

// GET /api/admin/mentorship — every program regardless of status
const listPrograms = async (req, res) => {
  try {
    const programs = await MentorshipProgram.find().sort({ created_at: -1 });
    res.json({ programs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load mentorship programs', error: err.message });
  }
};

// GET /api/admin/mentorship/:id
const getProgram = async (req, res) => {
  try {
    const program = await MentorshipProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Mentorship program not found' });
    }
    res.json({ program });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load mentorship program', error: err.message });
  }
};

// POST /api/admin/mentorship — optional cover image (field: image)
const createProgram = async (req, res) => {
  try {
    const { title, description, price, duration, schedule_info, status } = req.body;

    if (!title || !description || !price || !duration) {
      return res.status(400).json({ message: 'Title, description, price, and duration are required' });
    }
    if (status && !PROGRAM_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${PROGRAM_STATUSES.join(', ')}` });
    }

    let image_url = '';
    if (req.file) {
      const result = await uploadImage(req.file, 'mentorship-images');
      image_url = result.url;
    }

    const program = await MentorshipProgram.create({
      title,
      description,
      price,
      duration,
      schedule_info,
      image_url,
      status: status || 'open',
    });

    res.status(201).json({ program });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create mentorship program', error: err.message });
  }
};

// PATCH /api/admin/mentorship/:id
const updateProgram = async (req, res) => {
  try {
    const { title, description, price, duration, schedule_info, status } = req.body;

    if (status && !PROGRAM_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${PROGRAM_STATUSES.join(', ')}` });
    }

    const program = await MentorshipProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Mentorship program not found' });
    }

    if (title !== undefined) program.title = title;
    if (description !== undefined) program.description = description;
    if (price !== undefined) program.price = price;
    if (duration !== undefined) program.duration = duration;
    if (schedule_info !== undefined) program.schedule_info = schedule_info;
    if (status !== undefined) program.status = status;

    if (req.file) {
      const oldKey = keyFromUrl(program.image_url);
      const result = await uploadImage(req.file, 'mentorship-images');
      program.image_url = result.url;
      if (oldKey) deleteFile(oldKey).catch(() => {});
    }

    await program.save();
    res.json({ program });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update mentorship program', error: err.message });
  }
};

// GET /api/admin/mentorship/registrations — all registrations, optional ?program_id=
const listRegistrations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.program_id) filter.program_id = req.query.program_id;

    const registrations = await MentorshipRegistration.find(filter)
      .populate('program_id', 'title price')
      .sort({ registered_at: -1 });
    res.json({ registrations });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load registrations', error: err.message });
  }
};

// PATCH /api/admin/mentorship/registrations/:id — update status and/or payment_status
const updateRegistration = async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    if (status && !REGISTRATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${REGISTRATION_STATUSES.join(', ')}` });
    }
    if (payment_status && !PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ message: `Payment status must be one of: ${PAYMENT_STATUSES.join(', ')}` });
    }

    const registration = await MentorshipRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (status !== undefined) registration.status = status;
    if (payment_status !== undefined) registration.payment_status = payment_status;

    await registration.save();
    res.json({ registration });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update registration', error: err.message });
  }
};

// GET /api/admin/mentorship/registrations/:id/payments
const listPaymentsForRegistration = async (req, res) => {
  try {
    const registration = await MentorshipRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const payments = await MentorshipPayment.find({ mentorship_registration_id: registration._id }).sort({ date: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load payments', error: err.message });
  }
};

// POST /api/admin/mentorship/registrations/:id/payments — multiple payments
// per registration are allowed (installments). Recording a payment
// recomputes the running total and keeps payment_status in sync: once
// total payments reach the program's price, it flips to 'paid' automatically
// (partial payments keep it 'pending') — admin can still override manually
// via PATCH .../registrations/:id for edge cases like a waived fee.
const createPaymentForRegistration = async (req, res) => {
  try {
    const registration = await MentorshipRegistration.findById(req.params.id).populate('program_id', 'title price');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const { amount, payment_method, date, note } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Please enter a valid payment amount' });
    }
    if (!PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` });
    }

    const payment = await MentorshipPayment.create({
      mentorship_registration_id: registration._id,
      amount,
      payment_method,
      date: date || Date.now(),
      note,
    });

    await sendPaymentConfirmedEmail(registration.email, {
      name: registration.full_name,
      amount: payment.amount,
      itemLabel: registration.program_id?.title ? `${registration.program_id.title} mentorship program` : 'mentorship program',
      paymentMethod: payment.payment_method,
      date: payment.date,
    });

    const [{ total } = { total: 0 }] = await MentorshipPayment.aggregate([
      { $match: { mentorship_registration_id: registration._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const price = registration.program_id?.price || 0;
    registration.payment_status = total >= price ? 'paid' : 'pending';
    await registration.save();

    res.status(201).json({ payment, registration });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record payment', error: err.message });
  }
};

// DELETE /api/admin/mentorship/registrations/:id/payments/:paymentId —
// recomputes payment_status afterward since it's derived from the running
// total, not stored independently of the payment records.
const deletePaymentForRegistration = async (req, res) => {
  try {
    const payment = await MentorshipPayment.findOneAndDelete({
      _id: req.params.paymentId,
      mentorship_registration_id: req.params.id,
    });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const registration = await MentorshipRegistration.findById(req.params.id).populate('program_id', 'price');
    if (registration) {
      const [{ total } = { total: 0 }] = await MentorshipPayment.aggregate([
        { $match: { mentorship_registration_id: registration._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const price = registration.program_id?.price || 0;
      registration.payment_status = total >= price ? 'paid' : 'pending';
      await registration.save();
    }

    res.json({ message: 'Payment deleted', id: payment._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete payment', error: err.message });
  }
};

// GET /api/admin/mentorship/revenue — sum of every MentorshipPayment ever recorded
const getMentorshipRevenue = async (req, res) => {
  try {
    const [{ total } = { total: 0 }] = await MentorshipPayment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load mentorship revenue', error: err.message });
  }
};

module.exports = {
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  listRegistrations,
  updateRegistration,
  listPaymentsForRegistration,
  createPaymentForRegistration,
  deletePaymentForRegistration,
  getMentorshipRevenue,
};
