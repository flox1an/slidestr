import { topics } from '../env';
import useNav from '../../utils/useNav';
import './Home.css';

const Home = () => {
  const { nav, currentSettings } = useNav();

  const topicKeys = Object.keys(topics);

  return (
    <div className="home">
      <h2>Topics</h2>
      <div className="topics">
        {topicKeys.map(tk => (
          <div
            className="topic"
            style={{ backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, .8) 0%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0) 100%), url('/images/${tk}.jpg')` }}
            onClick={() => nav({ ...currentSettings, tags: topics[tk].tags })}
          >
            <div className="topic-title">{tk}</div>
{/*
            <div>
              {topics[tk].tags.slice(0, 5).map(t => (
                <>
                  <span className="tag">{t}</span>{' '}
                </>
              ))}
              {topics[tk].tags.length > 5 ? '...' : ''}
            </div>
             */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
