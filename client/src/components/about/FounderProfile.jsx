import Reveal from '../common/Reveal';

export default function FounderProfile() {
  return (
    <section className="section">
      <Reveal as="div" className="founder">
        <div className="card__avatar-placeholder card__avatar-placeholder--lg" />
        <div>
          <span className="badge">Founder</span>
          <h2>Meet the Founder</h2>
          <h3>Kenneth Nwankpa</h3>
          <p>
            Founder of KayTech Hub, dedicated to building an ecosystem where
            students learn practical skills, entrepreneurs get real business
            support, and professionals have a reliable place to work.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
