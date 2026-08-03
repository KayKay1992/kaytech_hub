import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import FormPanel from '../components/common/FormPanel';
import HoneypotField from '../components/common/HoneypotField';
import api from '../api/axios';

const PROCESS_STEPS = [
  { title: 'Apply online', detail: 'Tell us about yourself and pick the course you want funded — takes a couple of minutes.' },
  { title: 'We review', detail: 'Our team reviews every application by hand against the program requirements.' },
  { title: 'Get notified', detail: "We'll email you the decision and, if approved, confirm your course placement." },
];

export default function ScholarshipDetail() {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({ applicant_name: '', email: '', phone: '', course_id: '', website: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/scholarships/${id}`),
      api.get('/courses'),
    ])
      .then(([programRes, coursesRes]) => {
        const loadedProgram = programRes.data.program;
        setProgram(loadedProgram);
        setCourses(coursesRes.data.courses);

        const defaultCourseId = !loadedProgram.applies_to_all_courses && loadedProgram.course_id
          ? (loadedProgram.course_id._id || loadedProgram.course_id)
          : '';
        setForm((f) => ({ ...f, course_id: defaultCourseId }));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!form.course_id) {
      setSubmitError('Please select the course you are applying for.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/scholarships/${id}/apply`, form);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit application. Please try again.');
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
        <h1>Scholarship program not found</h1>
        <p>We couldn't find that scholarship program.</p>
        <Link to="/scholarships" className="btn btn--primary">Back to Scholarships</Link>
      </section>
    );
  }

  const requirementLines = (program.requirements || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const trackLabel = program.applies_to_all_courses ? 'All Courses' : (program.course_id?.title || 'Not tied to a specific course');

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
          <Link to="/scholarships" className="btn btn--ghost course-detail__back">&larr; All Scholarships</Link>

          <h1 className="course-hero__title">{program.title}</h1>
          <p className="course-hero__description">{program.description}</p>

          <div className="course-hero__stats">
            <div className="course-hero__stat">
              <span className="course-hero__stat-label">Status</span>
              <span className="course-hero__stat-value">{program.status === 'open' ? 'Open for applications' : 'Closed'}</span>
            </div>
            <div className="course-hero__stat">
              <span className="course-hero__stat-label">Course Track</span>
              <span className="course-hero__stat-value">{trackLabel}</span>
            </div>
          </div>

          <span className="badge">Scholarship Program</span>
        </div>
      </Reveal>

      <div className="course-layout">
        <div className="course-layout__main">
          {requirementLines.length > 0 && (
            <Reveal as="div" className="course-section" delay={0.1}>
              <h2>Requirements</h2>
              {requirementLines.length > 1 ? (
                <ul className="course-requirements-list">
                  {requirementLines.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              ) : (
                <p>{requirementLines[0]}</p>
              )}
            </Reveal>
          )}

          <Reveal as="div" className="course-section" delay={0.15}>
            <h2>How Applications Work</h2>
            <ol className="course-timeline">
              {PROCESS_STEPS.map((step, i) => (
                <li className="course-timeline__item" key={step.title}>
                  <span className="course-timeline__marker">{i + 1}</span>
                  <div className="course-timeline__content">
                    <h4>{step.title}</h4>
                    <p>{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <div className="course-layout__aside">
          <Reveal as="div" className="course-price-card" delay={0.1}>
            <span className="course-price-card__label">Scholarship Status</span>
            <span className="course-price-card__value">{program.status === 'open' ? 'Open' : 'Closed'}</span>
            <div className="course-price-card__row">
              <span>Course Track</span>
              <span>{trackLabel}</span>
            </div>
          </Reveal>

          {program.status !== 'open' ? (
            <Reveal as="div" className="course-detail__cta" delay={0.2}>
              <p className="form-error">This scholarship program is no longer accepting applications.</p>
            </Reveal>
          ) : (
            <Reveal as="div" className="course-detail__cta" delay={0.2}>
              <FormPanel>
                {submitted ? (
                  <div className="dark-form">
                    <h3>Application received</h3>
                    <p className="form-success">Thanks, {form.applicant_name.split(' ')[0]} — we'll review your application and be in touch.</p>
                  </div>
                ) : (
                  <form className="dark-form" onSubmit={handleSubmit}>
                    <h3>Apply for this Scholarship</h3>
                    {submitError && <p className="form-error">{submitError}</p>}

                    <HoneypotField value={form.website} onChange={handleChange} />

                    <label>
                      Full name
                      <input type="text" name="applicant_name" value={form.applicant_name} onChange={handleChange} required />
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
                      Which course are you applying for?
                      <select name="course_id" value={form.course_id} onChange={handleChange} required>
                        <option value="">Select a course...</option>
                        {courses.map((c) => (
                          <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                      </select>
                    </label>

                    <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Application'}
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
