import { MouseEventHandler, SyntheticEvent, useState } from 'react';
import { NostrImage, createImgProxyUrl, isVideo } from '../nostrImageDownload';
import useProfile from '../../ngine/hooks/useProfile';
import useNav from '../../utils/useNav';
import LazyLoad from 'react-lazy-load';

interface MasonryImageProps {
  image: NostrImage;
  onClick?: MouseEventHandler | undefined;
  index: number;
}

const MasonryImage = ({ image, onClick, index }: MasonryImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const { nav, currentSettings } = useNav();

  const tagClick = (tag: string) => {
    nav({ ...currentSettings, tags: [tag] });
  };
  const profileClick = (npub: string) => {
    nav({ ...currentSettings, tags: [], npubs: [npub] });
  };

  const mediaIsVideo = isVideo(image.url);
  const profile = useProfile(image.authorId);
  return (
    <LazyLoad>
      <>
        <a id={'g' + index}>
          {mediaIsVideo ? (
            <video
              className={`image ${loaded ? 'show' : ''}`}
              data-node-id={image.noteId}
              key={image.url}
              controls={false}
              autoPlay={false}
              onClick={onClick}
              src={image.url + '#t=0.1'}
              playsInline
              onLoad={() => setLoaded(true)}
            ></video>
          ) : (
            <img
              data-node-id={image.noteId}
              onError={(e: SyntheticEvent<HTMLImageElement>) => {
                console.log('not found: ', e.currentTarget.src);
                e.currentTarget.src = '/notfound.png';
              }}
              className={`image ${loaded ? 'show' : ''}`}
              onLoad={() => setLoaded(true)}
              loading="lazy"
              key={image.url}
              onClick={onClick}
              src={createImgProxyUrl(image.url, 480, -1)} // TODO make width dynamic, also with column sizes, and full screen image size
            ></img>
          )}
        </a>
        <div style={{ display: 'block', lineHeight: '1.4em', paddingBottom: '.75em', paddingTop: '.5em' }}>
          {currentSettings.npubs.length != 1 ? (
           <div style={{  paddingBottom: '.25em' }}>
              <a onClick={() => profileClick(image.author)}>{profile?.displayName || profile?.name}</a> 
              </div>
           
          ) : (
            ''
          )}

          {image.content?.substring(0, 60)}
          {image.content && image.content?.length > 60 ? '... ' : ' '}

          {image.tags.slice(0, 5).map(t => (
            <>
              <a onClick={() => tagClick(t)}>#{t}</a>{' '}
            </>
          ))}
        </div>
      </>
    </LazyLoad>
  );
};

export default MasonryImage;
