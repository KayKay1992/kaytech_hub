import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Reveal from '../../components/common/Reveal';
import ProgressRing from '../../components/common/ProgressRing';

export default function StudentCourseContent() {
  const { cohortId } = useParams();
  const [cohort, setCohort] = useState(null);
  const [modules, setModules] = useState([]);
  const [attendance, setAttendance] = useState([]);
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

  const loadAttendance = async () => {
    try {
      const res = await api.get(`/student/cohorts/${cohortId}/attendance`);
      setAttendance(res.data.records);
    } catch {
      setAttendance([]);
    }
  };

  useEffect(() => {
    load();
    loadAttendance();
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

  if (loading) return <section className="section"><p>Loading...</p></section>;

  const allLessons = modules.flatMap((mod) => mod.lessons);
  const completedCount = allLessons.filter((l) => l.is_complete).length;
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  const presentCount = attendance.filter((r) => r.status === 'present').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null;

  const instructor = cohort?.instructor_id;

  return (
    <section className="section">
      <p className="course-detail__back"><Link to="/student/courses">&larr; My Courses</Link></p>

      <Reveal as="div" className="dashboard-hero">
        <div className="dashboard-hero__glow dashboard-hero__glow--one" aria-hidden="true" />
        <div className="dashboard-hero__glow dashboard-hero__glow--two" aria-hidden="true" />

        <div className="dashboard-hero__content">
          {cohort?.name && <span className="badge badge--on-dark">{cohort.name}</span>}
          <h1 className="dashboard-hero__title">{cohort?.course_id?.title}</h1>
          <p className="dashboard-hero__subtitle">
            {instructor?.name ? `Instructor: ${instructor.name}` : 'Instructor to be confirmed'}
          </p>

          <div className="dashboard-hero__pills">
            <span className="dashboard-hero__pill"><strong>{completedCount}/{allLessons.length}</strong>&nbsp;Lessons Complete</span>
            {attendanceRate !== null && (
              <span className="dashboard-hero__pill"><strong>{attendanceRate}%</strong>&nbsp;Attendance</span>
            )}
          </div>
        </div>

        <div className="dashboard-hero__ring-wrap">
          <ProgressRing percent={progressPercent} />
          <span className="dashboard-hero__ring-caption">Course Progress</span>
        </div>
      </Reveal>

      {error && <p className="form-error" style={{ marginTop: 28 }}>{error}</p>}

      <div className="course-layout">
        <div className="course-layout__main">
          {modules.length === 0 ? (
            <Reveal as="div" className="course-section dashboard-empty-state">
              <span className="dashboard-empty-state__icon" aria-hidden="true">📚</span>
              <p>No lessons published for this course yet — check back soon.</p>
            </Reveal>
          ) : (
            modules.map((mod, mi) => (
              <Reveal as="div" className="course-section" key={mod._id} index={mi}>
                <h2>{mod.title}</h2>

                {mod.lessons.length === 0 ? (
                  <p className="academy-lesson-list__empty">No lessons in this module yet.</p>
                ) : (
                  <ul className="lesson-list">
                    {mod.lessons.map((lesson) => (
                      <li className={`lesson-item ${lesson.is_complete ? 'lesson-item--done' : ''}`} key={lesson._id}>
                        <span className="lesson-item__marker" aria-hidden="true">{lesson.is_complete ? '✓' : ''}</span>
                        <div className="lesson-item__body">
                          <div className="lesson-item__header">
                            <h4>{lesson.title}</h4>
                            <button
                              type="button"
                              className={`btn ${lesson.is_complete ? 'btn--ghost' : 'btn--primary'}`}
                              disabled={busyId === lesson._id}
                              onClick={() => toggleComplete(lesson._id)}
                            >
                              {lesson.is_complete ? 'Completed ✓' : 'Mark Complete'}
                            </button>
                          </div>

                          {(lesson.notes_file_url || lesson.resources?.length > 0) && (
                            <div className="lesson-item__files">
                              {lesson.notes_file_url && (
                                <a href={lesson.notes_file_url} target="_blank" rel="noreferrer" className="btn btn--ghost">
                                  Download Notes (PDF)
                                </a>
                              )}
                              {lesson.resources?.map((r, i) => (
                                <a href={r.url} target="_blank" rel="noreferrer" className="file-chip" title={r.label} key={i}>
                                  📄 {r.label}
                                </a>
                              ))}
                            </div>
                          )}

                          {lesson.coding_exercise && (
                            <pre className="lesson-exercise">{lesson.coding_exercise}</pre>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Reveal>
            ))
          )}
        </div>

        <div className="course-layout__aside">
          <Reveal as="div" className="course-section" delay={0.1}>
            <h2>Attendance History</h2>
            {attendance.length === 0 ? (
              <p>No attendance recorded yet.</p>
            ) : (
              <>
                <span className="mini-stat">{presentCount}/{attendance.length} sessions present · {attendanceRate}%</span>
                <ul className="attendance-mini-list">
                  {attendance.map((r) => (
                    <li key={r._id}>
                      <span>{new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className={`academy-status academy-status--${r.status === 'present' ? 'approved' : 'rejected'}`}>
                        {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
