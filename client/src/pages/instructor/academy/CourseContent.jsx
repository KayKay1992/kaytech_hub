import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import StatusBadge from '../../../components/academy/StatusBadge';
import ModuleFormModal from '../../../components/academy/ModuleFormModal';
import LessonFormModal from '../../../components/academy/LessonFormModal';

export default function InstructorCourseContent() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const [moduleModal, setModuleModal] = useState(null); // 'new' | module object | null
  const [lessonModal, setLessonModal] = useState(null); // { moduleId, lesson? } | null

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/instructor/courses/${courseId}/content`);
      setCourse(res.data.course);
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
  }, [courseId]);

  const handleModuleSubmit = async (data) => {
    if (moduleModal === 'new') {
      await api.post('/instructor/modules', { course_id: courseId, ...data });
    } else {
      await api.patch(`/instructor/modules/${moduleModal._id}`, data);
    }
    setModuleModal(null);
    await load();
  };

  const handleLessonSubmit = async (formData) => {
    if (lessonModal.lesson) {
      await api.patch(`/instructor/lessons/${lessonModal.lesson._id}`, formData);
    } else {
      formData.append('module_id', lessonModal.moduleId);
      await api.post('/instructor/lessons', formData);
    }
    setLessonModal(null);
    await load();
  };

  const deleteModule = async (moduleId) => {
    setBusyId(moduleId);
    setError('');
    try {
      await api.delete(`/instructor/modules/${moduleId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete module');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  const deleteLesson = async (lessonId) => {
    setBusyId(lessonId);
    setError('');
    try {
      await api.delete(`/instructor/lessons/${lessonId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lesson');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>{course?.title}</h1>
          <p className="admin-dashboard__subtitle">
            <Link to="/instructor/academy/courses">&larr; My Courses</Link>
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setModuleModal('new')}>New Module</button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {modules.length === 0 ? (
        <p>No modules yet — create the first one.</p>
      ) : (
        modules.map((mod) => (
          <div className="academy-module" key={mod._id}>
            <div className="academy-module__header">
              <h3>{mod.title}</h3>
              <StatusBadge status={mod.status} />
              <span className="admin-table__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setModuleModal(mod)}>Edit</button>
                {confirmingId === mod._id ? (
                  <span className="confirm-delete">
                    <span>Delete this module and all its lessons?</span>
                    <button type="button" className="btn btn--danger" disabled={busyId === mod._id} onClick={() => deleteModule(mod._id)}>
                      {busyId === mod._id ? '...' : 'Confirm'}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(null)}>Cancel</button>
                  </span>
                ) : (
                  <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(mod._id)}>Delete</button>
                )}
                <button type="button" className="btn btn--ghost" onClick={() => setLessonModal({ moduleId: mod._id, lesson: null })}>+ Lesson</button>
              </span>
            </div>
            {mod.rejection_reason && <p className="academy-rejection-note">Rejection note: {mod.rejection_reason}</p>}

            {mod.lessons.length === 0 ? (
              <p className="academy-lesson-list__empty">No lessons in this module yet.</p>
            ) : (
              <ul className="academy-lesson-list">
                {mod.lessons.map((lesson) => (
                  <li className="academy-lesson" key={lesson._id}>
                    <div className="academy-lesson__row">
                      <span>{lesson.title}</span>
                      <StatusBadge status={lesson.status} />
                      <span className="admin-table__actions">
                        <button type="button" className="btn btn--ghost" onClick={() => setLessonModal({ moduleId: mod._id, lesson })}>Edit</button>
                        {confirmingId === lesson._id ? (
                          <span className="confirm-delete">
                            <span>Delete?</span>
                            <button type="button" className="btn btn--danger" disabled={busyId === lesson._id} onClick={() => deleteLesson(lesson._id)}>
                              {busyId === lesson._id ? '...' : 'Confirm'}
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(null)}>Cancel</button>
                          </span>
                        ) : (
                          <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(lesson._id)}>Delete</button>
                        )}
                      </span>
                    </div>
                    {lesson.rejection_reason && <p className="academy-rejection-note">Rejection note: {lesson.rejection_reason}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}

      {moduleModal && (
        <ModuleFormModal
          initial={moduleModal === 'new' ? null : moduleModal}
          onClose={() => setModuleModal(null)}
          onSubmit={handleModuleSubmit}
        />
      )}

      {lessonModal && (
        <LessonFormModal
          initial={lessonModal.lesson}
          onClose={() => setLessonModal(null)}
          onSubmit={handleLessonSubmit}
        />
      )}
    </div>
  );
}
