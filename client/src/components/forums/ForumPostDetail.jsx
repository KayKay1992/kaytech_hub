import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import ForumPostCard from './ForumPostCard';

const FORUM_LABELS = { student: 'Student Forum', alumni: 'Alumni Forum' };

export default function ForumPostDetail({ basePath }) {
  const { forumType, postId } = useParams();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const label = FORUM_LABELS[forumType] || 'Forum';

  const load = async () => {
    setLoading(true);
    setAccessMessage('');
    setNotFound(false);
    try {
      const res = await api.get(`/forums/${forumType}/posts/${postId}`);
      setPost(res.data.post);
      setReplies(res.data.replies);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessMessage(err.response.data.message || "You don't have access to this forum.");
      } else if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(err.response?.data?.message || 'Failed to load post');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [forumType, postId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReply = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    setError('');
    try {
      const res = await api.post(`/forums/${forumType}/posts/${postId}/replies`, { content: content.trim() });
      setReplies((prev) => [...prev, res.data.reply]);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <p className="payments-empty">Loading...</p>;
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

  if (notFound || !post) {
    return (
      <div className="forum-access-denied">
        <h2>Post not found</h2>
        <p>This post may have been removed.</p>
        <Link to={`${basePath}/forums/${forumType}`} className="btn btn--ghost">Back to {label}</Link>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Link to={`${basePath}/forums/${forumType}`} className="forum-back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to {label}
      </Link>

      <ForumPostCard post={post} expandable={false} />

      {error && <p className="form-error">{error}</p>}

      <div className="forum-replies">
        {replies.map((reply) => (
          <ForumPostCard key={reply._id} post={reply} expandable={false} />
        ))}
      </div>

      <form className="forum-composer" onSubmit={handleReply}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a reply..."
          rows={2}
          maxLength={5000}
        />
        <button type="submit" className="btn btn--primary" disabled={posting || !content.trim()}>
          {posting ? 'Replying...' : 'Reply'}
        </button>
      </form>
    </div>
  );
}
