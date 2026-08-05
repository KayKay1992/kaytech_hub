import Reveal from '../common/Reveal';

// Only the AI-related skill uses the Circuit Teal <AI_.../> tag treatment —
// that color is reserved exclusively for AI badges elsewhere on the site
// (CourseCard, ServiceDetail). The rest use the neutral on-dark tag style.
const SKILLS = [
  { label: '<INDUSTRIAL_AUTOMATION/>', ai: false },
  { label: '<FULLSTACK_DEV/>', ai: false },
  { label: '<AI_AUTOMATION/>', ai: true },
  { label: '<PROJECT_MANAGEMENT/>', ai: false },
];

export default function FounderProfile() {
  return (
    <section className="section">
      <Reveal as="div" className="founder-panel">
        <div className="founder-panel__photo-col">
          <div className="founder-panel__photo-frame">
            <div className="founder-panel__photo-decor" aria-hidden="true" />
            <img
              src="/images/founder-kenneth-nwankpa.jpg"
              alt="Kenneth Nwankpa, Founder & CEO of KayTech Hub"
              className="founder-panel__photo"
            />
          </div>
          <div className="founder-panel__skills">
            {SKILLS.map(({ label, ai }) => (
              <span key={label} className={`badge badge--on-dark${ai ? ' badge--ai' : ''}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="founder-panel__bio">
          <span className="badge badge--on-dark">Founder &amp; CEO</span>
          <h2 className="founder-panel__name">Kenneth Nwankpa</h2>

          <p className="founder-panel__text">
            Kenneth holds a degree in Chemical and Petrochemical Engineering from
            Rivers State University, and built his early career as a Process and
            Field Operator, Field Supervisor, and Panel Operator at Indorama
            Eleme Fertilizer and Chemical — one of Nigeria's largest
            petrochemical operations. Over the course of his career, he earned
            certifications in Industrial Automation Engineering (PLC, SCADA,
            instrumentation and controls), Field Production Operations, and
            Project Management, and played hands-on roles in the commissioning
            and turnaround maintenance of multiple industrial plants —
            high-stakes work where precision, safety, and systems thinking are
            non-negotiable.
          </p>
          <p className="founder-panel__text">
            Alongside this technical foundation in heavy industry, Kenneth built
            a second, complementary expertise: full-stack web development and AI
            automation engineering. That combination — an engineer's discipline
            for process and precision, paired with hands-on software and
            AI-building skills — is the foundation KayTech Hub is built on.
          </p>

          <blockquote className="founder-panel__quote">
            <span className="founder-panel__quote-mark" aria-hidden="true">&ldquo;</span>
            I spent years mastering complex industrial systems where one
            overlooked detail could shut down an entire plant — that taught me
            discipline most people never get the chance to learn. When I taught
            myself to build software and work with AI, I realized the same
            principles applied: master the fundamentals, build real things, and
            never stop learning. I started KayTech Hub because Port Harcourt has
            no shortage of talented, driven people — what's missing is
            accessible, genuinely practical training to turn that talent into
            real skills and real careers.
          </blockquote>
        </div>
      </Reveal>
    </section>
  );
}
