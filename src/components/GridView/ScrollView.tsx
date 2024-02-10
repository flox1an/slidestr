import { useEffect, useMemo, useRef } from 'react';
import { NostrImage, urlFix } from '../nostrImageDownload';
import { Settings } from '../../utils/useNav';
import AuthorProfile from '../AuthorProfile';
import { Helmet } from 'react-helmet';
import useProfile from '../../utils/useProfile';
import ScrollImage from './ScrollImage';
import { ViewMode } from '../SlideShow';
import { useGlobalState } from '../../utils/globalState';

type ScrollViewProps = {
  settings: Settings;
  images: NostrImage[];
  currentImage: number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
  setViewMode: (viewMode: ViewMode) => void;
};

const ScrollView = ({ settings, images, currentImage, setCurrentImage, setViewMode }: ScrollViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useGlobalState();
  const sortedImages = useMemo(
    () => images.sort((a, b) => (b.timestamp && a.timestamp ? b.timestamp - a.timestamp : 0)), // sort by timestamp descending
    [images] // settings is not used here, but we need to include it to trigger a re-render when it changes
  );

  useEffect(() => {
    if (currentImage) {
      console.log('setting hash to #sc' + currentImage);
      window.location.hash = '#sc' + currentImage;
    }
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (currentImage && sortedImages) {
      setState({ activeImage: sortedImages[currentImage] });
    } else {
      setState({ activeImage: undefined });
    }
  }, [sortedImages, currentImage, setState]);

  const { activeProfile, profileNpub, title } = useProfile(settings, state.activeImage);

  console.log(JSON.stringify(activeProfile));
  return (
    <div ref={containerRef} className="scrollview" tabIndex={0}>
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
          npub={profileNpub}
          setViewMode={setViewMode}
        ></AuthorProfile>
      )}
    </div>
  );
};

export default ScrollView;