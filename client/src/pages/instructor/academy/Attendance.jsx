import { useEffect, useState } from 'react';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function InstructorAttendance() {
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [roster, setRoster] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingCohorts, setLoadingCohorts] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/instructor/cohorts')
      .then((res) => {
        setCohorts(res.data.cohorts);
        if (res.data.cohorts.length > 0) setSelectedCohortId(res.data.cohorts[0]._id);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your cohorts'))
      .finally(() => setLoadingCohorts(false));
  }, []);

  const loadHistory = async (cohortId) => {
    try {
      const res = await api.get(`/instructor/cohorts/${cohortId}/attendance/history`);
      setHistory(res.data.sessions);
    } catch {
      setHistory([]);
    }
  };

  const loadRoster = async (cohortId, forDate) => {
    setLoadingRoster(true);
    setError('');
    setSaved(false);
    try {
      const res = await api.get(`/instructor/cohorts/${cohortId}/attendance/roster`, { params: { date: forDate } });
      setRoster(res.data.roster);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance roster');
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (!selectedCohortId) return;
    loadHistory(selectedCohortId);
    loadRoster(selectedCohortId, date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCohortId]);

  useEffect(() => {
    if (!selectedCohortId || !date) return;
    loadRoster(selectedCohortId, date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const setStatus = (studentId, status) => {
    setSaved(false);
    setRoster((prev) => prev.map((r) => (r.student_id === studentId ? { ...r, status } : r)));
  };

  const markAll = (status) => {
    setSaved(false);
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const records = roster.filter((r) => r.status).map((r) => ({ student_id: r.student_id, status: r.status }));
      await api.post(`/instructor/cohorts/${selectedCohortId}/attendance`, { date, records });
      setSaved(true);
      await loadHistory(selectedCohortId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loadingCohorts) return <div className="admin-dashboard"><p>Loading...</p></div>;

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Attendance</h1>
            <p className="admin-dashboard__subtitle">Mark attendance after every physical class session.</p>
          </div>
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

          <div className="attendance-toolbar">
            <label>
              Class date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <button type="button" className="btn btn--ghost" onClick={() => markAll('present')}>Mark all present</button>
            <button type="button" className="btn btn--ghost" onClick={() => markAll('absent')}>Mark all absent</button>
            <button type="button" className="btn btn--primary" disabled={saving || loadingRoster} onClick={save}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>

          {saved && <p className="form-success" style={{ marginBottom: 20 }}>✓ Attendance saved for {new Date(date).toLocaleDateString()}.</p>}

          {loadingRoster ? (
            <p>Loading roster...</p>
          ) : roster.length === 0 ? (
            <p className="academy-lesson-list__empty">No students enrolled in this cohort yet.</p>
          ) : (
            <div className="attendance-roster">
              {roster.map((r) => (
                <div className="attendance-row" key={r.student_id}>
                  <div className="attendance-row__student">
                    <strong>{r.name}</strong>
                    <span>{r.email}</span>
                  </div>
                  <div className="attendance-toggle">
                    <button
                      type="button"
                      className={r.status === 'present' ? 'is-active--present' : ''}
                      onClick={() => setStatus(r.student_id, 'present')}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      className={r.status === 'absent' ? 'is-active--absent' : ''}
                      onClick={() => setStatus(r.student_id, 'absent')}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3>Session History</h3>
          <div className="invite-table-wrap">
            {history.length === 0 ? (
              <p style={{ padding: 18 }}>No sessions recorded yet.</p>
            ) : (
              <table className="invite-table attendance-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="is-numeric">Present</th>
                    <th className="is-numeric">Absent</th>
                    <th className="is-numeric">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((s) => (
                    <tr key={s.date} className="attendance-history-row" onClick={() => setDate(s.date)}>
                      <td>{new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="is-numeric">{s.present_count}</td>
                      <td className="is-numeric">{s.absent_count}</td>
                      <td className="is-numeric">{s.present_count + s.absent_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
