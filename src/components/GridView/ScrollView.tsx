import { useEffect, useMemo } from 'react';
import { NostrImage, urlFix } from '../nostrImageDownload';
import { Settings } from '../../utils/useNav';
import AuthorProfile from '../AuthorProfile';
import { Helmet } from 'react-helmet';
import useProfile from '../../utils/useProfile';
import ScrollImage from './ScrollImage';

type ScrollViewProps = {
  settings: Settings;
  images: NostrImage[];
  currentImage: number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
};

const ScrollView = ({ settings, images, currentImage, setCurrentImage }: ScrollViewProps) => {
  const { activeProfile, title } = useProfile(settings);

  const sortedImages = useMemo(
    () => images.sort((a, b) => (b.timestamp && a.timestamp ? b.timestamp - a.timestamp : 0)), // sort by timestamp descending
    [images] // settings is not used here, but we need to include it to trigger a re-render when it changes
  );

  console.log('activeElement ' + document.activeElement);

  useEffect(() => {
    if (currentImage) {
      console.log('setting hash to #sc' + currentImage);
      window.location.hash = '#sc' + currentImage;
    }
  }, []);

  return (
    <div className="scrollview" tabIndex={0}>
      <Helmet>
        <title>{title}</title>
      </Helmet>
     
      {sortedImages.map((image, idx) => (
        <ScrollImage
          key={image.url}
          image={image}
          index={idx}
          currentImage={currentImage}
          setCurrentImage={setCurrentImage}
        ></ScrollImage>
      ))}

      {activeProfile && (
        <AuthorProfile
          src={urlFix(activeProfile.image || '')}
          author={activeProfile.displayName || activeProfile.name}
          npub={activeProfile.npub}
        ></AuthorProfile>
      )}
    </div>
  );
};

export default ScrollView;
