import { MouseEventHandler, SyntheticEvent, useState } from 'react';
import { NostrImage, createImgProxyUrl, isVideo } from '../nostrImageDownload';
import LazyLoad from 'react-lazy-load';

interface GridImageProps {
  image: NostrImage;
  onClick?: MouseEventHandler | undefined;
  index: number;
}

const GridImage = ({ image, onClick, index }: GridImageProps) => {
  const [loaded, setLoaded] = useState(false);

  const mediaIsVideo = isVideo(image.url);

  return (
    <a id={'g' + index}>
      <LazyLoad height={200}>
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
            referrerPolicy="no-referrer"
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
            src={createImgProxyUrl(image.url)}
          ></img>
        )}
      </LazyLoad>
    </a>
  );
};

export default GridImage;
