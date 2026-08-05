import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';
import Reveal from '../../components/common/Reveal';
import StatusPill from '../../components/admin/StatusPill';

const REVIEW_STATUS_TONE = { pending: 'amber', approved: 'teal', rejected: 'danger' };
const REVIEW_STATUS_LABEL = { pending: 'Pending Review', approved: 'Published', rejected: 'Not Published' };

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [reviewsByCourse, setReviewsByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/student/certificates'),
      api.get('/student/course-reviews').catch(() => ({ data: { reviews: [] } })),
    ])
      .then(([certRes, reviewsRes]) => {
        setCertificates(certRes.data.certificates);
        const map = {};
        reviewsRes.data.reviews.forEach((r) => {
          if (r.course_id?._id) map[r.course_id._id] = r;
        });
        setReviewsByCourse(map);
      })
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
          <>
            <div className="invite-table-wrap">
              <table className="invite-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Cohort</th>
                    <th>Issued</th>
                    <th>Your Review</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert, i) => {
                    const courseId = cert.cohort_id?.course_id?._id;
                    const review = courseId ? reviewsByCourse[courseId] : null;
                    return (
                      <Reveal as="tr" key={cert._id} index={i}>
                        <td>{cert.cohort_id?.course_id?.title || '—'}</td>
                        <td>{cert.cohort_id?.name || '—'}</td>
                        <td className="payments-date">{new Date(cert.issued_at).toLocaleDateString()}</td>
                        <td>
                          {review ? (
                            <StatusPill tone={REVIEW_STATUS_TONE[review.status]}>{REVIEW_STATUS_LABEL[review.status]}</StatusPill>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="admin-table__actions">
                          <a href={cert.certificate_url} target="_blank" rel="noreferrer" className="btn btn--primary">
                            Download
                          </a>
                          {courseId && (
                            <Link to={`/student/reviews/new?course=${courseId}`} className="btn btn--ghost">
                              {review ? 'Edit Review' : 'Write a Review'}
                            </Link>
                          )}
                        </td>
                      </Reveal>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Reveal as="div" className="course-section" style={{ marginTop: 28 }}>
              <h3>Share Your Success Story</h3>
              <p>Completed a cohort? Tell us about the outcome — approved stories may be featured on our Home page.</p>
              <Link to="/student/success-story" className="btn btn--primary">Share Your Success Story</Link>
            </Reveal>
          </>
        )}
      </section>
    </>
  );
}
