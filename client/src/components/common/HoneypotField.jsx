// Spam-trap field for public, unauthenticated forms. Genuinely invisible to
// real users (off-screen, zero-size, hidden from assistive tech, excluded
// from tab order) but present in the DOM, so bots that auto-fill every
// input still fill it. Wire its value into the same form state as every
// other field — the backend's checkHoneypot middleware silently discards
// any submission where it's non-empty.
export default function HoneypotField({ name = 'website', value, onChange }) {
  return (
    <div className="honeypot-field" aria-hidden="true">
      <label htmlFor={`hp-${name}`}>Leave this field blank</label>
      <input
        type="text"
        id={`hp-${name}`}
        name={name}
        value={value}
        onChange={onChange}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
