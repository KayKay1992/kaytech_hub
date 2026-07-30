import Reveal from './Reveal';

// Consistent page-intro band used at the top of every non-Home page —
// badge + heading + optional description/actions. Deliberately just text
// on the normal page background (not a dark panel) so the Home hero stays
// the one big, unique visual moment.
export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <Reveal as="div" className="section page-header">
      {eyebrow && <span className="badge">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
    </Reveal>
  );
}
