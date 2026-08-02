import SocialProofReveal from './SocialProofReveal';

const initialsOf = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

export default function TestimonialCard({ testimonial, index = 0 }) {
  return (
    <SocialProofReveal className="testimonial-card" index={index}>
      <span className="testimonial-card__quote-mark" aria-hidden="true">&rdquo;</span>

      {testimonial.photo_url ? (
        <img src={testimonial.photo_url} alt="" className="testimonial-card__avatar" />
      ) : (
        <div className="testimonial-card__avatar-initials">{initialsOf(testimonial.name)}</div>
      )}

      {testimonial.rating && (
        <span className="testimonial-card__rating" aria-label={`${testimonial.rating} out of 5 stars`}>
          {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
        </span>
      )}

      <p className="testimonial-card__message">&ldquo;{testimonial.message}&rdquo;</p>

      <div className="testimonial-card__byline">
        <span className="testimonial-card__byline-name">
          {testimonial.name}{testimonial.role_or_organization ? `, ${testimonial.role_or_organization}` : ''}
        </span>
        {testimonial.published_at && (
          <span className="testimonial-card__byline-date">
            {new Date(testimonial.published_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>
    </SocialProofReveal>
  );
}
