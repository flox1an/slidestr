import { topics } from '../env';
import useNav from '../../utils/useNav';
import './Home.css';
import { useGlobalState } from '../../utils/globalState';
import usePeopleLists from '../../utils/useLists';

const Home = () => {
  const { nav, currentSettings } = useNav();
  const [state] = useGlobalState();
  const topicKeys = Object.keys(topics);
  const lists = usePeopleLists(state.userNPub);

  return (
    <div className="home">
      <h2>Topics</h2>
      <div className="topics">
        {topicKeys.map(tk => (
          <div
            className="topic"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, .8) 0%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0) 100%), url('/images/${tk}.jpg')`,
            }}
            onClick={() => nav({ ...currentSettings, tags: topics[tk].tags })}
          >
            <div className="topic-title">{tk}</div>
          </div>
        ))}
      </div>
      <h2>Lists</h2>
      <div className="topics">
        {lists.map(l => (
          <div
            className="topic"
            style={{ background: `linear-gradient(to bottom, rgba(0, 0, 0, .8) 0%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0) 100%), red)` }}
            onClick={() => nav({ ...currentSettings, tags:[], npubs: [], list: l.nevent})}
          >
            <div className="topic-title">{l.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;