import { useEffect, useRef, useState } from 'react';
import { NostrImage, urlFix } from '../nostrImageDownload';
import { Settings } from '../../utils/useNav';
import AuthorProfile from '../AuthorProfile/AuthorProfile';
import { Helmet } from 'react-helmet';
import useActiveProfile from '../../utils/useActiveProfile';
import ScrollImage from './ScrollImage';
import { ViewMode } from '../SlideShow';
import { useGlobalState } from '../../utils/globalState';
import IconChevronUp from '../Icons/IconChevronUp';
import InfoPanel from '../InfoPanel/InfoPanel';
import useTitle from '../../utils/useTitle';

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
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // const sortedImages = useMemo(
  //   () => images.sort((a, b) => (b.timestamp && a.timestamp ? b.timestamp - a.timestamp : 0)), // sort by timestamp descending
  //   [images] // settings is not used here, but we need to include it to trigger a re-render when it changes
  // );

  useEffect(() => {
    if (currentImage) {
      console.log('setting hash to #sc' + currentImage);
      window.location.hash = '#sc' + currentImage;
    }
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (currentImage != undefined && images) {
      setState({ activeImage: images[currentImage] });
    } else {
      setState({ activeImage: undefined });
    }
  }, [images, currentImage, setState]);

  const { activeProfile, activeNpub } = useActiveProfile(settings, state.activeImage);
  const title = useTitle(settings, activeProfile);

  const infoPanelAvailable = state.activeImage && (state.activeImage.content || state.activeImage.tags.length > 0);
  // console.log(JSON.stringify([state?.activeImage?.content, state?.activeImage?.tags]));
  return (
    <div ref={containerRef} className="scrollview" tabIndex={0}>
      <Helmet>
        <title>{title}</title>
      </Helmet>

      {images.map((image, idx) => (
        <ScrollImage
          key={image.url}
          image={image}
          index={idx}
          currentImage={currentImage}
          setCurrentImage={setCurrentImage}
        ></ScrollImage>
      ))}

      {!showInfoPanel && activeProfile && (
        <AuthorProfile
          src={urlFix(activeProfile.image || '')}
          author={activeProfile.displayName || activeProfile.name}
          npub={activeNpub}
          setViewMode={setViewMode}
        ></AuthorProfile>
      )}

      {showInfoPanel && state.activeImage ? (
        <InfoPanel
          image={state.activeImage}
          onClose={() => setShowInfoPanel(false)}
          setViewMode={setViewMode}
          settings={settings}
        />
      ) : (
        infoPanelAvailable && (
          <div className="bottom-menu">
            <button onClick={() => setShowInfoPanel(true)}>
              <IconChevronUp />
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default ScrollView;
