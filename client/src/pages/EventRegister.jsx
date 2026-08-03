import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import FormPanel from '../components/common/FormPanel';
import HoneypotField from '../components/common/HoneypotField';
import api from '../api/axios';

const EMPTY_FORM = { full_name: '', email: '', phone: '', willing_to_pay_at_event: false, website: '' };

const TYPE_LABELS = {
  seminar: 'Seminar',
  workshop: 'Workshop',
  hackathon: 'Hackathon',
  career_fair: 'Career Fair',
};

export default function EventRegister() {
  const { eventId } = useParams();
  const [eventItem, setEventItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/events/${eventId}`)
      .then((res) => setEventItem(res.data.event))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post(`/events/${eventId}/register`, form);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <section className="section coming-soon"><p>Loading...</p></section>;
  }

  if (notFound || !eventItem) {
    return (
      <section className="section coming-soon">
        <h1>Event not found</h1>
        <p>We couldn't find that event.</p>
        <Link to="/events" className="btn btn--primary">Back to Events</Link>
      </section>
    );
  }

  const hasEnded = new Date(eventItem.date).getTime() < Date.now();
  const isFull = Boolean(eventItem.max_participants) && eventItem.registration_count >= eventItem.max_participants;

  // The Events list already disables the button in these cases, but this
  // page can still be reached directly by URL — re-check before showing the form.
  if (hasEnded || isFull) {
    return (
      <section className="section coming-soon">
        <h1>{hasEnded ? 'This event has ended' : 'This event is fully booked'}</h1>
        <p>{hasEnded ? "Registration is no longer available for this event." : 'All spots for this event have been taken.'}</p>
        <Link to="/events" className="btn btn--primary">Back to Events</Link>
      </section>
    );
  }

  return (
    <section className="section">
      <Reveal as="div" className="form-page__header">
        <Link to="/events" className="btn btn--ghost form-page__back">&larr; Back to Events</Link>
        <h1>Register: {eventItem.title}</h1>
        <p className="prose">
          {TYPE_LABELS[eventItem.type] || eventItem.type} · {new Date(eventItem.date).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {eventItem.location}
          {eventItem.is_paid && ` · ₦${Number(eventItem.price).toLocaleString()}`}
        </p>
      </Reveal>

      <Reveal as="div" delay={0.1}>
        <FormPanel>
          {submitted ? (
            <div className="dark-form">
              <h3>Registration received</h3>
              <p className="form-success">Thanks, {form.full_name.split(' ')[0]} — we'll see you there.</p>
            </div>
          ) : (
            <form className="dark-form" onSubmit={handleSubmit}>
              {submitError && <p className="form-error">{submitError}</p>}

              <HoneypotField value={form.website} onChange={handleChange} />

              <label>
                Full name
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                Phone
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
              </label>

              {eventItem.is_paid && (
                <label className="dark-form__checkbox-label">
                  <input
                    type="checkbox"
                    name="willing_to_pay_at_event"
                    checked={form.willing_to_pay_at_event}
                    onChange={handleChange}
                    required
                  />
                  <span>
                    I understand this is a paid event (₦{Number(eventItem.price).toLocaleString()}) and I agree to pay on the event date
                  </span>
                </label>
              )}

              <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Register'}
              </button>
            </form>
          )}
        </FormPanel>
      </Reveal>
    </section>
  );
}
