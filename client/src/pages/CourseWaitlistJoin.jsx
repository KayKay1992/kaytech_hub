import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import FormPanel from '../components/common/FormPanel';
import HoneypotField from '../components/common/HoneypotField';
import api from '../api/axios';

const EMPTY_FORM = { name: '', email: '', phone: '', website: '' };

export default function CourseWaitlistJoin() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const cohortId = searchParams.get('cohort') || '';

  const [course, setCourse] = useState(null);
  const [cohort, setCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/courses/${id}`)
      .then((res) => {
        setCourse(res.data.course);
        const matchedCohort = res.data.cohorts.find((c) => c._id === cohortId);
        if (!matchedCohort) {
          setNotFound(true);
        } else {
          setCohort(matchedCohort);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, cohortId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post(`/courses/${id}/waitlist`, { ...form, cohort_id: cohortId });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to join the waitlist. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <section className="section coming-soon"><p>Loading...</p></section>;
  }

  if (notFound || !course || !cohort) {
    return (
      <section className="section coming-soon">
        <h1>Waitlist not available</h1>
        <p>We couldn't find that cohort's waitlist.</p>
        <Link to="/courses" className="btn btn--primary">Back to Courses</Link>
      </section>
    );
  }

  return (
    <section className="section">
      <Reveal as="div" className="form-page__header">
        <Link to={`/courses/${id}`} className="btn btn--ghost form-page__back">&larr; Back to {course.title}</Link>
        <h1>Join the Waitlist for {course.title}</h1>
        <p className="prose">
          {cohort.name} is full right now. Leave your details and we'll email you the moment a new cohort opens for this course.
        </p>
      </Reveal>

      <Reveal as="div" delay={0.1}>
        <FormPanel>
          {submitted ? (
            <div className="dark-form">
              <h3>You're on the list</h3>
              <p className="form-success">Thanks, {form.name.split(' ')[0]} — we'll email you as soon as a new cohort opens.</p>
            </div>
          ) : (
            <form className="dark-form" onSubmit={handleSubmit}>
              {submitError && <p className="form-error">{submitError}</p>}

              <HoneypotField value={form.website} onChange={handleChange} />

              <label>
                Full name
                <input type="text" name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                Phone
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
              </label>

              <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                {submitting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          )}
        </FormPanel>
      </Reveal>
    </section>
  );
}
