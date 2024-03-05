import { topics } from '../env';
import useNav from '../../utils/useNav';
import './Home.css';
import { useGlobalState } from '../../utils/globalState';
import usePeopleLists from '../../utils/useLists';
import { createImgProxyUrl } from '../nostrImageDownload';
import { useState } from 'react';

const Home = () => {
  const { nav, currentSettings } = useNav();
  const [showAdult, setShowAdult] = useState(currentSettings.showAdult || false);
  const [state] = useGlobalState();
  const topicKeys = Object.keys(topics);
  const lists = usePeopleLists(state.userNPub);

  return (
    <div className="home-container">
      <div className="home">
        <h2>Topics</h2>
        <div className="topics">
          {topicKeys.map(tk => (
            <div
              key={tk}
              className="topic"
              style={{
                backgroundImage: `linear-gradient(170deg, rgba(0, 0, 0, .8) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 100%), url(${createImgProxyUrl('https://slidestr.net/images/' + tk + '.jpg', 600, -1)})`,
              }}
              onClick={() =>
                nav({ ...currentSettings, topic: tk, npubs: [], tags: [], list: undefined, follows: false, showAdult })
              }
            >
              <div className="topic-title">{topics[tk].name || tk}</div>
            </div>
          ))}
          <div
            className="topic"
            onClick={() =>
              nav({
                tags: [],
                npubs: [],
                showReplies: false,
                showReposts: false,
                follows: false,
                showAdult,
              })
            }
          >
            <div className="topic-title">Global</div>
            <div>All content posted on nostr. Use with care!</div>
          </div>
        </div>
        {state.userNPub && (
          <>
            {' '}
            <h2>Your...</h2>
            <div
              className="topic"
              style={{}}
              onClick={() =>
                nav({
                  ...currentSettings,
                  topic: undefined,
                  npubs: [],
                  tags: [],
                  list: undefined,
                  follows: true,
                  showReplies: false,
                  showReposts: true,
                  showAdult,
                })
              }
            >
              <div className="topic-title">Follows</div>
            </div>
          </>
        )}
        {lists && lists.length > 0 && (
          <>
            <h2>Your lists</h2>
            <div className="topics">
              {lists.map(l => (
                <div
                  key={l.nevent}
                  className="topic"
                  style={{}}
                  onClick={() =>
                    nav({
                      ...currentSettings,
                      tags: [],
                      npubs: [],
                      list: l.nevent,
                      topic: undefined,
                      follows: false,
                      showAdult,
                    })
                  }
                >
                  <div className="topic-title">{l.name}</div>
                  {l.description && <div>{l.description}</div>}
                </div>
              ))}
            </div>
          </>
        )}
        <div className={`content-warning ${showAdult ? 'active' : ''}`} style={{ marginTop: '5em' }}>
          <div>
            <input name="adult" type="checkbox" checked={showAdult} onChange={() => setShowAdult(sa => !sa)} />
          </div>
          <label htmlFor="adult" onClick={() => setShowAdult(sa => !sa)} style={{ userSelect: 'none' }}>
            <div className="warning">NSFW / adult content</div>
            Allow adult content to be shown and ignore content warnings.
          </label>
        </div>
        <div className="footer">
          Made with 💜 by{' '}
          <a href="https://njump.me/npub1klr0dy2ul2dx9llk58czvpx73rprcmrvd5dc7ck8esg8f8es06qs427gxc" target="blank">
            Florian
          </a>
          <br />
          Source: <a href="https://git.v0l.io/florian/nostr-slideshow">https://git.v0l.io/florian/nostr-slideshow</a>
        </div>
      </div>
    </div>
  );
};

export default Home;
