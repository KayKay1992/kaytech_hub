// Suspense fallback for lazy-loaded routes/chunks. `fullScreen` is for the
// outermost boundary (before any layout has mounted — first visit, or
// switching between Public/Student/Instructor/Admin for the first time);
// the default (unset) sizing is for the nested Suspense inside each
// layout's content area, where the sidebar/topbar or header/footer stay
// mounted and only the page content shows this.
export default function PageLoader({ fullScreen = false }) {
  return (
    <div className={`page-loader${fullScreen ? ' page-loader--full' : ''}`} role="status" aria-live="polite">
      <span className="page-loader__mark">
        <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
          <g stroke="#FFB020" strokeWidth="9" strokeLinecap="square" fill="none">
            <line x1="22" y1="16" x2="22" y2="48" />
            <line x1="22" y1="32" x2="46" y2="14" />
            <line x1="22" y1="32" x2="46" y2="50" />
          </g>
        </svg>
      </span>
      <span className="page-loader__label">Loading</span>
    </div>
  );
}
