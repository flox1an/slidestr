import { MouseEventHandler, SyntheticEvent, useState } from 'react';
import { NostrImage, createImgProxyUrl, isVideo } from '../nostrImageDownload';

interface GridImageProps {
  image: NostrImage;
  onClick?: MouseEventHandler | undefined;
}

const GridImage = ({ image, onClick }: GridImageProps) => {
  const [loaded, setLoaded] = useState(false);

  const mediaIsVideo = isVideo(image.url);

  return mediaIsVideo ? (
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
        e.currentTarget.src = '/notfound.png';
      }}
      className={`image ${loaded ? 'show' : ''}`}
      onLoad={() => setLoaded(true)}
      loading="lazy"
      key={image.url}
      onClick={onClick}
      src={createImgProxyUrl(image.url)}
    ></img>
  );
};

export default GridImage;
