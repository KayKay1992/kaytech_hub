import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Reveal from '../../components/common/Reveal';
import Modal from '../../components/common/Modal';

const TARGET_LABELS = {
  all: 'Everyone',
  all_students: 'All Students',
  all_instructors: 'All Instructors',
  specific_user: null, // resolved per-notification from target_user_id
};

const CONTACT_TYPE_LABELS = { general: 'General', partnership: 'Partnership', corporate: 'Corporate' };
const CONTACT_STATUSES = ['new', 'read', 'responded'];

function targetLabel(notification) {
  if (notification.target_type === 'specific_user') {
    const u = notification.target_user_id;
    return u ? `${u.name} (${u.email})` : 'Specific user';
  }
  return TARGET_LABELS[notification.target_type] || notification.target_type;
}

export default function Notifications() {
  const [tab, setTab] = useState('sent');

  // Compose form state
  const [form, setForm] = useState({ title: '', message: '', target_type: 'all' });
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [composeError, setComposeError] = useState('');

  // Sent history
  const [sent, setSent] = useState([]);
  const [sentLoading, setSentLoading] = useState(true);

  // Inbox
  const [messages, setMessages] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [viewingMessage, setViewingMessage] = useState(null);

  const loadSent = async () => {
    setSentLoading(true);
    try {
      const res = await api.get('/admin/notifications');
      setSent(res.data.notifications);
    } catch {
      // surfaced via composeError on send; a failed history load just shows empty
    } finally {
      setSentLoading(false);
    }
  };

  const loadInbox = async () => {
    setInboxLoading(true);
    try {
      const res = await api.get('/admin/contact-messages');
      setMessages(res.data.messages);
    } catch (err) {
      setInboxError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setInboxLoading(false);
    }
  };

  useEffect(() => {
    loadSent();
    loadInbox();
  }, []);

  // Debounced user search for the "specific user" target
  useEffect(() => {
    if (form.target_type !== 'specific_user' || !userSearch.trim() || selectedUser) {
      setUserResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api.get('/users', { params: { search: userSearch.trim() } })
        .then((res) => setUserResults(res.data.users))
        .catch(() => setUserResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [userSearch, form.target_type, selectedUser]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleTargetTypeChange = (e) => {
    setForm({ ...form, target_type: e.target.value });
    setSelectedUser(null);
    setUserSearch('');
    setUserResults([]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setComposeError('');

    if (form.target_type === 'specific_user' && !selectedUser) {
      setComposeError('Pick a user to send this to.');
      return;
    }

    setSending(true);
    try {
      await api.post('/admin/notifications', {
        title: form.title,
        message: form.message,
        target_type: form.target_type,
        target_user_id: form.target_type === 'specific_user' ? selectedUser._id : undefined,
      });
      setForm({ title: '', message: '', target_type: 'all' });
      setSelectedUser(null);
      setUserSearch('');
      await loadSent();
    } catch (err) {
      setComposeError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleContactStatusChange = async (id, status) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/contact-messages/${id}`, { status });
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status } : m)));
    } catch (err) {
      setInboxError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <h1>Notifications</h1>
        <p className="admin-dashboard__subtitle">Send messages to students/instructors, and see incoming Contact submissions.</p>
      </Reveal>

      <div className="notification-tabs">
        <button type="button" className={tab === 'sent' ? 'is-active' : ''} onClick={() => setTab('sent')}>Sent</button>
        <button type="button" className={tab === 'inbox' ? 'is-active' : ''} onClick={() => setTab('inbox')}>
          Inbox {messages.filter((m) => m.status === 'new').length > 0 && `(${messages.filter((m) => m.status === 'new').length})`}
        </button>
      </div>

      {tab === 'sent' && (
        <>
          <form className="auth-form compose-form" onSubmit={handleSend}>
            <h3>Compose</h3>
            {composeError && <p className="form-error">{composeError}</p>}

            <label>
              Title
              <input type="text" name="title" value={form.title} onChange={handleChange} required />
            </label>

            <label>
              Message
              <textarea name="message" rows={4} value={form.message} onChange={handleChange} required />
            </label>

            <label>
              Send to
              <select name="target_type" value={form.target_type} onChange={handleTargetTypeChange}>
                <option value="all">Everyone</option>
                <option value="all_students">All Students</option>
                <option value="all_instructors">All Instructors</option>
                <option value="specific_user">Specific User</option>
              </select>
            </label>

            {form.target_type === 'specific_user' && (
              <div className="user-picker">
                {selectedUser ? (
                  <div className="user-picker__selected">
                    <span>{selectedUser.name} ({selectedUser.email})</span>
                    <button type="button" className="btn btn--ghost" onClick={() => setSelectedUser(null)}>Change</button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                    {userResults.length > 0 && (
                      <div className="user-picker__results">
                        {userResults.map((u) => (
                          <button
                            type="button"
                            key={u._id}
                            className="user-picker__result"
                            onClick={() => { setSelectedUser(u); setUserResults([]); }}
                          >
                            {u.name} — {u.email} ({u.role})
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <button type="submit" className="btn btn--primary btn--full" disabled={sending}>
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>

          <h3>Send History</h3>
          <div className="invite-table-wrap">
            {sentLoading ? (
              <p>Loading...</p>
            ) : sent.length === 0 ? (
              <p>No notifications sent yet.</p>
            ) : (
              <table className="invite-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Sent To</th>
                    <th>Sender</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sent.map((n) => (
                    <tr key={n._id}>
                      <td>{n.title}</td>
                      <td>{targetLabel(n)}</td>
                      <td>{n.sender_id?.name || '—'}</td>
                      <td>{new Date(n.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'inbox' && (
        <>
          {inboxError && <p className="form-error">{inboxError}</p>}
          <div className="invite-table-wrap">
            {inboxLoading ? (
              <p>Loading...</p>
            ) : messages.length === 0 ? (
              <p>No messages received yet.</p>
            ) : (
              <table className="invite-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Received</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m._id}>
                      <td>{m.name} ({m.email}){m.sender_id && <> · <span className="user-you-tag">{m.sender_id.role}</span></>}</td>
                      <td>{CONTACT_TYPE_LABELS[m.type] || m.type}</td>
                      <td className="job-applications__note">
                        {m.message.length > 60 ? `${m.message.slice(0, 60)}…` : m.message}
                      </td>
                      <td>
                        <select
                          value={m.status}
                          disabled={busyId === m._id}
                          onChange={(e) => handleContactStatusChange(m._id, e.target.value)}
                        >
                          {CONTACT_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>{new Date(m.submitted_at).toLocaleDateString()}</td>
                      <td>
                        <button type="button" className="btn btn--ghost" onClick={() => setViewingMessage(m)}>
                          View Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {viewingMessage && (
        <Modal title={`Message from ${viewingMessage.name}`} onClose={() => setViewingMessage(null)}>
          <p className="modal__meta">
            {viewingMessage.email} · {CONTACT_TYPE_LABELS[viewingMessage.type] || viewingMessage.type}
            {viewingMessage.sender_id && <> · {viewingMessage.sender_id.role}</>}
            {' · '}{new Date(viewingMessage.submitted_at).toLocaleString()}
          </p>
          <p>{viewingMessage.message}</p>
        </Modal>
      )}
    </div>
  );
}
