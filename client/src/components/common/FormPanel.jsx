// Dark Ink Navy panel (same circuit-grid texture language as the Home hero)
// that every "premium" application/registration form renders inside —
// Course Registration, Scholarship, Service Request, Mentorship, Workspace
// Reservation, Job Application, Contact. Page heading/intro stays outside,
// on the normal Cloud background; only the form itself lives in here.
export default function FormPanel({ children, className = '' }) {
  return (
    <div className={`form-panel ${className}`.trim()}>
      {children}
    </div>
  );
}
