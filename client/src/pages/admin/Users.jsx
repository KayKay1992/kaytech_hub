import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Reveal from '../../components/common/Reveal';

const ROLES = ['student', 'instructor', 'admin', 'member'];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/users', { params });
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(loadUsers, 250); // debounce search typing
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, search]);

  const handleRoleChange = async (id, role) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <h1>Users</h1>
        <p className="admin-dashboard__subtitle">
          View every account, change roles, or remove an account.
        </p>
      </Reveal>

      <div className="user-filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users match this filter.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u._id === currentUser?._id;
                const isBusy = busyId === u._id;
                return (
                  <tr key={u._id}>
                    <td>{u.name} {isSelf && <span className="user-you-tag">(you)</span>}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={isSelf || isBusy}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {confirmingId === u._id ? (
                        <span className="confirm-delete">
                          <span>Delete this user? This cannot be undone.</span>
                          <button type="button" className="btn btn--danger" disabled={isBusy} onClick={() => handleDelete(u._id)}>
                            {isBusy ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--ghost"
                          disabled={isSelf}
                          onClick={() => setConfirmingId(u._id)}
                        >
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
