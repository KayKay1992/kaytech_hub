const WorkspacePlan = require('../models/WorkspacePlan');
const WorkspaceSubscription = require('../models/WorkspaceSubscription');

// GET /api/space/plans — public, active plans only
const listActivePlans = async (req, res) => {
  try {
    const plans = await WorkspacePlan.find({ status: 'active' }).sort({ duration: 1, price: 1 });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load workspace plans', error: err.message });
  }
};

// GET /api/space/plans/:id — public, active plans only
const getPlan = async (req, res) => {
  try {
    const plan = await WorkspacePlan.findById(req.params.id);
    if (!plan || plan.status !== 'active') {
      return res.status(404).json({ message: 'Workspace plan not found' });
    }
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load workspace plan', error: err.message });
  }
};

// POST /api/space/reserve — public, no login required
const reserveSpot = async (req, res) => {
  try {
    const {
      plan_id, full_name, email, phone, address,
      occupation_or_purpose, valid_id_type, valid_id_number,
      emergency_contact_name, emergency_contact_phone,
    } = req.body;

    if (!plan_id || !full_name || !email || !phone || !address || !occupation_or_purpose
      || !valid_id_type || !valid_id_number || !emergency_contact_name || !emergency_contact_phone) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const plan = await WorkspacePlan.findById(plan_id);
    if (!plan || plan.status !== 'active') {
      return res.status(404).json({ message: 'Selected plan is not available' });
    }

    const subscription = await WorkspaceSubscription.create({
      plan_id: plan._id,
      full_name,
      email,
      phone,
      address,
      occupation_or_purpose,
      valid_id_type,
      valid_id_number,
      emergency_contact_name,
      emergency_contact_phone,
    });

    res.status(201).json({ subscription });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit reservation', error: err.message });
  }
};

module.exports = { listActivePlans, getPlan, reserveSpot };
