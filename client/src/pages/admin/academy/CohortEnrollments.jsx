import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import Modal from '../../../components/common/Modal';

const ENROLLMENT_STATUSES = ['active', 'completed', 'dropped'];
const PAYMENT_OPTIONS = ['pending', 'paid'];

export default function CohortEnrollments() {
  const { id } = useParams();
  const [cohort, setCohort] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [enrolling, setEnrolling] = useState(false);
  const [pickedStudentId, setPickedStudentId] = useState('');
  const [pickedPaymentStatus, setPickedPaymentStatus] = useState('pending');
  const [enrollError, setEnrollError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [cohortRes, enrollmentsRes, studentsRes] = await Promise.all([
        api.get(`/admin/academy/cohorts/${id}`),
        api.get('/admin/academy/enrollments', { params: { cohort_id: id } }),
        api.get('/users', { params: { role: 'student' } }),
      ]);
      setCohort(cohortRes.data.cohort);
      setEnrollments(enrollmentsRes.data.enrollments);
      setStudents(studentsRes.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateField = async (enrollmentId, field, value) => {
    setBusyId(enrollmentId);
    setError('');
    try {
      await api.patch(`/admin/academy/enrollments/${enrollmentId}`, { [field]: value });
      setEnrollments((prev) => prev.map((e) => (e._id === enrollmentId ? { ...e, [field]: value } : e)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update enrollment');
    } finally {
      setBusyId(null);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrollError('');
    if (!pickedStudentId) {
      setEnrollError('Please select a student.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/academy/enrollments', {
        student_id: pickedStudentId,
        cohort_id: id,
        payment_status: pickedPaymentStatus,
      });
      setEnrolling(false);
      setPickedStudentId('');
      setPickedPaymentStatus('pending');
      await load();
    } catch (err) {
      setEnrollError(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setSaving(false);
    }
  };

  const enrolledStudentIds = new Set(enrollments.map((e) => e.student_id?._id));
  const availableStudents = students.filter((s) => !enrolledStudentIds.has(s._id));

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Enrollments{cohort ? `: ${cohort.name}` : ''}</h1>
            <p className="admin-dashboard__subtitle">
              <Link to="/admin/academy/cohorts">&larr; Back to Cohorts</Link>
            </p>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => setEnrolling(true)}>Enroll Student</button>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading enrollments...</p>
        ) : enrollments.length === 0 ? (
          <p>No students enrolled in this cohort yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enr) => {
                const isBusy = busyId === enr._id;
                return (
                  <tr key={enr._id}>
                    <td>{enr.student_id?.name || '—'}<br />{enr.student_id?.email}</td>
                    <td>
                      <select value={enr.status} disabled={isBusy} onChange={(e) => updateField(enr._id, 'status', e.target.value)}>
                        {ENROLLMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={enr.payment_status} disabled={isBusy} onChange={(e) => updateField(enr._id, 'payment_status', e.target.value)}>
                        {PAYMENT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td>{new Date(enr.enrolled_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {enrolling && (
        <Modal title="Enroll Student" onClose={() => setEnrolling(false)}>
          <form className="auth-form" onSubmit={handleEnroll}>
            {enrollError && <p className="form-error">{enrollError}</p>}

            <label>
              Student
              <select value={pickedStudentId} onChange={(e) => setPickedStudentId(e.target.value)} required>
                <option value="">Select a student...</option>
                {availableStudents.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </label>

            <label>
              Payment status
              <select value={pickedPaymentStatus} onChange={(e) => setPickedPaymentStatus(e.target.value)}>
                {PAYMENT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
              {saving ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
