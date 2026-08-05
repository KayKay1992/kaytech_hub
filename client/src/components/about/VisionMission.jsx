import Reveal from '../common/Reveal';

export default function VisionMission() {
  return (
    <section className="section section--muted">
      <div className="card-grid card-grid--two">
        <Reveal as="div" className="card" index={0}>
          <h3>Our Vision</h3>
          <p>
            To become Port Harcourt's leading innovation hub — a place where
            anyone, regardless of background, can gain the practical tech and
            creative skills to build a career, start a business, or bring an
            idea to life.
          </p>
        </Reveal>
        <Reveal as="div" className="card" index={1}>
          <h3>Our Mission</h3>
          <p>
            To equip individuals and businesses in Port Harcourt and beyond with
            practical, industry-relevant skills in technology, design, and
            digital business — through hands-on training, mentorship, and a
            supportive community — while helping local businesses grow through
            hands-on services and AI-powered solutions.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
