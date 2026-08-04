import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import ListPageHeader from '../../components/common/ListPageHeader';
import StatCards from '../../components/common/StatCards';
import StatusPill from '../../components/admin/StatusPill';
import EmptyState from '../../components/common/EmptyState';

export default function EventRegistrants() {
  const { eventId } = useParams();
  const [eventItem, setEventItem] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (registrationId) => {
    setDeletingId(registrationId);
    setError('');
    try {
      await api.delete(`/admin/events/${eventId}/registrations/${registrationId}`);
      setRegistrations((prev) => prev.filter((r) => r._id !== registrationId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete registration');
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get(`/admin/events/${eventId}`),
      api.get(`/admin/events/${eventId}/registrations`),
    ])
      .then(([eventRes, registrationsRes]) => {
        setEventItem(eventRes.data.event);
        setRegistrations(registrationsRes.data.registrations);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load registrants'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const stats = [{ label: 'Total Registrants', value: registrations.length }];
  if (eventItem?.max_participants) {
    stats.push({ label: 'Spots Remaining', value: Math.max(eventItem.max_participants - registrations.length, 0), accent: true });
  }

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title={`Registrants${eventItem ? `: ${eventItem.title}` : ''}`}
        subtitle={<Link to="/admin/events">&larr; Back to Events</Link>}
      />

      {!loading && <StatCards stats={stats} />}

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading registrants...</p>
        ) : registrations.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No registrants yet"
            message="Registrants will appear here once people sign up for this event."
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                {eventItem?.is_paid && <th>Willing to Pay</th>}
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r._id}>
                  <td>{r.full_name}</td>
                  <td>{r.email}</td>
                  <td>{r.phone}</td>
                  {eventItem?.is_paid && (
                    <td>
                      <StatusPill tone={r.willing_to_pay_at_event ? 'teal' : 'danger'}>
                        {r.willing_to_pay_at_event ? 'Yes' : 'No'}
                      </StatusPill>
                    </td>
                  )}
                  <td className="payments-date">{new Date(r.registered_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    {confirmingId === r._id ? (
                      <span className="confirm-delete">
                        <span>Delete?</span>
                        <button type="button" className="btn btn--delete-decorated" disabled={deletingId === r._id} onClick={() => handleDelete(r._id)}>
                          <Trash2 size={14} /> {deletingId === r._id ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(null)}>Cancel</button>
                      </span>
                    ) : (
                      <button type="button" className="btn btn--delete-decorated" title="Delete registration" onClick={() => setConfirmingId(r._id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
