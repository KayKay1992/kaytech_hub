const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');

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

// GET /api/events — public, soonest first
const listUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json({ events: await withRegistrationCounts(events) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load events', error: err.message });
  }
};

// GET /api/events/:id — public
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

// POST /api/events/:id/register — public. Re-checks date and capacity
// server-side since the disabled button state on the client can be bypassed
// by hitting the registration page URL directly.
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (new Date(event.date).getTime() < Date.now()) {
      return res.status(400).json({ message: 'This event has already ended' });
    }

    const registration_count = await EventRegistration.countDocuments({ event_id: event._id });
    if (event.max_participants && registration_count >= event.max_participants) {
      return res.status(400).json({ message: 'This event is fully booked' });
    }

    const { full_name, email, phone } = req.body;
    const willing_to_pay_at_event = req.body.willing_to_pay_at_event === true || req.body.willing_to_pay_at_event === 'true';

    if (!full_name || !email || !phone) {
      return res.status(400).json({ message: 'Full name, email, and phone are required' });
    }
    if (event.is_paid && !willing_to_pay_at_event) {
      return res.status(400).json({ message: 'Please confirm you agree to pay on the event date' });
    }

    const registration = await EventRegistration.create({
      event_id: event._id,
      full_name,
      email,
      phone,
      willing_to_pay_at_event: event.is_paid ? willing_to_pay_at_event : false,
    });

    res.status(201).json({ registration });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit registration', error: err.message });
  }
};

module.exports = { listUpcomingEvents, getEvent, registerForEvent };
