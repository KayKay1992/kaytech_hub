import { useEffect, useState } from 'react';
import api from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';
import Reveal from '../../components/common/Reveal';
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

  return (
    <>
      <PageHeader eyebrow="Student Area" title="Assignments" description="Submit your solutions and track scores and feedback." />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p>No assignments yet — check back once your instructor posts one.</p>
        ) : (
          <div className="assignment-grid">
            {assignments.map((a, i) => {
              const isGraded = a.submission?.score !== null && a.submission?.score !== undefined;
              const isOverdue = new Date(a.due_date) < new Date();

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
                    <p className="academy-assignment-meta">
                      <a href={a.submission.file_url} target="_blank" rel="noreferrer">View your submission</a>
                    </p>
                  )}
                  {a.submission?.feedback && (
                    <p className="assignment-feedback">{a.submission.feedback}</p>
                  )}

                  {isGraded ? (
                    <p className="assignment-locked-note">✓ Graded — submission is locked.</p>
                  ) : (
                    <div className="academy-grade-form">
                      <input
                        type="file"
                        onChange={(e) => setFiles((prev) => ({ ...prev, [a._id]: e.target.files[0] || null }))}
                      />
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
    </>
  );
}
