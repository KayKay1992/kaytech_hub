import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import NotifyCta from '../components/common/NotifyCta';

// Sample plans — the real WorkspacePlan model/registration form is Space
// module work. This page previews what's coming; no live registration yet.
const PLANS = [
  { title: 'Hot Desk', detail: 'Flexible daily access to a shared workspace, whenever you need it.' },
  { title: 'Dedicated Desk', detail: 'Your own reserved desk in a quiet, reliable environment.' },
  { title: 'Private Office', detail: 'A private room for teams and focused research work.' },
];

export default function Space() {
  return (
    <>
      <PageHeader
        eyebrow="KayTech Hub"
        title="Space"
        description="Co-working and research space plans for people who need a reliable place to work."
      />

      <section className="section section--flush-top">
        <div className="card-grid">
          {PLANS.map((plan, i) => (
            <Reveal as="div" className="card" key={plan.title} index={i}>
              <h3>{plan.title}</h3>
              <p>{plan.detail}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <NotifyCta text="Membership registration isn't open yet — contact us to be notified when it launches." />
    </>
  );
}
