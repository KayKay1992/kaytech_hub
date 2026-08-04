import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import SEO from '../components/common/SEO';
import Reveal from '../components/common/Reveal';

export default function BlogDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/blog/${id}`)
      .then((res) => setPost(res.data.post))
      .catch((err) => setError(err.response?.data?.message || 'Post not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <section className="section coming-soon"><p>Loading...</p></section>;
  }

  if (error || !post) {
    return (
      <section className="section coming-soon">
        <h1>Post not found</h1>
        <p>{error || "We couldn't find that post."}</p>
        <Link to="/blog" className="btn btn--primary">Back to Blog</Link>
      </section>
    );
  }

  const metaDescription = post.content.length > 160
    ? `${post.content.slice(0, 157)}...`
    : post.content;

  return (
    <section className="section">
      <SEO title={post.title} description={metaDescription} image={post.image_url} type="article" />
      <Reveal as="div" className="course-hero">
        <div className="course-hero__image-wrap">
          {post.image_url ? (
            <img src={post.image_url} alt={post.title} className="course-hero__image" />
          ) : (
            <div className="course-hero__image course-hero__image--placeholder" />
          )}
        </div>

        <div className="course-hero__body">
          <Link to="/blog" className="btn btn--ghost course-detail__back">&larr; All Posts</Link>

          <h1 className="course-hero__title">{post.title}</h1>
          <p className="payments-muted">
            {post.author_id?.name || 'KayTech Hub'} · {new Date(post.published_at).toLocaleDateString()}
          </p>
        </div>
      </Reveal>

      <div className="course-layout">
        <div className="course-layout__main">
          <Reveal as="div" className="course-section" delay={0.1}>
            {post.content.split('\n').filter(Boolean).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
