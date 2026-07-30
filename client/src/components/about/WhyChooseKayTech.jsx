import Reveal from '../common/Reveal';

const REASONS = [
  { title: 'Practical, hands-on learning', detail: 'No fluff — coding exercises, real assignments, real projects.' },
  { title: 'Experienced instructors', detail: 'Learn from people who have done the work, not just taught it.' },
  { title: 'Business + workspace support', detail: 'Mentorship and co-working space to help you act on what you learn.' },
  { title: 'Transparent, offline payments', detail: 'Pay by bank transfer or cash — no hidden gateway fees.' },
];

export default function WhyChooseKayTech() {
  return (
    <section className="section section--muted">
      <Reveal as="div" className="section__header">
        <span className="badge">Why KayTech</span>
        <h2>Why Choose KayTech Hub</h2>
      </Reveal>
      <div className="card-grid">
        {REASONS.map((reason, i) => (
          <Reveal as="div" className="card" key={reason.title} index={i}>
            <h3>{reason.title}</h3>
            <p>{reason.detail}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
