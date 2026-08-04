import { useEffect, useMemo, useState } from 'react';
import { MessagesSquare } from 'lucide-react';
import api from '../../api/axios';
import ListPageHeader from '../../components/common/ListPageHeader';
import StatCards from '../../components/common/StatCards';
import Toolbar from '../../components/admin/Toolbar';
import StatusPill from '../../components/admin/StatusPill';
import EmptyState from '../../components/common/EmptyState';

const STATUS_TONE = { active: 'teal', removed: 'danger' };
const FORUM_LABELS = { student: 'Student Forum', alumni: 'Alumni Forum' };

export default function ForumModeration() {
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [forumFilter, setForumFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [postsRes, repliesRes] = await Promise.all([
        api.get('/admin/forum-posts'),
        api.get('/admin/forum-replies'),
      ]);
      setPosts(postsRes.data.posts);
      setReplies(repliesRes.data.replies);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load forum moderation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    totalPosts: posts.length,
    removedPosts: posts.filter((p) => p.status === 'removed').length,
    totalReplies: replies.length,
    removedReplies: replies.filter((r) => r.status === 'removed').length,
  }), [posts, replies]);

  const visiblePosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (forumFilter && p.forum_type !== forumFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      return `${p.content} ${p.author_id?.name || ''}`.toLowerCase().includes(q);
    });
  }, [posts, search, forumFilter, statusFilter]);

  const visibleReplies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return replies.filter((r) => {
      if (forumFilter && r.post_id?.forum_type !== forumFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return `${r.content} ${r.author_id?.name || ''}`.toLowerCase().includes(q);
    });
  }, [replies, search, forumFilter, statusFilter]);

  const startRemoving = (id) => {
    setRemovingId(id);
    setReason('');
  };

  const confirmRemove = async (kind, id) => {
    if (!reason.trim()) return;
    setBusyId(id);
    setError('');
    try {
      const endpoint = kind === 'post' ? `/admin/forum-posts/${id}/remove` : `/admin/forum-replies/${id}/remove`;
      const res = await api.patch(endpoint, { reason: reason.trim() });
      if (kind === 'post') {
        setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, ...res.data.post } : p)));
      } else {
        setReplies((prev) => prev.map((r) => (r._id === id ? { ...r, ...res.data.reply } : r)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove');
    } finally {
      setBusyId(null);
      setRemovingId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Forum Moderation"
        subtitle="Remove rule-breaking posts/replies (soft delete, kept for record-keeping) and review past removals."
      />

      <StatCards stats={[
        { label: 'Total Posts', value: stats.totalPosts },
        { label: 'Removed Posts', value: stats.removedPosts, accent: true },
        { label: 'Total Replies', value: stats.totalReplies },
        { label: 'Removed Replies', value: stats.removedReplies, accent: true },
      ]} />

      <div className="admin-tabs">
        <button type="button" className={`admin-tabs__item${tab === 'posts' ? ' is-active' : ''}`} onClick={() => setTab('posts')}>
          Posts
        </button>
        <button type="button" className={`admin-tabs__item${tab === 'replies' ? ' is-active' : ''}`} onClick={() => setTab('replies')}>
          Replies
        </button>
      </div>

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by author or content...">
        <select value={forumFilter} onChange={(e) => setForumFilter(e.target.value)}>
          <option value="">Both forums</option>
          <option value="student">Student Forum</option>
          <option value="alumni">Alumni Forum</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="removed">Removed</option>
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading...</p>
        ) : tab === 'posts' ? (
          visiblePosts.length === 0 ? (
            <EmptyState icon={MessagesSquare} title="No posts found" message="No posts match this filter." />
          ) : (
            <table className="invite-table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Forum</th>
                  <th>Content</th>
                  <th>Replies</th>
                  <th>Posted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePosts.map((p) => (
                  <tr key={p._id}>
                    <td>{p.author_id?.name || '—'}</td>
                    <td>{FORUM_LABELS[p.forum_type]}</td>
                    <td className="forum-mod-content">{p.content}</td>
                    <td>{p.reply_count}</td>
                    <td className="payments-date">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td><StatusPill tone={STATUS_TONE[p.status]}>{p.status}</StatusPill></td>
                    <td>
                      {p.status === 'removed' ? (
                        <span className="forum-mod-removed-note">
                          By {p.removed_by?.name || '—'} · {p.removed_reason}
                        </span>
                      ) : removingId === p._id ? (
                        <span className="confirm-delete">
                          <input
                            type="text"
                            placeholder="Reason for removal"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                          />
                          <button type="button" className="btn btn--danger" disabled={busyId === p._id || !reason.trim()} onClick={() => confirmRemove('post', p._id)}>
                            {busyId === p._id ? 'Removing...' : 'Confirm'}
                          </button>
                          <button type="button" className="btn btn--ghost" onClick={() => setRemovingId(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button type="button" className="btn btn--ghost" onClick={() => startRemoving(p._id)}>Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : visibleReplies.length === 0 ? (
          <EmptyState icon={MessagesSquare} title="No replies found" message="No replies match this filter." />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Forum</th>
                <th>Reply</th>
                <th>On post</th>
                <th>Posted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleReplies.map((r) => (
                <tr key={r._id}>
                  <td>{r.author_id?.name || '—'}</td>
                  <td>{FORUM_LABELS[r.post_id?.forum_type] || '—'}</td>
                  <td className="forum-mod-content">{r.content}</td>
                  <td className="forum-mod-content">{r.post_id?.content || '—'}</td>
                  <td className="payments-date">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td><StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill></td>
                  <td>
                    {r.status === 'removed' ? (
                      <span className="forum-mod-removed-note">
                        By {r.removed_by?.name || '—'} · {r.removed_reason}
                      </span>
                    ) : removingId === r._id ? (
                      <span className="confirm-delete">
                        <input
                          type="text"
                          placeholder="Reason for removal"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                        <button type="button" className="btn btn--danger" disabled={busyId === r._id || !reason.trim()} onClick={() => confirmRemove('reply', r._id)}>
                          {busyId === r._id ? 'Removing...' : 'Confirm'}
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => setRemovingId(null)}>Cancel</button>
                      </span>
                    ) : (
                      <button type="button" className="btn btn--ghost" onClick={() => startRemoving(r._id)}>Remove</button>
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
