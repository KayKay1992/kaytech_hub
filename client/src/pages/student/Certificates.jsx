import { useEffect, useState } from 'react';
import api from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';
import Reveal from '../../components/common/Reveal';

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/certificates')
      .then((res) => setCertificates(res.data.certificates))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your certificates'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader eyebrow="Student Area" title="Certificates" description="Certificates of completion issued for cohorts you've finished." />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading your certificates...</p>
        ) : certificates.length === 0 ? (
          <p>No certificates yet — these are issued by an admin once you've completed a cohort.</p>
        ) : (
          <div className="invite-table-wrap">
            <table className="invite-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Cohort</th>
                  <th>Issued</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert, i) => (
                  <Reveal as="tr" key={cert._id} index={i}>
                    <td>{cert.cohort_id?.course_id?.title || '—'}</td>
                    <td>{cert.cohort_id?.name || '—'}</td>
                    <td className="payments-date">{new Date(cert.issued_at).toLocaleDateString()}</td>
                    <td>
                      <a href={cert.certificate_url} target="_blank" rel="noreferrer" className="btn btn--primary">
                        Download
                      </a>
                    </td>
                  </Reveal>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
