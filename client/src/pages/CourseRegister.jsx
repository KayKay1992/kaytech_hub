import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import FormPanel from '../components/common/FormPanel';
import PillSelect from '../components/common/PillSelect';
import HoneypotField from '../components/common/HoneypotField';
import api from '../api/axios';

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', occupation_status: '',
  experience_level: 'beginner', reason: '', how_heard: '', cohort_id: '', website: '',
};

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function CourseRegister() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [cohorts, setCohorts] = useState([]);
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
        setCohorts(res.data.cohorts);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post(`/courses/${id}/register`, {
        ...form,
        cohort_id: form.cohort_id || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <section className="section coming-soon"><p>Loading...</p></section>;
  }

  if (notFound || !course) {
    return (
      <section className="section coming-soon">
        <h1>Course not found</h1>
        <p>We couldn't find that course.</p>
        <Link to="/courses" className="btn btn--primary">Back to Courses</Link>
      </section>
    );
  }

  return (
    <section className="section">
      <Reveal as="div" className="form-page__header">
        <Link to={`/courses/${id}`} className="btn btn--ghost form-page__back">&larr; Back to {course.title}</Link>
        <h1>Register for {course.title}</h1>
        <p className="prose">
          Tell us a bit about yourself. This isn't final enrollment — our team will reach out to confirm your spot and payment (bank transfer/cash, offline).
        </p>
      </Reveal>

      <Reveal as="div" delay={0.1}>
        <FormPanel>
          {submitted ? (
            <div className="dark-form">
              <h3>Registration received</h3>
              <p className="form-success">Thanks, {form.full_name.split(' ')[0]} — we'll be in touch shortly to confirm your spot.</p>
            </div>
          ) : (
            <form className="dark-form" onSubmit={handleSubmit}>
              {submitError && <p className="form-error">{submitError}</p>}

              <HoneypotField value={form.website} onChange={handleChange} />

              <label>
                Full name
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                Phone
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
              </label>

              {cohorts.length > 0 && (
                <label>
                  Preferred cohort (optional)
                  <select name="cohort_id" value={form.cohort_id} onChange={handleChange}>
                    <option value="">No preference</option>
                    {cohorts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({new Date(c.start_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Occupation / current status
                <input type="text" name="occupation_status" value={form.occupation_status} onChange={handleChange} placeholder="e.g. Student, Employed, Freelancer" required />
              </label>

              <label>
                Experience level
                <PillSelect
                  name="experience_level"
                  options={EXPERIENCE_OPTIONS}
                  value={form.experience_level}
                  onChange={(value) => setField('experience_level', value)}
                />
              </label>

              <label>
                Why do you want to join this course?
                <textarea name="reason" rows={4} value={form.reason} onChange={handleChange} required />
              </label>

              <label>
                How did you hear about us? (optional)
                <input type="text" name="how_heard" value={form.how_heard} onChange={handleChange} />
              </label>

              <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            </form>
          )}
        </FormPanel>
      </Reveal>
    </section>
  );
}
