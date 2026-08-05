import { Star } from 'lucide-react';

// Read-only star display (rounds `value` to the nearest whole star) when no
// `onChange` is given; becomes a clickable 1-5 star input when it is. Used
// for course cards/detail pages (display) and the student review form
// (input) — one component so both look consistent.
export default function StarRating({ value = 0, onChange, size = 16, className = '' }) {
  const stars = [1, 2, 3, 4, 5];

  if (!onChange) {
    const rounded = Math.round(value);
    return (
      <span className={`star-rating ${className}`} aria-label={`${value} out of 5 stars`}>
        {stars.map((n) => (
          <Star key={n} size={size} fill={n <= rounded ? 'currentColor' : 'none'} aria-hidden="true" />
        ))}
      </span>
    );
  }

  return (
    <span className={`star-rating star-rating--input ${className}`} role="radiogroup" aria-label="Rating">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          className="star-rating__btn"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-pressed={n === value}
          onClick={() => onChange(n)}
        >
          <Star size={size} fill={n <= value ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      ))}
    </span>
  );
}
