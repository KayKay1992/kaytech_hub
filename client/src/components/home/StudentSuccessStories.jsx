import { useEffect, useState } from 'react';
import Reveal from '../common/Reveal';
import RandomizedShowcase from './RandomizedShowcase';
import SuccessStoryCard from './SuccessStoryCard';
import api from '../../api/axios';

export default function StudentSuccessStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/success-stories')
      .then((res) => setStories(res.data.stories))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section">
      <Reveal as="div" className="section__header">
        <span className="badge">Success Stories</span>
        <h2>Student Success Stories</h2>
        <p>Real outcomes from people who trained with us.</p>
      </Reveal>

      {loading ? (
        <p>Loading success stories...</p>
      ) : stories.length === 0 ? (
        <p>Success stories will appear here as students complete cohorts and share their outcomes.</p>
      ) : (
        <RandomizedShowcase
          items={stories}
          getKey={(story) => story._id}
          renderCard={(story, i) => <SuccessStoryCard story={story} index={i} key={story._id} />}
        />
      )}
    </section>
  );
}
