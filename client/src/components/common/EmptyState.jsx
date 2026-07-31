// Shared empty state for any dashboard list — centered icon + short message
// instead of a blank page. `action` is optional ({ label, onClick }).
export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="dashboard-empty-state admin-empty-state">
      {Icon && <Icon size={32} className="admin-empty-state__icon" aria-hidden="true" />}
      {title && <strong>{title}</strong>}
      {message && <p>{message}</p>}
      {action && (
        <button type="button" className="btn btn--ghost" onClick={action.onClick}>{action.label}</button>
      )}
    </div>
  );
}
