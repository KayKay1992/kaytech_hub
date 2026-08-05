import Reveal from '../common/Reveal';

export default function AcademyStory() {
  return (
    <section className="section">
      <Reveal as="div" className="section__header">
        <span className="badge">About Us</span>
        <h2>Our Story</h2>
      </Reveal>
      <Reveal as="p" className="prose" delay={0.1}>
        KayTech Hub was born from an unlikely place: the control rooms and process
        units of one of Nigeria's largest fertilizer and petrochemical plants. Our
        founder spent years as a Process and Field Operator in heavy industry —
        monitoring critical systems, running PLCs and SCADA platforms,
        commissioning multi-million-dollar plants, and living by one unshakeable
        rule: precision and discipline aren't optional, they're survival.
      </Reveal>
      <Reveal as="p" className="prose" delay={0.2}>
        That same rigor, applied to software and AI, became the seed of KayTech
        Hub. What started as one engineer teaching himself to build and automate
        with code became a bigger question: how many other talented people in
        Port Harcourt have the same drive, but no accessible, practical way to
        build real tech skills? Not another theory-heavy course. Not a program
        built for Lagos or San Francisco. Something built here, for the way Port
        Harcourt actually works.
      </Reveal>
      <Reveal as="p" className="prose" delay={0.3}>
        KayTech Hub is our answer — a tech academy and innovation hub combining
        hands-on courses, business services, mentorship, and a physical space to
        build in, all under one roof, all with the same principle that shaped our
        founder's career: master the fundamentals, respect the process, and never
        stop building.
      </Reveal>
    </section>
  );
}
