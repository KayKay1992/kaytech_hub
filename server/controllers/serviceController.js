const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');

// GET /api/services — public, active services only
const listActiveServices = async (req, res) => {
  try {
    const services = await Service.find({ status: 'active' }).sort({ created_at: -1 });
    res.json({ services });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load services', error: err.message });
  }
};

// GET /api/services/:id — public
const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ service });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load service', error: err.message });
  }
};

// POST /api/services/:id/request — public
const requestService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    if (service.status !== 'active') {
      return res.status(400).json({ message: 'This service is not currently available' });
    }

    const { name, email, phone, company_name, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: 'Name, email, phone, and message are required' });
    }

    const request = await ServiceRequest.create({
      name,
      email,
      phone,
      company_name,
      message,
      service_id: service._id,
    });

    res.status(201).json({ request });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit service request', error: err.message });
  }
};

module.exports = { listActiveServices, getService, requestService };
