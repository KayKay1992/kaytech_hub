import { useState } from 'react';
import SocialProofReveal from './SocialProofReveal';

const EXCERPT_LENGTH = 160;

const initialsOf = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

export default function SuccessStoryCard({ story, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = story.story.length > EXCERPT_LENGTH;
  const displayText = expanded || !isLong ? story.story : `${story.story.slice(0, EXCERPT_LENGTH).trimEnd()}...`;

  return (
    <SocialProofReveal className="story-card" index={index}>
      <span className="story-card__quote-mark" aria-hidden="true">&ldquo;</span>

      {story.photo_url ? (
        <img src={story.photo_url} alt="" className="story-card__avatar" />
      ) : (
        <div className="story-card__avatar-initials">{initialsOf(story.student_id?.name)}</div>
      )}

      <h3 className="story-card__headline">{story.headline}</h3>
      <p className={`story-card__excerpt${isLong && !expanded ? ' story-card__excerpt--clamped' : ''}`}>
        {displayText}
      </p>
      {isLong && (
        <button type="button" className="story-card__toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      <div className="story-card__byline">
        <span className="story-card__byline-name">{story.student_id?.name || 'KayTech Hub Student'}</span>
        {story.published_at && (
          <span className="story-card__byline-date">
            {new Date(story.published_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>
    </SocialProofReveal>
  );
}
