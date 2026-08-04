import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/blog')
      .then((res) => setPosts(res.data.posts))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load blog posts'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO
        title="Blog"
        description="Articles, updates, and insights from the KayTech Hub team on tech, careers, and building in Port Harcourt."
      />
      <PageHeader
        eyebrow="KayTech Hub"
        title="Blog"
        description="Articles and updates from the KayTech Hub team."
      />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p>No posts published yet — check back soon.</p>
        ) : (
          <div className="course-grid">
            {posts.map((post, i) => (
              <Reveal as="div" className="course-card" key={post._id} index={i}>
                <div className="course-card__image-wrap">
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.title} className="course-card__image" />
                  ) : (
                    <div className="course-card__image course-card__image--placeholder" />
                  )}
                </div>

                <div className="course-card__body">
                  <h3 className="course-card__title">{post.title}</h3>
                  <p className="course-card__description">{post.content.slice(0, 140)}{post.content.length > 140 ? '…' : ''}</p>

                  <div className="course-card__footer">
                    <span className="payments-muted">{new Date(post.published_at).toLocaleDateString()}</span>
                    <Link to={`/blog/${post._id}`} className="btn btn--primary course-card__cta">
                      Read More <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
