import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';
import Reveal from '../../components/common/Reveal';

const EMPTY_FORM = { headline: '', story: '', course_id: '' };

export default function StudentSuccessStoryForm() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get('/student/courses')
      .then((res) => {
        const uniqueCourses = new Map();
        res.data.enrollments.forEach((e) => {
          const course = e.cohort_id?.course_id;
          if (course?._id) uniqueCourses.set(course._id, course);
        });
        setCourses(Array.from(uniqueCourses.values()));
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (photoFile) data.append('photo', photoFile);
      await api.post('/student/success-stories', data);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit your success story');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Student Area"
        title="Share Your Success Story"
        description="Tell us about the outcome your training helped you reach. Once approved by an admin, it may be featured on our Home page."
      >
        <p><Link to="/student/certificates">&larr; Back to Certificates</Link></p>
      </PageHeader>

      <section className="section section--flush-top">
        {submitted ? (
          <Reveal as="div" className="course-section">
            <h3>Thanks for sharing!</h3>
            <p className="form-success">Your story has been submitted and is pending admin review.</p>
          </Reveal>
        ) : (
          <Reveal as="form" className="auth-form job-form" onSubmit={handleSubmit}>
            {error && <p className="form-error">{error}</p>}

            <label>
              Headline
              <input
                type="text" name="headline" value={form.headline} onChange={handleChange}
                placeholder="e.g. From Zero to Frontend Developer" required
              />
            </label>

            <label>
              Your story
              <textarea name="story" rows={6} value={form.story} onChange={handleChange} required />
            </label>

            <label>
              Related course (optional)
              <select name="course_id" value={form.course_id} onChange={handleChange}>
                <option value="">No specific course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </label>

            <label>
              Photo (optional)
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0] || null)} />
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Your Story'}
            </button>
          </Reveal>
        )}
      </section>
    </>
  );
}
