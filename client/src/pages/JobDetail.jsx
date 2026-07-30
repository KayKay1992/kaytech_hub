import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import api from '../api/axios';

const TYPE_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
};

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', cover_note: '' });
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then((res) => setJob(res.data.job))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!resumeFile) {
      setSubmitError('Please attach your resume as a PDF.');
      return;
    }
    if (resumeFile.type !== 'application/pdf') {
      setSubmitError('Resume must be a PDF file.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('full_name', form.full_name);
      data.append('email', form.email);
      data.append('phone', form.phone);
      data.append('cover_note', form.cover_note);
      data.append('resume', resumeFile);

      await api.post(`/jobs/${id}/apply`, data);
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

  if (notFound || !job) {
    return (
      <section className="section coming-soon">
        <h1>Role not found</h1>
        <p>We couldn't find that job listing.</p>
        <Link to="/careers" className="btn btn--primary">Back to Careers</Link>
      </section>
    );
  }

  return (
    <section className="section course-detail">
      <Reveal as="div">
        <Link to="/careers" className="btn btn--ghost course-detail__back">&larr; All Roles</Link>

        <div className="card__tags">
          <span className="badge">{TYPE_LABELS[job.type] || job.type}</span>{' '}
          <span className="badge">{job.location}</span>
          {job.status === 'closed' && <> <span className="badge">Closed</span></>}
        </div>

        <h1>{job.title}</h1>
        <p className="prose course-detail__summary">{job.description}</p>
      </Reveal>

      <Reveal as="div" className="card course-detail__syllabus" delay={0.1}>
        <h3>Requirements</h3>
        <p className="job-requirements">{job.requirements}</p>
      </Reveal>

      {job.status !== 'open' ? (
        <Reveal as="div" className="course-detail__cta" delay={0.2}>
          <p className="form-error">This position is no longer accepting applications.</p>
        </Reveal>
      ) : submitted ? (
        <Reveal as="div" className="auth-form job-apply-form" delay={0.2}>
          <h3>Application received</h3>
          <p className="form-success">Thanks, {form.full_name.split(' ')[0]} — we'll review your application and be in touch.</p>
        </Reveal>
      ) : (
        <Reveal as="form" className="auth-form job-apply-form" delay={0.2} onSubmit={handleSubmit}>
          <h3>Apply Now</h3>
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
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>
            Resume (PDF)
            <input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files[0])} required />
          </label>
          <label>
            Cover note
            <textarea name="cover_note" rows={4} value={form.cover_note} onChange={handleChange} />
          </label>

          <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </Reveal>
      )}
    </section>
  );
}
