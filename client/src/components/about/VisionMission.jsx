import Reveal from '../common/Reveal';

export default function VisionMission() {
  return (
    <section className="section section--muted">
      <div className="card-grid card-grid--two">
        <Reveal as="div" className="card" index={0}>
          <h3>Our Vision</h3>
          <p>To be the go-to hub for practical tech education, business growth, and productive work in our region.</p>
        </Reveal>
        <Reveal as="div" className="card" index={1}>
          <h3>Our Mission</h3>
          <p>To equip students and professionals with real skills, real mentorship, and real workspace — without unnecessary barriers.</p>
        </Reveal>
      </div>
    </section>
  );
}
