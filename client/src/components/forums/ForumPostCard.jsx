import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Avatar from '../common/Avatar';
import StatusPill from '../admin/StatusPill';

const EXCERPT_LENGTH = 280;
const ROLE_TONE = { admin: 'amber', instructor: 'teal' };

// Shared card for a forum post — used both in the feed (linked, excerpted)
// and full-bleed at the top of the post detail page (no link, no excerpt).
export default function ForumPostCard({ post, to, expandable = true }) {
  const [expanded, setExpanded] = useState(false);
  const author = post.author_id || {};
  const isLong = expandable && post.content.length > EXCERPT_LENGTH;
  const displayText = expanded || !isLong ? post.content : `${post.content.slice(0, EXCERPT_LENGTH).trimEnd()}...`;

  const body = (
    <div className="forum-post-card">
      <div className="forum-post-card__header">
        {author.photo_url ? (
          <img src={author.photo_url} alt="" className="forum-post-card__avatar" />
        ) : (
          <Avatar name={author.name} />
        )}
        <div className="forum-post-card__byline">
          <span className="forum-post-card__name">
            {author.name || 'Unknown'}
            {ROLE_TONE[author.role] && (
              <StatusPill tone={ROLE_TONE[author.role]}>{author.role}</StatusPill>
            )}
          </span>
          <span className="forum-post-card__date">{new Date(post.created_at).toLocaleString()}</span>
        </div>
      </div>

      <p className="forum-post-card__content">{displayText}</p>
      {isLong && (
        <button
          type="button"
          className="forum-post-card__toggle"
          onClick={(e) => { e.preventDefault(); setExpanded((v) => !v); }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {typeof post.reply_count === 'number' && (
        <span className="forum-post-card__replies">
          <MessageCircle size={14} aria-hidden="true" />
          {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
        </span>
      )}
    </div>
  );

  return to ? <Link to={to} className="forum-post-card__link">{body}</Link> : body;
}
