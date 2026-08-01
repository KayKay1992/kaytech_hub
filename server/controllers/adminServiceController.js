const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');
const ServicePayment = require('../models/ServicePayment');
const { uploadImage, deleteFile, keyFromUrl } = require('../utils/upload');

const { SERVICE_CATEGORIES } = Service;
const { PAYMENT_METHODS } = ServicePayment;
const SERVICE_STATUSES = ['active', 'inactive'];
const REQUEST_STATUSES = ['new', 'contacted', 'in-progress', 'completed'];
const MAX_GALLERY_IMAGES = 3;

// `features` and `process_steps` arrive as JSON strings (multipart form
// data can't carry real arrays/objects) — parse defensively since the body
// is client-supplied.
const parseFeatures = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((f) => String(f).trim()).filter(Boolean);
  } catch {
    return [];
  }
};

const parseProcessSteps = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((step) => ({ title: String(step?.title || '').trim(), description: String(step?.description || '').trim() }))
      .filter((step) => step.title);
  } catch {
    return [];
  }
};

// GET /api/admin/services — every service regardless of status
const listServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ created_at: -1 });
    res.json({ services });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load services', error: err.message });
  }
};

// GET /api/admin/services/:id
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

// POST /api/admin/services — cover image (field: image) and up to 3 gallery
// images (field: gallery_images) are both optional
const createService = async (req, res) => {
  try {
    const { title, category, description, detailed_description, starting_price, status } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ message: 'Title, category, and description are required' });
    }
    if (!SERVICE_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `Category must be one of: ${SERVICE_CATEGORIES.join(', ')}` });
    }
    if (status && !SERVICE_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${SERVICE_STATUSES.join(', ')}` });
    }

    let image_url = '';
    const coverFile = req.files?.image?.[0];
    if (coverFile) {
      const result = await uploadImage(coverFile, 'service-images');
      image_url = result.url;
    }

    const galleryFiles = (req.files?.gallery_images || []).slice(0, MAX_GALLERY_IMAGES);
    const gallery_images = [];
    for (const file of galleryFiles) {
      const result = await uploadImage(file, 'service-images');
      gallery_images.push(result.url);
    }

    const service = await Service.create({
      title,
      category,
      description,
      detailed_description: detailed_description || '',
      starting_price: starting_price || null,
      image_url,
      gallery_images,
      features: parseFeatures(req.body.features),
      process_steps: parseProcessSteps(req.body.process_steps),
      status: status || 'active',
    });

    res.status(201).json({ service });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create service', error: err.message });
  }
};

// PATCH /api/admin/services/:id — `existing_gallery_images` (JSON array of
// URLs) tells us which current gallery images to keep; anything dropped is
// deleted from R2, and newly uploaded files fill the remaining slots up to 3.
const updateService = async (req, res) => {
  try {
    const { title, category, description, detailed_description, starting_price, status } = req.body;

    if (category && !SERVICE_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `Category must be one of: ${SERVICE_CATEGORIES.join(', ')}` });
    }
    if (status && !SERVICE_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${SERVICE_STATUSES.join(', ')}` });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (title !== undefined) service.title = title;
    if (category !== undefined) service.category = category;
    if (description !== undefined) service.description = description;
    if (detailed_description !== undefined) service.detailed_description = detailed_description;
    if (starting_price !== undefined) service.starting_price = starting_price || null;
    if (status !== undefined) service.status = status;
    if (req.body.features !== undefined) service.features = parseFeatures(req.body.features);
    if (req.body.process_steps !== undefined) service.process_steps = parseProcessSteps(req.body.process_steps);

    const coverFile = req.files?.image?.[0];
    if (coverFile) {
      const oldKey = keyFromUrl(service.image_url);
      const result = await uploadImage(coverFile, 'service-images');
      service.image_url = result.url;
      if (oldKey) deleteFile(oldKey).catch(() => {});
    }

    if (req.body.existing_gallery_images !== undefined) {
      let keptUrls = [];
      try {
        const parsed = JSON.parse(req.body.existing_gallery_images);
        if (Array.isArray(parsed)) keptUrls = parsed;
      } catch {
        keptUrls = [];
      }

      const removedUrls = service.gallery_images.filter((url) => !keptUrls.includes(url));
      removedUrls.forEach((url) => {
        const key = keyFromUrl(url);
        if (key) deleteFile(key).catch(() => {});
      });

      const galleryFiles = (req.files?.gallery_images || []);
      const newUrls = [];
      for (const file of galleryFiles) {
        if (keptUrls.length + newUrls.length >= MAX_GALLERY_IMAGES) break;
        const result = await uploadImage(file, 'service-images');
        newUrls.push(result.url);
      }

      service.gallery_images = [...keptUrls, ...newUrls].slice(0, MAX_GALLERY_IMAGES);
    }

    await service.save();
    res.json({ service });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update service', error: err.message });
  }
};

// GET /api/admin/services/requests — all service requests, optional ?service_id=
const listRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.service_id) filter.service_id = req.query.service_id;

    const requests = await ServiceRequest.find(filter).populate('service_id', 'title').sort({ submitted_at: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load service requests', error: err.message });
  }
};

// PATCH /api/admin/services/requests/:id
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status && !REQUEST_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${REQUEST_STATUSES.join(', ')}` });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (status !== undefined) request.status = status;
    await request.save();

    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update service request', error: err.message });
  }
};

// GET /api/admin/services/requests/:id/payments
const listPaymentsForRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    const payments = await ServicePayment.find({ service_request_id: request._id }).sort({ date: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load payments', error: err.message });
  }
};

// POST /api/admin/services/requests/:id/payments — multiple payments per
// request are allowed (deposit + final payment, milestone billing, etc.)
const createPaymentForRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    const { amount, payment_method, date, note } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Please enter a valid payment amount' });
    }
    if (!PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` });
    }

    const payment = await ServicePayment.create({
      service_request_id: request._id,
      amount,
      payment_method,
      date: date || Date.now(),
      note,
    });

    res.status(201).json({ payment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record payment', error: err.message });
  }
};

// GET /api/admin/services/revenue — sum of every ServicePayment ever recorded
const getServiceRevenue = async (req, res) => {
  try {
    const [{ total } = { total: 0 }] = await ServicePayment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load service revenue', error: err.message });
  }
};

module.exports = {
  listServices,
  getService,
  createService,
  updateService,
  listRequests,
  updateRequestStatus,
  listPaymentsForRequest,
  createPaymentForRequest,
  getServiceRevenue,
};
