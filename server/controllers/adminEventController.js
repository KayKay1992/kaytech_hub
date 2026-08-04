const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { uploadImage, deleteFile, keyFromUrl } = require('../utils/upload');

const { EVENT_TYPES } = Event;

// Merges each event with how many EventRegistrations it has, in one grouped
// query rather than N+1 counts.
const withRegistrationCounts = async (events) => {
  const counts = await EventRegistration.aggregate([
    { $group: { _id: '$event_id', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return events.map((event) => ({
    ...event.toObject(),
    registration_count: countMap.get(String(event._id)) || 0,
  }));
};

// GET /api/admin/events — every event, newest event date first
const listEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.json({ events: await withRegistrationCounts(events) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load events', error: err.message });
  }
};

// GET /api/admin/events/:id
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const registration_count = await EventRegistration.countDocuments({ event_id: event._id });
    res.json({ event: { ...event.toObject(), registration_count } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load event', error: err.message });
  }
};

// POST /api/admin/events — cover image (field: image) is optional. is_paid
// arrives as a string ('true'/'false') since this is multipart form data.
const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, type, price, max_participants } = req.body;
    const is_paid = req.body.is_paid === 'true' || req.body.is_paid === true;

    if (!title || !description || !date || !location || !type) {
      return res.status(400).json({ message: 'Title, description, date, location, and type are required' });
    }
    if (!EVENT_TYPES.includes(type)) {
      return res.status(400).json({ message: `Type must be one of: ${EVENT_TYPES.join(', ')}` });
    }
    if (is_paid && (!price || Number(price) <= 0)) {
      return res.status(400).json({ message: 'Please enter a valid price for a paid event' });
    }

    let image_url = '';
    const coverFile = req.files?.image?.[0];
    if (coverFile) {
      const result = await uploadImage(coverFile, 'event-images');
      image_url = result.url;
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      type,
      image_url,
      is_paid,
      price: is_paid ? price : null,
      max_participants: max_participants || null,
    });

    res.status(201).json({ event: { ...event.toObject(), registration_count: 0 } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
};

// PATCH /api/admin/events/:id
const updateEvent = async (req, res) => {
  try {
    const { title, description, date, location, type, price, max_participants } = req.body;
    const is_paid = req.body.is_paid !== undefined
      ? (req.body.is_paid === 'true' || req.body.is_paid === true)
      : undefined;

    if (type && !EVENT_TYPES.includes(type)) {
      return res.status(400).json({ message: `Type must be one of: ${EVENT_TYPES.join(', ')}` });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const nextIsPaid = is_paid !== undefined ? is_paid : event.is_paid;
    if (nextIsPaid && price !== undefined && (!price || Number(price) <= 0)) {
      return res.status(400).json({ message: 'Please enter a valid price for a paid event' });
    }

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (location !== undefined) event.location = location;
    if (type !== undefined) event.type = type;
    if (is_paid !== undefined) event.is_paid = is_paid;
    if (!nextIsPaid) {
      event.price = null;
    } else if (price !== undefined) {
      event.price = price;
    }
    if (max_participants !== undefined) event.max_participants = max_participants || null;

    const coverFile = req.files?.image?.[0];
    if (coverFile) {
      const oldKey = keyFromUrl(event.image_url);
      const result = await uploadImage(coverFile, 'event-images');
      event.image_url = result.url;
      if (oldKey) deleteFile(oldKey).catch(() => {});
    }

    await event.save();
    const registration_count = await EventRegistration.countDocuments({ event_id: event._id });
    res.json({ event: { ...event.toObject(), registration_count } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
};

// DELETE /api/admin/events/:id
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.image_url) {
      const key = keyFromUrl(event.image_url);
      if (key) deleteFile(key).catch(() => {});
    }
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
};

// GET /api/admin/events/:id/registrations
const listRegistrationsForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const registrations = await EventRegistration.find({ event_id: event._id }).sort({ registered_at: -1 });
    res.json({ registrations });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load registrations', error: err.message });
  }
};

// DELETE /api/admin/events/:id/registrations/:registrationId —
// registration_count is computed live, so no other bookkeeping needed.
const deleteRegistration = async (req, res) => {
  try {
    const registration = await EventRegistration.findOneAndDelete({
      _id: req.params.registrationId,
      event_id: req.params.id,
    });
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json({ message: 'Registration deleted', id: registration._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete registration', error: err.message });
  }
};

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  listRegistrationsForEvent,
  deleteRegistration,
};
