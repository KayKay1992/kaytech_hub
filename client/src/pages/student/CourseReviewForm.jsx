import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';
import Reveal from '../../components/common/Reveal';
import StarRating from '../../components/common/StarRating';

export default function StudentCourseReviewForm() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course');

  const [courseTitle, setCourseTitle] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [existingStatus, setExistingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.get(`/courses/${courseId}`).catch(() => null),
      api.get('/student/course-reviews').catch(() => ({ data: { reviews: [] } })),
    ]).then(([courseRes, reviewsRes]) => {
      if (courseRes) setCourseTitle(courseRes.data.course.title);
      const existing = reviewsRes.data.reviews.find((r) => r.course_id?._id === courseId);
      if (existing) {
        setRating(existing.rating);
        setReviewText(existing.review_text);
        setExistingStatus(existing.status);
      }
    }).finally(() => setLoading(false));
  }, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a star rating');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.post('/student/course-reviews', { course_id: courseId, rating, review_text: reviewText });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit your review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!courseId) {
    return (
      <section className="section coming-soon">
        <p>Missing course. <Link to="/student/certificates">Back to Certificates</Link></p>
      </section>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Student Area"
        title={existingStatus ? 'Edit Your Review' : 'Write a Review'}
        description={courseTitle ? `Share your experience with ${courseTitle}.` : 'Share your experience with this course.'}
      >
        <p><Link to="/student/certificates">&larr; Back to Certificates</Link></p>
      </PageHeader>

      <section className="section section--flush-top">
        {loading ? (
          <p>Loading...</p>
        ) : submitted ? (
          <Reveal as="div" className="course-section">
            <h3>Thanks for your review!</h3>
            <p className="form-success">Your review has been submitted and is pending admin approval.</p>
          </Reveal>
        ) : (
          <Reveal as="form" className="auth-form job-form" onSubmit={handleSubmit}>
            {error && <p className="form-error">{error}</p>}
            {existingStatus && (
              <p className="form-hint">Editing your review will send it back for admin re-approval.</p>
            )}

            <label>
              Your rating
              <div><StarRating value={rating} onChange={setRating} size={26} /></div>
            </label>

            <label>
              Your review
              <textarea rows={6} value={reviewText} onChange={(e) => setReviewText(e.target.value)} required />
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
              {submitting ? 'Submitting...' : existingStatus ? 'Update Review' : 'Submit Review'}
            </button>
          </Reveal>
        )}
      </section>
    </>
  );
}
