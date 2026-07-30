import Reveal from '../common/Reveal';

const STORIES = [
  { name: 'Amaka O.', outcome: 'Landed a frontend developer role after completing Web Development.' },
  { name: 'Tunde A.', outcome: 'Launched a consulting business using KayTech Hub mentorship.' },
  { name: 'Ifeoma N.', outcome: 'Now works as a data analyst at a fintech startup.' },
];

export default function StudentSuccessStories() {
  return (
    <section className="section">
      <Reveal as="div" className="section__header">
        <span className="badge">Success Stories</span>
        <h2>Student Success Stories</h2>
        <p>Real outcomes from people who trained with us.</p>
      </Reveal>

      <div className="card-grid">
        {STORIES.map((story, i) => (
          <Reveal as="div" className="card" key={story.name} index={i}>
            <div className="card__avatar-placeholder" />
            <h3>{story.name}</h3>
            <p>{story.outcome}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
