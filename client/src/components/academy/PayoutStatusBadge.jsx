const CONFIG = {
  unpaid: { className: 'pending', label: 'Unpaid' },
  paid: { className: 'approved', label: 'Paid' },
};

// Reuses the shared academy-status pill classes (amber=unpaid, teal=paid).
export default function PayoutStatusBadge({ status }) {
  const { className, label } = CONFIG[status] || { className: 'neutral', label: status };
  return <span className={`academy-status academy-status--${className}`}>{label}</span>;
}
