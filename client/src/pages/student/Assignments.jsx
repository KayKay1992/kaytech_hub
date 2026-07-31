import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Reveal from '../../components/common/Reveal';
import ProgressRing from '../../components/common/ProgressRing';
import AssignmentStatusBadge from '../../components/academy/AssignmentStatusBadge';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [files, setFiles] = useState({}); // assignmentId -> File
  const [submittingId, setSubmittingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/student/assignments');
      setAssignments(res.data.assignments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (assignmentId) => {
    const file = files[assignmentId];
    if (!file) {
      setError('Please choose a file to submit.');
      return;
    }
    setSubmittingId(assignmentId);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      await api.post(`/student/assignments/${assignmentId}/submit`, data);
      setFiles((prev) => ({ ...prev, [assignmentId]: null }));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <section className="section"><p>Loading assignments...</p></section>;

  const total = assignments.length;
  const submittedCount = assignments.filter((a) => a.submission).length;
  const gradedCount = assignments.filter((a) => a.submission?.score !== null && a.submission?.score !== undefined).length;
  const overdueCount = assignments.filter((a) => !a.submission && new Date(a.due_date) < new Date()).length;
  const submissionRate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

  return (
    <section className="section">
      <Reveal as="div" className="dashboard-hero">
        <div className="dashboard-hero__glow dashboard-hero__glow--one" aria-hidden="true" />
        <div className="dashboard-hero__glow dashboard-hero__glow--two" aria-hidden="true" />

        <div className="dashboard-hero__content">
          <span className="badge badge--on-dark">Student Area</span>
          <h1 className="dashboard-hero__title">Assignments</h1>
          <p className="dashboard-hero__subtitle">Submit your solutions and track scores and feedback.</p>

          <div className="dashboard-hero__pills">
            <span className="dashboard-hero__pill"><strong>{submittedCount}/{total}</strong>&nbsp;Submitted</span>
            <span className="dashboard-hero__pill"><strong>{gradedCount}</strong>&nbsp;Graded</span>
            {overdueCount > 0 && (
              <span className="dashboard-hero__pill"><strong>{overdueCount}</strong>&nbsp;Overdue</span>
            )}
          </div>
        </div>

        <div className="dashboard-hero__ring-wrap">
          <ProgressRing percent={submissionRate} />
          <span className="dashboard-hero__ring-caption">Submitted</span>
        </div>
      </Reveal>

      {error && <p className="form-error" style={{ marginTop: 28 }}>{error}</p>}

      {assignments.length === 0 ? (
        <Reveal as="div" className="course-section dashboard-empty-state" style={{ marginTop: 28 }}>
          <span className="dashboard-empty-state__icon" aria-hidden="true">📝</span>
          <p>No assignments yet — check back once your instructor posts one.</p>
        </Reveal>
      ) : (
        <div className="assignment-grid" style={{ marginTop: 28 }}>
          {assignments.map((a, i) => {
            const isGraded = a.submission?.score !== null && a.submission?.score !== undefined;
            const isOverdue = new Date(a.due_date) < new Date();
            const chosenFile = files[a._id];

            return (
              <Reveal as="div" className="assignment-card" key={a._id} index={i}>
                <div className="assignment-card__header">
                  <h3 className="assignment-card__title">{a.title}</h3>
                  <AssignmentStatusBadge assignment={a} submission={a.submission} />
                </div>
                <span className="assignment-card__lesson-tag">
                  {a.cohort_id?.course_id?.title}{a.cohort_id?.name ? ` · ${a.cohort_id.name}` : ''}
                </span>
                {a.description && <p className="assignment-card__description">{a.description}</p>}
                <span className={`assignment-card__due ${isOverdue && !a.submission ? 'assignment-card__due--overdue' : ''}`}>
                  Due {new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>

                {a.submission?.file_url && (
                  <a href={a.submission.file_url} target="_blank" rel="noreferrer" className="file-chip">
                    📄 View your submission
                  </a>
                )}
                {a.submission?.feedback && (
                  <p className="assignment-feedback">{a.submission.feedback}</p>
                )}

                {isGraded ? (
                  <p className="assignment-locked-note">✓ Graded — submission is locked.</p>
                ) : (
                  <div className="academy-grade-form">
                    <label className={`file-input-label ${chosenFile ? 'file-input-label--chosen' : ''}`} title={chosenFile?.name}>
                      {chosenFile ? `📎 ${chosenFile.name}` : '📎 Choose file'}
                      <input
                        type="file"
                        className="sr-only-file-input"
                        onChange={(e) => setFiles((prev) => ({ ...prev, [a._id]: e.target.files[0] || null }))}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={submittingId === a._id}
                      onClick={() => submit(a._id)}
                    >
                      {submittingId === a._id ? 'Submitting...' : a.submission ? 'Resubmit' : 'Submit'}
                    </button>
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}
