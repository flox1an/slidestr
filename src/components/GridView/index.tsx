import { useCallback, useEffect, useState } from 'react';
import { NostrImage } from '../nostrImageDownload';
import './GridView.css';
import GridImage from './GridImage';
import useNav, { Settings } from '../../utils/useNav';
import { useSwipeable } from 'react-swipeable';
import useActiveProfile from '../../utils/useActiveProfile';
import { ViewMode } from '../SlideShow';
import { useGlobalState } from '../../utils/globalState';
import useTitle from '../../utils/useTitle';
import PageHeader from '../PageHeader/PageHeader';

type GridViewProps = {
  settings: Settings;
  images: NostrImage[];
  currentImage: number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
};

const GridView = ({ settings, images, currentImage, setCurrentImage, setViewMode }: GridViewProps) => {
  const { activeProfile } = useActiveProfile(settings);
  useTitle(settings, activeProfile);
  const [_, setState] = useGlobalState();
  const showNextImage = useCallback(() => {
    setCurrentImage(idx => (idx !== undefined ? idx + 1 : 0));
  }, [setCurrentImage]);
  const { nav, currentSettings } = useNav();
  const [searchText, setSearchText] = useState<string | undefined>(undefined);

  const showPreviousImage = useCallback(() => {
    setCurrentImage(idx => (idx !== undefined && idx > 0 ? idx - 1 : idx));
  }, [setCurrentImage]);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return; // Do not handle key events if focused on an input or textarea
    }

    if (event.key === 'ArrowRight') {
      showNextImage();
    }
    if (event.key === 'ArrowLeft') {
      showPreviousImage();
    }
    if (event.key === 'Escape') {
      nav({
        ...currentSettings,
        topic: undefined,
        npubs: [],
        tags: [],
        list: undefined,
      });
    }
  }, [nav, currentSettings, showNextImage, showPreviousImage]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      showNextImage();
    },
    onSwipedRight: () => {
      showPreviousImage();
    },
  });

  useEffect(() => {
    document.body.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  useEffect(() => {
    setState({ activeImage: undefined });

    if (currentImage) {
      console.log('setting hash to #g' + currentImage);
      window.location.hash = '#g' + currentImage;
    }
    // Absichtlich nur beim Mount: Hash-Normalisierung und Global-State-Reset
    // gehoeren in die Initialisierung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="gridview" {...swipeHandlers}>
      <PageHeader
        setViewMode={setViewMode}
        searchText={searchText}
        setSearchText={setSearchText}
        settings={settings}
      ></PageHeader>

      <div className="imagegrid">
        {images.map((image, idx) => (
          <GridImage
            index={idx}
            key={image.url}
            image={image}
            onClick={e => {
              e.stopPropagation();
              setCurrentImage(idx);
              setViewMode('scroll');
            }}
          ></GridImage>
        ))}
      </div>
    </div>
  );
};

export default GridView;
