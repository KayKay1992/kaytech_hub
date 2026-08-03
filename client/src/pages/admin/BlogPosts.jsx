import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, BookOpen, FileEdit, Plus } from 'lucide-react';
import api from '../../api/axios';
import ListPageHeader from '../../components/common/ListPageHeader';
import StatCards from '../../components/common/StatCards';
import Toolbar from '../../components/admin/Toolbar';
import StatusPill from '../../components/admin/StatusPill';
import EmptyState from '../../components/common/EmptyState';

const STATUS_TONE = { published: 'teal', draft: 'slate' };
const STATUSES = ['draft', 'published'];

export default function AdminBlogPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/blog');
      setPosts(res.data.posts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusToggle = async (post) => {
    setBusyId(post._id);
    setError('');
    try {
      const nextStatus = post.status === 'published' ? 'draft' : 'published';
      const res = await api.patch(`/admin/blog/${post._id}`, { status: nextStatus });
      setPosts((prev) => prev.map((p) => (p._id === post._id ? res.data.post : p)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post status');
    } finally {
      setBusyId(null);
    }
  };

  const stats = useMemo(() => ({
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
  }), [posts]);

  const visiblePosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q);
    });
  }, [posts, search, statusFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Blog"
        subtitle="Write, edit, and publish articles for the public Blog page."
        action={{ label: 'New Post', icon: Plus, to: '/admin/blog/new' }}
      />

      <StatCards stats={[
        { label: 'Total Posts', value: stats.total },
        { label: 'Published', value: stats.published, accent: true },
        { label: 'Drafts', value: stats.draft },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by title...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading blog posts...</p>
        ) : visiblePosts.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No blog posts found"
            message={search || statusFilter ? 'No posts match your search or filter.' : 'Write your first post to get started.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePosts.map((post) => (
                <tr key={post._id}>
                  <td>
                    <div className="admin-table__title-cell">
                      {post.image_url ? (
                        <img src={post.image_url} alt="" className="admin-table__thumb" />
                      ) : (
                        <span className="admin-table__thumb admin-table__thumb--placeholder" />
                      )}
                      <strong>{post.title}</strong>
                    </div>
                  </td>
                  <td>{post.author_id?.name || '—'}</td>
                  <td><StatusPill tone={STATUS_TONE[post.status]}>{post.status}</StatusPill></td>
                  <td className="payments-date">{post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}</td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/blog/${post._id}/edit`} className="btn btn--ghost">
                      <FileEdit size={14} aria-hidden="true" /> Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busyId === post._id}
                      onClick={() => handleStatusToggle(post)}
                    >
                      {post.status === 'published' ? (
                        <><Archive size={14} aria-hidden="true" /> Unpublish</>
                      ) : (
                        <><ArchiveRestore size={14} aria-hidden="true" /> Publish</>
                      )}
                    </button>
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
