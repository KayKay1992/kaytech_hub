import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import NotifyCta from '../components/common/NotifyCta';

// Sample tracks — the real MentorshipProgram model/registration form is
// Hub module work. This page previews what's coming; no live registration yet.
const TRACKS = [
  { title: 'Frontend Developer Track', detail: 'Paired guidance for developers building toward their first or next role.' },
  { title: 'Product Management Track', detail: 'Structured mentorship for aspiring and early-career product people.' },
  { title: 'Entrepreneurship Track', detail: 'One-on-one support for founders building their first business.' },
];

export default function Mentorship() {
  return (
    <>
      <PageHeader
        eyebrow="KayTech Hub"
        title="Mentorship"
        description="A paid mentorship program pairing you with people who've done the work."
      />

      <section className="section section--flush-top">
        <div className="card-grid">
          {TRACKS.map((track, i) => (
            <Reveal as="div" className="card" key={track.title} index={i}>
              <h3>{track.title}</h3>
              <p>{track.detail}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <NotifyCta text="Registration isn't open yet — contact us to be notified when it launches." />
    </>
  );
}
