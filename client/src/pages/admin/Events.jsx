import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FileEdit, Plus, Trash2, Users } from 'lucide-react';
import api from '../../api/axios';
import ListPageHeader from '../../components/common/ListPageHeader';
import StatCards from '../../components/common/StatCards';
import Toolbar from '../../components/admin/Toolbar';
import StatusPill from '../../components/admin/StatusPill';
import EmptyState from '../../components/common/EmptyState';
import EventFormModal from './EventFormModal';

const TYPE_LABELS = {
  seminar: 'Seminar',
  workshop: 'Workshop',
  hackathon: 'Hackathon',
  career_fair: 'Career Fair',
};
const TYPES = ['seminar', 'workshop', 'hackathon', 'career_fair'];

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formState, setFormState] = useState(null); // null closed, {} new, event editing

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/events');
      setEvents(res.data.events);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaved = (savedEvent) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e._id === savedEvent._id);
      const next = exists ? prev.map((e) => (e._id === savedEvent._id ? savedEvent : e)) : [...prev, savedEvent];
      // Newest event date first — matches the server's sort order.
      return next.sort((a, b) => new Date(b.date) - new Date(a.date));
    });
    setFormState(null);
  };

  const handleDelete = async (eventItem) => {
    if (!window.confirm(`Delete "${eventItem.title}"? This can't be undone.`)) return;
    setBusyId(eventItem._id);
    setError('');
    try {
      await api.delete(`/admin/events/${eventItem._id}`);
      setEvents((prev) => prev.filter((e) => e._id !== eventItem._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();
  const stats = useMemo(() => ({
    total: events.length,
    upcoming: events.filter((e) => new Date(e.date).getTime() >= now).length,
    past: events.filter((e) => new Date(e.date).getTime() < now).length,
  }), [events, now]);

  const visibleEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (typeFilter && e.type !== typeFilter) return false;
      if (!q) return true;
      return `${e.title} ${e.location}`.toLowerCase().includes(q);
    });
  }, [events, search, typeFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Events"
        subtitle="Create and manage workshops, meetups, and info sessions."
        action={{ label: 'New Event', icon: Plus, onClick: () => setFormState({}) }}
      />

      <StatCards stats={[
        { label: 'Total Events', value: stats.total },
        { label: 'Upcoming', value: stats.upcoming, accent: true },
        { label: 'Past', value: stats.past },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by title or location...">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading events...</p>
        ) : visibleEvents.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events found"
            message={search || typeFilter ? 'No events match your search or filter.' : 'Create your first event to get started.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Price</th>
                <th>Location</th>
                <th>Date</th>
                <th>Registrations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleEvents.map((eventItem) => (
                <tr key={eventItem._id}>
                  <td>
                    <div className="admin-table__title-cell">
                      {eventItem.image_url ? (
                        <img src={eventItem.image_url} alt="" className="admin-table__thumb" />
                      ) : (
                        <span className="admin-table__thumb admin-table__thumb--placeholder" />
                      )}
                      <strong>{eventItem.title}</strong>
                    </div>
                  </td>
                  <td>{TYPE_LABELS[eventItem.type] || eventItem.type}</td>
                  <td>{eventItem.is_paid ? `₦${Number(eventItem.price).toLocaleString()}` : 'Free'}</td>
                  <td>{eventItem.location}</td>
                  <td className="payments-date">
                    {new Date(eventItem.date).toLocaleDateString()}{' '}
                    <StatusPill tone={new Date(eventItem.date).getTime() >= now ? 'teal' : 'slate'}>
                      {new Date(eventItem.date).getTime() >= now ? 'Upcoming' : 'Past'}
                    </StatusPill>
                  </td>
                  <td>
                    {eventItem.registration_count}{eventItem.max_participants ? ` / ${eventItem.max_participants}` : ''}
                  </td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/events/${eventItem._id}/registrants`} className="btn btn--ghost">
                      <Users size={14} aria-hidden="true" /> Registrations
                    </Link>
                    <button type="button" className="btn btn--ghost" onClick={() => setFormState(eventItem)}>
                      <FileEdit size={14} aria-hidden="true" /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busyId === eventItem._id}
                      onClick={() => handleDelete(eventItem)}
                    >
                      <Trash2 size={14} aria-hidden="true" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formState !== null && (
        <EventFormModal
          event={formState._id ? formState : null}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
