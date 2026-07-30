// Selectable pill-button group for small multiple-choice fields (experience
// level, yes/no, etc.) inside a FormPanel dark form — replaces plain radio
// buttons/checkboxes with a fill-on-select pill, per the design system.
export default function PillSelect({ name, options, value, onChange }) {
  return (
    <div className="pill-options" role="radiogroup" aria-label={name}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`pill-option${value === opt.value ? ' is-selected' : ''}`}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
