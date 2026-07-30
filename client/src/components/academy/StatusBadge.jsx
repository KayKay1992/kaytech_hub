const LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

// Shared Pending/Approved/Rejected pill for Modules and Lessons — used by
// both the admin and instructor Academy content views.
export default function StatusBadge({ status }) {
  return <span className={`academy-status academy-status--${status}`}>{LABELS[status] || status}</span>;
}
