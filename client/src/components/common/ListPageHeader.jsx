import { Link } from 'react-router-dom';
import Reveal from './Reveal';

// Shared header for every internal list/table page — Admin, Instructor, or
// Student. Title + subtitle on the left, a primary Signal Amber action
// button (and any extra controls passed as children) on the right.
// `action.to` renders a Link, `action.onClick` renders a button.
export default function ListPageHeader({ title, subtitle, action, children }) {
  return (
    <Reveal as="div" className="admin-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="admin-dashboard__subtitle">{subtitle}</p>}
      </div>

      {(action || children) && (
        <div className="admin-page-header__actions">
          {children}
          {action && (action.to ? (
            <Link to={action.to} className="btn btn--primary">
              {action.icon && <action.icon size={16} aria-hidden="true" />}
              {action.label}
            </Link>
          ) : (
            <button type="button" className="btn btn--primary" onClick={action.onClick} disabled={action.disabled}>
              {action.icon && <action.icon size={16} aria-hidden="true" />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </Reveal>
  );
}
