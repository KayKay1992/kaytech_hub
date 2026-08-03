import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import api from '../api/axios';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import NotifyCta from '../components/common/NotifyCta';

const TYPE_LABELS = {
  seminar: 'Seminar',
  workshop: 'Workshop',
  hackathon: 'Hackathon',
  career_fair: 'Career Fair',
};

// Register button has three states: normal (upcoming + space available),
// disabled "Event Ended" (date has passed), disabled "Fully Booked"
// (max_participants reached). The date/capacity checks are re-validated
// server-side too, since this is just the button's presentation.
function RegisterButton({ eventItem }) {
  const hasEnded = new Date(eventItem.date).getTime() < Date.now();
  const isFull = Boolean(eventItem.max_participants) && eventItem.registration_count >= eventItem.max_participants;

  if (hasEnded) {
    return <button type="button" className="btn btn--ghost course-card__cta" disabled>Event Ended</button>;
  }
  if (isFull) {
    return <button type="button" className="btn btn--ghost course-card__cta" disabled>Fully Booked</button>;
  }
  return (
    <Link to={`/events/${eventItem._id}/register`} className="btn btn--primary course-card__cta">
      Register <span aria-hidden="true">&rarr;</span>
    </Link>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/events')
      .then((res) => setEvents(res.data.events))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="KayTech Hub"
        title="Events"
        description="Workshops, meetups, and info sessions happening at KayTech Hub."
      />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p>No events scheduled right now — check back soon.</p>
        ) : (
          <div className="card-grid">
            {events.map((eventItem, i) => {
              const spotsLeft = eventItem.max_participants ? eventItem.max_participants - eventItem.registration_count : null;
              return (
                <Reveal as="div" className="card event-card" key={eventItem._id} index={i}>
                  {eventItem.image_url && (
                    <div className="event-card__image-wrap">
                      <img src={eventItem.image_url} alt={eventItem.title} className="event-card__image" />
                    </div>
                  )}

                  <span className="badge">{TYPE_LABELS[eventItem.type] || eventItem.type}</span>
                  {' '}
                  <span className={`event-badge ${eventItem.is_paid ? 'event-badge--paid' : 'event-badge--free'}`}>
                    {eventItem.is_paid ? `Paid — ₦${Number(eventItem.price).toLocaleString()}` : 'Free'}
                  </span>

                  <h3>{eventItem.title}</h3>
                  <p>{eventItem.description}</p>

                  <div className="event-card__meta-row">
                    <span><CalendarDays size={14} aria-hidden="true" /> {new Date(eventItem.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    <span><MapPin size={14} aria-hidden="true" /> {eventItem.location}</span>
                  </div>

                  {spotsLeft !== null && (
                    <span className={`event-card__spots ${spotsLeft <= 0 ? 'event-card__spots--low' : ''}`}>
                      {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : 'No spots remaining'}
                    </span>
                  )}

                  <div className="event-card__footer">
                    <RegisterButton eventItem={eventItem} />
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      <NotifyCta text="Want a heads-up on new events? Contact us to hear about upcoming dates." />
    </>
  );
}
