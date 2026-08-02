import { CheckCircle2 } from 'lucide-react';
import Reveal from '../common/Reveal';

const DURATION_LABELS = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };

// Mirrors CourseCard/MentorshipCard's layout (image on top, content below),
// with a compact perks checklist standing in for course meta/description.
export default function PlanCard({ plan, index = 0, onReserve }) {
  return (
    <Reveal as="div" className="course-card" index={index}>
      <div className="course-card__image-wrap">
        {plan.image_url ? (
          <img src={plan.image_url} alt={plan.name} className="course-card__image" />
        ) : (
          <div className="course-card__image course-card__image--placeholder" />
        )}
        <span className="course-card__badge">{DURATION_LABELS[plan.duration] || plan.duration}</span>
      </div>

      <div className="course-card__body">
        <h3 className="course-card__title">{plan.name}</h3>

        {plan.perks.length > 0 && (
          <ul className="service-features-list service-features-list--compact">
            {plan.perks.map((perk, i) => (
              <li key={i}>
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="course-card__footer">
          <div className="course-card__price">
            <span className="course-card__price-label">{DURATION_LABELS[plan.duration] || plan.duration} Access</span>
            <span className="course-card__price-value">₦{Number(plan.price).toLocaleString()}</span>
          </div>
          <button type="button" className="btn btn--primary course-card__cta" onClick={() => onReserve(plan)}>
            Reserve <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </Reveal>
  );
}
