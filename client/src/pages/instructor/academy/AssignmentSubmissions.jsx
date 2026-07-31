import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';

const initialsOf = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

export default function InstructorAssignmentSubmissions() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({}); // submissionId -> { score, feedback }
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const savedTimeoutRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/instructor/assignments/${assignmentId}/submissions`);
      setAssignment(res.data.assignment);
      setSubmissions(res.data.submissions);
      const initialDrafts = {};
      res.data.submissions.forEach((s) => {
        initialDrafts[s._id] = { score: s.score ?? '', feedback: s.feedback || '' };
      });
      setDrafts(initialDrafts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  useEffect(() => () => clearTimeout(savedTimeoutRef.current), []);

  const updateDraft = (submissionId, field, value) => {
    setDrafts((prev) => ({ ...prev, [submissionId]: { ...prev[submissionId], [field]: value } }));
  };

  const saveGrade = async (submissionId) => {
    setSavingId(submissionId);
    setSavedId(null);
    setError('');
    try {
      const draft = drafts[submissionId];
      const res = await api.patch(`/instructor/submissions/${submissionId}/grade`, {
        score: draft.score,
        feedback: draft.feedback,
      });
      setSubmissions((prev) => prev.map((s) => (s._id === submissionId ? res.data.submission : s)));
      setSavedId(submissionId);
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSavedId(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save grade');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Submissions: {assignment?.title}</h1>
            <p className="admin-dashboard__subtitle">
              <Link to="/instructor/academy/assignments">&larr; Back to Assignments</Link>
            </p>
          </div>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      {submissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        submissions.map((s, i) => {
          const draft = drafts[s._id] || { score: '', feedback: '' };
          const isGraded = s.score !== null && s.score !== undefined;
          return (
            <Reveal as="div" className={`submission-card ${isGraded ? 'submission-card--graded' : ''}`} key={s._id} index={i}>
              <div className="submission-card__header">
                <div className="submission-card__avatar">{initialsOf(s.student_id?.name)}</div>
                <div className="submission-card__student">
                  <strong>{s.student_id?.name || '—'}</strong>
                  <span>{s.student_id?.email}</span>
                </div>
                {isGraded && <span className="academy-status academy-status--approved">Graded: {s.score}</span>}
                <a href={s.file_url} target="_blank" rel="noreferrer" className="btn btn--ghost">View Submission</a>
              </div>
              <p className="academy-assignment-meta">Submitted {new Date(s.submitted_at).toLocaleString()}</p>

              <div className="academy-grade-form">
                <label>
                  Score
                  <input
                    type="number"
                    min="0"
                    value={draft.score}
                    onChange={(e) => updateDraft(s._id, 'score', e.target.value)}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  Feedback
                  <textarea
                    rows={2}
                    value={draft.feedback}
                    onChange={(e) => updateDraft(s._id, 'feedback', e.target.value)}
                  />
                </label>
                <button type="button" className="btn btn--primary" disabled={savingId === s._id} onClick={() => saveGrade(s._id)}>
                  {savingId === s._id ? 'Saving...' : isGraded ? 'Update Grade' : 'Save Grade'}
                </button>
              </div>

              {savedId === s._id && (
                <p className="form-success" style={{ marginTop: 12 }}>
                  ✓ Grade saved — {s.student_id?.name || 'the student'} can now see their score and feedback.
                </p>
              )}
            </Reveal>
          );
        })
      )}
    </div>
  );
}
