import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import FormPanel from '../components/common/FormPanel';
import api from '../api/axios';

const OCCUPATION_OPTIONS = ['Student', 'Employed', 'Job-seeking', 'Business owner', 'Other'];
const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const EMPTY_FORM = {
  full_name: '', email: '', phone: '',
  occupation_or_status: '', experience_level: '',
  reason_for_joining: '', how_heard_about_us: '',
};

export default function MentorshipDetail() {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/mentorship/${id}`)
      .then((res) => setProgram(res.data.program))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post(`/mentorship/${id}/register`, form);
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

  if (notFound || !program) {
    return (
      <section className="section coming-soon">
        <h1>Mentorship program not found</h1>
        <p>We couldn't find that mentorship program.</p>
        <Link to="/mentorship" className="btn btn--primary">Back to Mentorship</Link>
      </section>
    );
  }

  return (
    <section className="section">
      <Reveal as="div" className="course-hero">
        <div className="course-hero__image-wrap">
          {program.image_url ? (
            <img src={program.image_url} alt={program.title} className="course-hero__image" />
          ) : (
            <div className="course-hero__image course-hero__image--placeholder" />
          )}
        </div>

        <div className="course-hero__body">
          <Link to="/mentorship" className="btn btn--ghost course-detail__back">&larr; All Mentorship Programs</Link>

          <h1 className="course-hero__title">{program.title}</h1>
          <p className="course-hero__description">{program.description}</p>

          <div className="course-hero__stats">
            <div className="course-hero__stat">
              <span className="course-hero__stat-label">Duration</span>
              <span className="course-hero__stat-value">{program.duration}</span>
            </div>
            <div className="course-hero__stat">
              <span className="course-hero__stat-label">Fee</span>
              <span className="course-hero__stat-value">₦{Number(program.price).toLocaleString()}</span>
            </div>
          </div>

          <span className="badge">Mentorship Program</span>
        </div>
      </Reveal>

      <div className="course-layout">
        <div className="course-layout__main">
          {program.schedule_info && (
            <Reveal as="div" className="course-section" delay={0.1}>
              <h2>Schedule</h2>
              <p>{program.schedule_info}</p>
            </Reveal>
          )}
        </div>

        <div className="course-layout__aside">
          <Reveal as="div" className="course-price-card" delay={0.1}>
            <span className="course-price-card__label">Program Fee</span>
            <span className="course-price-card__value">₦{Number(program.price).toLocaleString()}</span>
            <div className="course-price-card__row">
              <span>Duration</span>
              <span>{program.duration}</span>
            </div>
          </Reveal>

          {program.status !== 'open' ? (
            <Reveal as="div" className="course-detail__cta" delay={0.2}>
              <p className="form-error">This mentorship program is no longer open for registration.</p>
            </Reveal>
          ) : (
            <Reveal as="div" className="course-detail__cta" delay={0.2}>
              <FormPanel>
                {submitted ? (
                  <div className="dark-form">
                    <h3>Registration received</h3>
                    <p className="form-success">Thanks, {form.full_name.split(' ')[0]} — we'll be in touch with payment details and next steps.</p>
                  </div>
                ) : (
                  <form className="dark-form" onSubmit={handleSubmit}>
                    <h3>Register for this Program</h3>
                    {submitError && <p className="form-error">{submitError}</p>}

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
                    <label>
                      Occupation / status
                      <select name="occupation_or_status" value={form.occupation_or_status} onChange={handleChange} required>
                        <option value="">Select...</option>
                        {OCCUPATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </label>
                    <label>
                      Experience level
                      <select name="experience_level" value={form.experience_level} onChange={handleChange} required>
                        <option value="">Select...</option>
                        {EXPERIENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </label>
                    <label>
                      Why do you want to join this mentorship?
                      <textarea name="reason_for_joining" rows={3} value={form.reason_for_joining} onChange={handleChange} required />
                    </label>
                    <label>
                      How did you hear about us?
                      <input type="text" name="how_heard_about_us" value={form.how_heard_about_us} onChange={handleChange} />
                    </label>

                    <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Registration'}
                    </button>
                  </form>
                )}
              </FormPanel>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
