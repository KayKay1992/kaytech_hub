import Reveal from '../common/Reveal';

const TESTIMONIALS = [
  { quote: 'The instructors actually care whether you understand the material.', author: 'Chidi E., Student' },
  { quote: 'Mentorship helped me structure my business plan properly.', author: 'Grace K., Mentee' },
  { quote: 'The co-working space is quiet and reliable — great for deep work.', author: 'Samuel I., Space Member' },
];

export default function Testimonials() {
  return (
    <section className="section section--muted">
      <Reveal as="div" className="section__header">
        <span className="badge">Testimonials</span>
        <h2>What People Say</h2>
      </Reveal>

      <div className="card-grid">
        {TESTIMONIALS.map((t, i) => (
          <Reveal as="blockquote" className="testimonial" key={t.author} index={i}>
            <p>&ldquo;{t.quote}&rdquo;</p>
            <cite>{t.author}</cite>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
