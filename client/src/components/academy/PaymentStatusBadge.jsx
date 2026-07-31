const CONFIG = {
  pending: { className: 'pending', label: 'Pending' },
  partial: { className: 'partial', label: 'Part Payment' },
  paid: { className: 'approved', label: 'Completed Payment' },
};

// Reuses the shared academy-status pill classes (amber=pending, teal=paid).
export default function PaymentStatusBadge({ status }) {
  const { className, label } = CONFIG[status] || { className: 'neutral', label: status };
  return <span className={`academy-status academy-status--${className}`}>{label}</span>;
}
