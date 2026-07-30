import Reveal from '../common/Reveal';

export default function AcademyStory() {
  return (
    <section className="section">
      <Reveal as="div" className="section__header">
        <span className="badge">About Us</span>
        <h2>Our Story</h2>
      </Reveal>
      <Reveal as="p" className="prose" delay={0.1}>
        KayTech Hub started as a small training initiative for students who
        wanted practical, job-ready tech skills without the noise of
        generic online courses. It has since grown into three connected
        pillars — Academy, Hub, and Space — each built around one goal:
        helping people learn, do business, and work better.
      </Reveal>
    </section>
  );
}
