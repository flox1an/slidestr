import { SyntheticEvent, useState } from 'react';
import { NostrImage, createImgProxyUrl } from '../nostrImageDownload';

interface GridImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  image: NostrImage;
}

const GridImage = ({ image, ...props }: GridImageProps) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      data-node-id={image.noteId}
      onError={(e: SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = '/notfound.png';
      }}
      className={`image ${loaded ? 'show' : ''}`}
      onLoad={() => setLoaded(true)}
      loading="lazy"
      key={image.url}
      src={createImgProxyUrl(image.url)}
      {...props}
    ></img>
  );
};

export default GridImage;
