import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import NotifyCta from '../components/common/NotifyCta';

// Sample posts — the real BlogPost model is Site-Wide Admin module work.
const POSTS = [
  { title: '5 Skills Every New Developer Should Learn First', tag: 'Academy' },
  { title: 'How We Built KayTech Hub\'s Mentorship Program', tag: 'Hub' },
  { title: 'Why We Built a Physical Space, Not Just an Online Course', tag: 'Space' },
];

export default function Blog() {
  return (
    <>
      <PageHeader
        eyebrow="KayTech Hub"
        title="Blog"
        description="Articles and updates from the KayTech Hub team."
      />

      <section className="section section--flush-top">
        <div className="card-grid">
          {POSTS.map((post, i) => (
            <Reveal as="div" className="card" key={post.title} index={i}>
              <div className="card__image-placeholder" />
              <span className="badge">{post.tag}</span>
              <h3>{post.title}</h3>
            </Reveal>
          ))}
        </div>
      </section>

      <NotifyCta text="The blog isn't live yet — contact us if you'd like early access to new posts." />
    </>
  );
}
