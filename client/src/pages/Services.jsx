import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import NotifyCta from '../components/common/NotifyCta';

// Sample offerings — the real Service model/request flow is Hub module work.
// This page previews what's coming; it doesn't submit real consulting requests yet.
const SERVICES = [
  { title: 'Business Strategy Consulting', detail: 'Get hands-on guidance to plan, structure, and grow your business.' },
  { title: 'Brand & Marketing Consulting', detail: 'Sharpen your positioning and go-to-market approach.' },
  { title: 'Tech Advisory', detail: 'Practical advice on tools, systems, and technical hiring.' },
];

export default function Services() {
  return (
    <>
      <PageHeader
        eyebrow="KayTech Hub"
        title="Services"
        description="Business consulting built for founders and teams who want practical, no-fluff guidance."
      />

      <section className="section section--flush-top">
        <div className="card-grid">
          {SERVICES.map((service, i) => (
            <Reveal as="div" className="card" key={service.title} index={i}>
              <h3>{service.title}</h3>
              <p>{service.detail}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <NotifyCta text="Consulting requests aren't live yet — reach out and we'll follow up personally." />
    </>
  );
}
