const CorporateTrainingRequest = require('../models/CorporateTrainingRequest');

const { TRAINING_TYPES } = CorporateTrainingRequest;

// POST /api/corporate-training — public
const submitRequest = async (req, res) => {
  try {
    const {
      company_name, contact_person_name, contact_email, contact_phone,
      training_type, number_of_participants, preferred_timeline, message,
    } = req.body;

    if (!company_name || !contact_person_name || !contact_email || !contact_phone || !training_type || !message) {
      return res.status(400).json({ message: 'Company name, contact person, email, phone, training type, and message are required' });
    }
    if (!TRAINING_TYPES.includes(training_type)) {
      return res.status(400).json({ message: `Training type must be one of: ${TRAINING_TYPES.join(', ')}` });
    }

    const request = await CorporateTrainingRequest.create({
      company_name,
      contact_person_name,
      contact_email,
      contact_phone,
      training_type,
      number_of_participants: number_of_participants || null,
      preferred_timeline: preferred_timeline || '',
      message,
    });

    res.status(201).json({ request });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit corporate training request', error: err.message });
  }
};

module.exports = { submitRequest };
