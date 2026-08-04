import { Link } from 'react-router-dom';
import Reveal from './Reveal';

// Consistent page-intro band used at the top of every non-Home page —
// badge + heading + optional description/actions. Deliberately just text
// on the normal page background (not a dark panel) so the Home hero stays
// the one big, unique visual moment. `backTo`/`backLabel` are optional —
// same back-link style used on Course Registration/Detail, left-aligned
// against the otherwise-centered header.
export default function PageHeader({ eyebrow, title, description, children, backTo, backLabel }) {
  return (
    <Reveal as="div" className="section page-header">
      {backTo && (
        <div className="page-header__back">
          <Link to={backTo} className="btn btn--ghost">&larr; {backLabel || 'Back'}</Link>
        </div>
      )}
      {eyebrow && <span className="badge">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
    </Reveal>
  );
}
