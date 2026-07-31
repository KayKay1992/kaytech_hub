import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

export default function StudentCourseContent() {
  const { cohortId } = useParams();
  const [cohort, setCohort] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/student/cohorts/${cohortId}/content`);
      setCohort(res.data.cohort);
      setModules(res.data.modules);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohortId]);

  const toggleComplete = async (lessonId) => {
    setBusyId(lessonId);
    setError('');
    try {
      const res = await api.post(`/student/cohorts/${cohortId}/lessons/${lessonId}/complete`);
      setModules((prev) => prev.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((l) => (l._id === lessonId ? { ...l, is_complete: res.data.is_complete } : l)),
      })));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update lesson progress');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;

  const allLessons = modules.flatMap((mod) => mod.lessons);
  const completedCount = allLessons.filter((l) => l.is_complete).length;
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>{cohort?.course_id?.title}</h1>
          <p className="admin-dashboard__subtitle">
            <Link to="/student/courses">&larr; My Courses</Link>
            {cohort && ` · ${cohort.name}${cohort.instructor_id?.name ? ` · Instructor: ${cohort.instructor_id.name}` : ''}`}
          </p>
        </div>
      </div>

      {allLessons.length > 0 && (
        <div style={{ marginBottom: 28, maxWidth: 420 }}>
          <div className="progress-label">
            <span>{completedCount}/{allLessons.length} lessons complete</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      {modules.length === 0 ? (
        <p>No lessons published for this course yet — check back soon.</p>
      ) : (
        modules.map((mod) => (
          <div className="academy-module" key={mod._id}>
            <div className="academy-module__header">
              <h3>{mod.title}</h3>
            </div>

            {mod.lessons.length === 0 ? (
              <p className="academy-lesson-list__empty">No lessons in this module yet.</p>
            ) : (
              <ul className="academy-lesson-list">
                {mod.lessons.map((lesson) => (
                  <li className="academy-lesson" key={lesson._id}>
                    <div className="academy-lesson__row">
                      <span>{lesson.title}</span>
                      <button
                        type="button"
                        className={`btn ${lesson.is_complete ? 'btn--ghost' : 'btn--primary'}`}
                        disabled={busyId === lesson._id}
                        onClick={() => toggleComplete(lesson._id)}
                      >
                        {lesson.is_complete ? 'Completed ✓' : 'Mark Complete'}
                      </button>
                    </div>

                    {lesson.notes_file_url && (
                      <p>
                        <a href={lesson.notes_file_url} target="_blank" rel="noreferrer" className="btn btn--ghost">
                          Download Notes (PDF)
                        </a>
                      </p>
                    )}

                    {lesson.resources?.length > 0 && (
                      <ul className="course-requirements-list">
                        {lesson.resources.map((r, i) => (
                          <li key={i}><a href={r.url} target="_blank" rel="noreferrer">{r.label}</a></li>
                        ))}
                      </ul>
                    )}

                    {lesson.coding_exercise && (
                      <div className="academy-rejection-note" style={{ color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>
                        {lesson.coding_exercise}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
}
