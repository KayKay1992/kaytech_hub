import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import NotifyCta from '../components/common/NotifyCta';

// Sample events — the real Event model is Site-Wide Admin module work.
const EVENTS = [
  { title: 'Intro to Web Development — Free Workshop', tag: 'Workshop' },
  { title: 'Founders Meetup: Building in Port Harcourt', tag: 'Meetup' },
  { title: 'AI Skills for Every Career — Info Session', tag: 'Info Session' },
];

export default function Events() {
  return (
    <>
      <PageHeader
        eyebrow="KayTech Hub"
        title="Events"
        description="Workshops, meetups, and info sessions happening at KayTech Hub."
      />

      <section className="section section--flush-top">
        <div className="card-grid">
          {EVENTS.map((event, i) => (
            <Reveal as="div" className="card" key={event.title} index={i}>
              <div className="card__image-placeholder" />
              <span className="badge">{event.tag}</span>
              <h3>{event.title}</h3>
            </Reveal>
          ))}
        </div>
      </section>

      <NotifyCta text="Event listings aren't live yet — contact us to hear about upcoming dates." />
    </>
  );
}
