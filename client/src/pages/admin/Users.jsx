import { useEffect, useState } from 'react';
import { UsersRound } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ListPageHeader from '../../components/common/ListPageHeader';
import StatCards from '../../components/common/StatCards';
import Toolbar from '../../components/admin/Toolbar';
import StatusPill from '../../components/admin/StatusPill';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/common/Avatar';

const ROLES = ['student', 'instructor', 'admin', 'member'];
const ROLE_TONE = { admin: 'amber', instructor: 'teal', student: 'navy-outline', member: 'slate-outline' };

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [totals, setTotals] = useState({ total: 0, students: 0, instructors: 0 });

  // Unfiltered, independent of search/role filter — the stat row is a
  // stable overview, not something that should shrink as you filter.
  const loadTotals = async () => {
    try {
      const res = await api.get('/users');
      const all = res.data.users;
      setTotals({
        total: all.length,
        students: all.filter((u) => u.role === 'student').length,
        instructors: all.filter((u) => u.role === 'instructor').length,
      });
    } catch {
      // stat row just keeps its last known values
    }
  };

  useEffect(() => {
    loadTotals();
  }, []);

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
      loadTotals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setBusyId(null);
    }
  };

  const handleForumBanToggle = async (id, forum, banned) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/users/${id}/forum-ban`, { forum, banned });
      const field = forum === 'student' ? 'forum_ban_student' : 'forum_ban_alumni';
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, [field]: banned } : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update forum access');
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
      loadTotals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <ListPageHeader title="Users" subtitle="View every account, change roles, or remove an account." />

      <StatCards stats={[
        { label: 'Total Users', value: totals.total },
        { label: 'Students', value: totals.students },
        { label: 'Instructors', value: totals.instructors },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by name or email...">
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading users...</p>
        ) : users.length === 0 ? (
          <EmptyState icon={UsersRound} title="No users found" message="No users match this filter." />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Forum Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u._id === currentUser?._id;
                const isBusy = busyId === u._id;
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-table__title-cell">
                        <Avatar name={u.name} />
                        <span>{u.name} {isSelf && <span className="user-you-tag">(you)</span>}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <div className="admin-table__title-cell">
                        <StatusPill tone={ROLE_TONE[u.role]}>{u.role}</StatusPill>
                        <select
                          value={u.role}
                          disabled={isSelf || isBusy}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="payments-date">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {u.role === 'student' ? (
                        <div className="user-forum-toggles">
                          <button
                            type="button"
                            className={`btn btn--ghost btn--sm${u.forum_ban_student ? ' btn--danger-outline' : ''}`}
                            disabled={isBusy}
                            onClick={() => handleForumBanToggle(u._id, 'student', !u.forum_ban_student)}
                          >
                            {u.forum_ban_student ? 'Unban Student Forum' : 'Ban Student Forum'}
                          </button>
                          <button
                            type="button"
                            className={`btn btn--ghost btn--sm${u.forum_ban_alumni ? ' btn--danger-outline' : ''}`}
                            disabled={isBusy}
                            onClick={() => handleForumBanToggle(u._id, 'alumni', !u.forum_ban_alumni)}
                          >
                            {u.forum_ban_alumni ? 'Unban Alumni Forum' : 'Ban Alumni Forum'}
                          </button>
                        </div>
                      ) : '—'}
                    </td>
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
