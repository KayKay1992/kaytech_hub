import { useEffect, useState } from 'react';
import { MessageCircle, ShieldAlert, UsersRound } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Toolbar from '../admin/Toolbar';
import EmptyState from '../common/EmptyState';
import Modal from '../common/Modal';
import { getInitials } from '../../utils/initials';

const MESSAGE_MAX_LENGTH = 2000;

// Shared Alumni Directory grid, reused across Student/Instructor/Admin
// dashboards — same access rule as the Alumni Forum. Only alumni who've
// opted in (User.show_in_alumni_directory) and still hold a Certificate
// ever appear; that's enforced server-side, not just hidden in the UI.
export default function AlumniDirectory() {
  const { user } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // "Reach Me" composer — routes through the platform (Notification system)
  // rather than ever exposing the recipient's email/phone on the card.
  const [contacting, setContacting] = useState(null); // the alumni object being messaged
  const [messageText, setMessageText] = useState('');
  const [includeEmail, setIncludeEmail] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [sending, setSending] = useState(false);

  const load = async (q) => {
    setLoading(true);
    setAccessMessage('');
    setError('');
    try {
      const res = await api.get('/forums/alumni/directory', { params: q ? { search: q } : {} });
      setAlumni(res.data.alumni);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessMessage(err.response.data.message || "You don't have access to the Alumni Directory.");
      } else {
        setError(err.response?.data?.message || 'Failed to load the alumni directory');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 250); // debounce search typing
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openContact = (alumnus) => {
    setContacting(alumnus);
    setMessageText('');
    setIncludeEmail(false);
    setSendError('');
    setSendSuccess('');
  };

  const closeContact = () => setContacting(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSending(true);
    setSendError('');
    try {
      await api.post(`/forums/alumni/directory/${contacting._id}/message`, {
        message: messageText.trim(),
        include_email: includeEmail,
      });
      setSendSuccess(`Message sent to ${contacting.name} — they'll see it in their Notifications.`);
      setMessageText('');
    } catch (err) {
      setSendError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading && alumni.length === 0 && !accessMessage && !error) {
    return <p className="payments-empty">Loading alumni directory...</p>;
  }

  if (accessMessage) {
    return (
      <div className="forum-access-denied">
        <ShieldAlert size={32} aria-hidden="true" />
        <h2>Alumni Directory</h2>
        <p>{accessMessage}</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Alumni Directory</h1>
          <p className="admin-dashboard__subtitle">
            Browse KayTech Hub graduates who've opted in to be discoverable — search by name or course.
          </p>
        </div>
      </div>

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by name or course..." />

      {error && <p className="form-error">{error}</p>}

      {alumni.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No alumni found"
          message="No one matches this search, or no graduates have opted into the directory yet."
        />
      ) : (
        <div className="dashboard-course-grid">
          {alumni.map((a) => (
            <div key={a._id} className="card alumni-card">
              <div className="alumni-card__head">
                <span className="alumni-card__avatar">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt={a.name} />
                  ) : (
                    <span className="alumni-card__avatar-initials">{getInitials(a.name)}</span>
                  )}
                </span>
                <div>
                  <h3 className="alumni-card__name">{a.name}</h3>
                  {(a.current_role || a.current_company) && (
                    <p className="alumni-card__role">
                      {a.current_role}
                      {a.current_role && a.current_company ? ' at ' : ''}
                      {a.current_company}
                    </p>
                  )}
                </div>
              </div>

              <div className="alumni-course-tags">
                {a.courses.map((title) => (
                  <span key={title} className="badge">{title}</span>
                ))}
              </div>

              {a.alumni_bio && <p className="alumni-card__bio">{a.alumni_bio}</p>}

              {a._id !== user?._id && (
                <button type="button" className="btn btn--ghost alumni-card__reach-btn" onClick={() => openContact(a)}>
                  <MessageCircle size={15} aria-hidden="true" /> Reach Me
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {contacting && (
        <Modal title={`Message ${contacting.name}`} onClose={closeContact}>
          <p className="form-hint">
            Sent through KayTech Hub as a notification — {contacting.name} won't see your email or phone unless you choose to share it below.
          </p>

          {sendError && <p className="form-error">{sendError}</p>}

          {sendSuccess ? (
            <>
              <p className="form-success">{sendSuccess}</p>
              <button type="button" className="btn btn--ghost" onClick={closeContact}>Close</button>
            </>
          ) : (
            <form className="auth-form profile-form" onSubmit={handleSend}>
              <label>
                Your message
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={5}
                  maxLength={MESSAGE_MAX_LENGTH}
                  placeholder={`Say hi to ${contacting.name}...`}
                  required
                />
              </label>

              <label className="auth-form__checkbox-label">
                <input type="checkbox" checked={includeEmail} onChange={(e) => setIncludeEmail(e.target.checked)} />
                <span>Include my email so they can reply directly</span>
              </label>

              <button type="submit" className="btn btn--primary" disabled={sending || !messageText.trim()}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
