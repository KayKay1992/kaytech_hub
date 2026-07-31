import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import AssignmentFormModal from '../../../components/academy/AssignmentFormModal';

export default function InstructorAssignments() {
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loadingCohorts, setLoadingCohorts] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [assignmentModal, setAssignmentModal] = useState(null); // 'new' | assignment object | null

  useEffect(() => {
    api.get('/instructor/cohorts')
      .then((res) => {
        setCohorts(res.data.cohorts);
        if (res.data.cohorts.length > 0) setSelectedCohortId(res.data.cohorts[0]._id);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your cohorts'))
      .finally(() => setLoadingCohorts(false));
  }, []);

  const loadAssignments = async (cohortId) => {
    setLoadingAssignments(true);
    setError('');
    try {
      const res = await api.get(`/instructor/cohorts/${cohortId}/assignments`);
      setAssignments(res.data.assignments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const loadLessons = async (cohortId) => {
    const cohort = cohorts.find((c) => c._id === cohortId);
    if (!cohort?.course_id?._id) {
      setLessons([]);
      return;
    }
    try {
      const res = await api.get(`/instructor/courses/${cohort.course_id._id}/content`);
      setLessons(res.data.modules.flatMap((m) => m.lessons));
    } catch {
      setLessons([]);
    }
  };

  useEffect(() => {
    if (!selectedCohortId) return;
    loadAssignments(selectedCohortId);
    loadLessons(selectedCohortId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCohortId]);

  const handleSubmit = async (data) => {
    if (assignmentModal === 'new') {
      await api.post('/instructor/assignments', { cohort_id: selectedCohortId, ...data });
    } else {
      await api.patch(`/instructor/assignments/${assignmentModal._id}`, data);
    }
    setAssignmentModal(null);
    await loadAssignments(selectedCohortId);
  };

  const deleteAssignment = async (assignmentId) => {
    setBusyId(assignmentId);
    setError('');
    try {
      await api.delete(`/instructor/assignments/${assignmentId}`);
      await loadAssignments(selectedCohortId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete assignment');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  if (loadingCohorts) return <div className="admin-dashboard"><p>Loading...</p></div>;

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Assignments</h1>
            <p className="admin-dashboard__subtitle">Create assignments and grade submissions for your cohorts.</p>
          </div>
          {selectedCohortId && (
            <button type="button" className="btn btn--primary" onClick={() => setAssignmentModal('new')}>+ New Assignment</button>
          )}
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      {cohorts.length === 0 ? (
        <p>You're not assigned to any cohorts yet. An admin needs to assign you to a course cohort first.</p>
      ) : (
        <>
          <div className="assignment-cohort-picker">
            {cohorts.map((c) => (
              <button
                key={c._id}
                type="button"
                className={selectedCohortId === c._id ? 'is-active' : ''}
                onClick={() => setSelectedCohortId(c._id)}
              >
                {c.course_id?.title} · {c.name}
              </button>
            ))}
          </div>

          {loadingAssignments ? (
            <p>Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="academy-lesson-list__empty">No assignments for this cohort yet — create the first one.</p>
          ) : (
            <div className="assignment-grid">
              {assignments.map((a, i) => {
                const isOverdue = new Date(a.due_date) < new Date();
                return (
                  <Reveal as="div" className="assignment-card" key={a._id} index={i}>
                    <div className="assignment-card__header">
                      <h3 className="assignment-card__title">{a.title}</h3>
                    </div>
                    {a.lesson_id?.title && (
                      <span className="assignment-card__lesson-tag">Lesson · {a.lesson_id.title}</span>
                    )}
                    {a.description && <p className="assignment-card__description">{a.description}</p>}
                    <span className={`assignment-card__due ${isOverdue ? 'assignment-card__due--overdue' : ''}`}>
                      Due {new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    <div className="assignment-card__footer">
                      <Link to={`/instructor/academy/assignments/${a._id}/submissions`} className="btn btn--primary">Grade Submissions</Link>
                      <button type="button" className="btn btn--ghost" onClick={() => setAssignmentModal(a)}>Edit</button>
                      {confirmingId === a._id ? (
                        <span className="confirm-delete">
                          <span>Delete this assignment?</span>
                          <button type="button" className="btn btn--danger" disabled={busyId === a._id} onClick={() => deleteAssignment(a._id)}>
                            {busyId === a._id ? '...' : 'Confirm'}
                          </button>
                          <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(a._id)}>Delete</button>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </>
      )}

      {assignmentModal && (
        <AssignmentFormModal
          initial={assignmentModal === 'new' ? null : assignmentModal}
          lessons={lessons}
          onClose={() => setAssignmentModal(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
