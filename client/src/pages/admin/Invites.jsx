import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Reveal from '../../components/common/Reveal';

export default function Invites() {
  const [role, setRole] = useState('student');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [lastCode, setLastCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadInvites = async () => {
    try {
      const res = await api.get('/invites');
      setInvites(res.data.invites);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invite codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setCopied(false);
    setGenerating(true);
    try {
      const res = await api.post('/invites', { role });
      setLastCode(res.data.invite.code);
      await loadInvites();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invite code');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await api.delete(`/invites/${id}`);
      setInvites((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete invite code');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  const statusLabel = (invite) => {
    if (invite.status === 'used') return 'Used';
    if (invite.is_expired) return 'Expired';
    return 'Unused';
  };

  const statusClass = (invite) => {
    if (invite.status === 'used') return 'invite-status--used';
    if (invite.is_expired) return 'invite-status--expired';
    return 'invite-status--unused';
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <h1>Invite Codes</h1>
        <p className="admin-dashboard__subtitle">
          Generate a code for a student or instructor, then send it to them yourself (email, WhatsApp, etc).
          Codes expire 7 days after creation.
        </p>
      </Reveal>

      <form className="invite-form" onSubmit={handleGenerate}>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
        <button type="submit" className="btn btn--primary" disabled={generating}>
          {generating ? 'Generating...' : 'Generate Code'}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {lastCode && (
        <div className="invite-generated">
          <span>New code:</span>
          <code>{lastCode}</code>
          <button type="button" className="btn btn--ghost" onClick={() => copyCode(lastCode)}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading invite codes...</p>
        ) : invites.length === 0 ? (
          <p>No invite codes generated yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Used By</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const isBusy = busyId === invite._id;
                return (
                  <tr key={invite._id}>
                    <td><code>{invite.code}</code></td>
                    <td>{invite.role}</td>
                    <td>
                      <span className={`invite-status ${statusClass(invite)}`}>{statusLabel(invite)}</span>
                    </td>
                    <td>{invite.created_by?.name || '—'}</td>
                    <td>{invite.used_by?.name || '—'}</td>
                    <td>{new Date(invite.created_at).toLocaleDateString()}</td>
                    <td>{new Date(invite.expires_at).toLocaleDateString()}</td>
                    <td>
                      {confirmingId === invite._id ? (
                        <span className="confirm-delete">
                          <span>Delete this code?</span>
                          <button type="button" className="btn btn--danger" disabled={isBusy} onClick={() => handleDelete(invite._id)}>
                            {isBusy ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(invite._id)}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
