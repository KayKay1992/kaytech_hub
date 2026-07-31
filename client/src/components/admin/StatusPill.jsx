// Color-coded status pill shared across every admin table. Pages own their
// own status->tone mapping (vocab differs: draft/published vs pending/paid
// vs new/converted), this component just renders the chosen tone.
// Tones: amber (pending/in-progress), teal (active/approved/paid),
// slate (neutral/ended), danger (rejected/unpaid), navy-outline /
// slate-outline (role badges).
export default function StatusPill({ tone = 'slate', children }) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}
