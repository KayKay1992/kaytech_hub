import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessagesSquare, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import ForumPostCard from './ForumPostCard';

const FORUM_LABELS = { student: 'Student Forum', alumni: 'Alumni Forum' };

// Shared feed for both forums, reused across Student/Instructor/Admin
// dashboards. `basePath` (e.g. "/student") builds links to the detail page,
// since each role has its own route tree.
export default function ForumFeed({ basePath }) {
  const { forumType } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const label = FORUM_LABELS[forumType] || 'Forum';

  const load = async () => {
    setLoading(true);
    setAccessMessage('');
    try {
      const res = await api.get(`/forums/${forumType}/posts`);
      setPosts(res.data.posts);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessMessage(err.response.data.message || "You don't have access to this forum.");
      } else {
        setError(err.response?.data?.message || 'Failed to load posts');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [forumType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    setError('');
    try {
      const res = await api.post(`/forums/${forumType}/posts`, { content: content.trim() });
      setPosts((prev) => [res.data.post, ...prev]);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <p className="payments-empty">Loading {label.toLowerCase()}...</p>;
  }

  if (accessMessage) {
    return (
      <div className="forum-access-denied">
        <ShieldAlert size={32} aria-hidden="true" />
        <h2>{label}</h2>
        <p>{accessMessage}</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>{label}</h1>
          <p className="admin-dashboard__subtitle">
            {forumType === 'alumni'
              ? 'Connect with fellow KayTech Hub graduates — share stories, ask questions, help each other out.'
              : 'Connect with students currently taking a course with us — ask questions, share progress, help each other out.'}
          </p>
        </div>
      </div>

      <form className="forum-composer" onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something with the forum..."
          rows={3}
          maxLength={5000}
        />
        <button type="submit" className="btn btn--primary" disabled={posting || !content.trim()}>
          {posting ? 'Posting...' : 'Post'}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {posts.length === 0 ? (
        <div className="dashboard-empty-state admin-empty-state">
          <MessagesSquare size={32} className="admin-empty-state__icon" aria-hidden="true" />
          <strong>No posts yet</strong>
          <p>Be the first to start a conversation in the {label}.</p>
        </div>
      ) : (
        <div className="forum-feed">
          {posts.map((post) => (
            <ForumPostCard key={post._id} post={post} to={`${basePath}/forums/${forumType}/${post._id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
