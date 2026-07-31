// Derives a student-facing status from an assignment's due date and their
// own submission (if any) — there's no stored status field, it's computed.
export default function AssignmentStatusBadge({ assignment, submission }) {
  const isPastDue = new Date(assignment.due_date) < new Date();

  let status = 'neutral';
  let label = 'Not submitted';

  if (submission?.score !== null && submission?.score !== undefined) {
    status = 'approved';
    label = `Graded: ${submission.score}`;
  } else if (submission) {
    status = 'pending';
    label = 'Submitted — awaiting grade';
  } else if (isPastDue) {
    status = 'rejected';
    label = 'Missed';
  }

  return <span className={`academy-status academy-status--${status}`}>{label}</span>;
}
