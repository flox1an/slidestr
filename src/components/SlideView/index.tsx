import { MutableRefObject, useEffect, useRef, useState } from 'react';
import AuthorProfile from '../AuthorProfile/AuthorProfile';
import Slide from './Slide';
import { NostrImage, urlFix } from '../nostrImageDownload';
import useDebouncedEffect from '../../utils/useDebouncedEffect';
import { useSwipeable } from 'react-swipeable';
import { Helmet } from 'react-helmet';
import IconPause from '../Icons/IconPause';
import IconSpinner from '../Icons/IconSpinner';
import { Settings } from '../../utils/useNav';
import useProfile from '../../utils/useProfile';
import { ViewMode } from '../SlideShow';

type SlideViewProps = {
  settings: Settings;
  images: MutableRefObject<NostrImage[]>;
  setViewMode: (viewMode: ViewMode) => void;
};

const SlideView = ({ settings, images, setViewMode }: SlideViewProps) => {
  const [activeImages, setActiveImages] = useState<NostrImage[]>([]);
  const history = useRef<NostrImage[]>([]);
  const [paused, setPaused] = useState(false);
  const upcomingImage = useRef<NostrImage>();
  const [loading, setLoading] = useState(true);
  const viewTimeoutHandle = useRef<NodeJS.Timeout>();
  const [activeNpub, setActiveNpub] = useState<string | undefined>(undefined);
  const [slideShowStarted, setSlideShowStarted] = useState(false);
  const [activeContent, setActiveContent] = useState<string | undefined>(undefined);
  const { activeProfile, title } = useProfile(settings);

  const queueNextImage = (waitTime: number) => {
    clearTimeout(viewTimeoutHandle.current);
    viewTimeoutHandle.current = setTimeout(() => {
      if (!paused) {
        setLoading(false);
        animateImages();
        queueNextImage(8000);
      }
    }, waitTime);
  };

  const nextImage = () => {
    setPaused(false);
    setActiveImages([]);
    queueNextImage(0);
  };

  const previousImage = () => {
    setPaused(false);

    if (history.current.length > 1) {
      const previousImage = history.current.pop(); // remove current image
      previousImage && images.current.push(previousImage); // add current image back to the pool
      const lastImage = history.current[history.current.length - 1]; // show preview image but leave in the history
      if (lastImage) {
        setActiveImages([lastImage]);
        upcomingImage.current = lastImage;
        queueNextImage(8000); // queue next image for 8s after showing this one
      }
    }
  };


  


  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => nextImage(),
    onSwipedRight: () => previousImage(),
  });

  const animateImages = () => {
    console.log(`animateImages ${images.current.length}`);

    setActiveImages(activeImages => {
      const newActiveImages = [...activeImages];
      //console.log(`newActiveImages = ${JSON.stringify(newActiveImages)}`);
      if (newActiveImages.length > 2) {
        // always keep 2 images
        newActiveImages.shift();
      }

      if (images.current.length > 0) {
        const randomImage = images.current[Math.floor(Math.random() * images.current.length)];
        //  console.log(`randomImage = ${randomImage.url}`);
        // TODO this creates potential duplicates when images are loaded from multiple relays
        images.current = images.current.filter(i => i !== randomImage);

        history.current.push(randomImage);
        newActiveImages.push(randomImage);
        upcomingImage.current = randomImage;
      }
      return newActiveImages;
    });
  };

  useEffect(() => {
    // console.log(`slideShowStarted = ${slideShowStarted}, images = ${images.current.length}`);

    // Make sure we have an image to start with but only trigger once
    if (!slideShowStarted && images.current.length > 2) {
      setSlideShowStarted(true);
      queueNextImage(100);
    }
  }, [images.current.length]);

  const onKeyDown = (event: KeyboardEvent) => {
    // console.log(event);
    if (event.key === 'ArrowRight') {
      nextImage();
    }
    if (event.key === 'ArrowLeft') {
      previousImage();
    }
    if (event.key === 'p' || event.key === ' ' || event.key === 'P') {
      setPaused(p => !p);
      event.stopPropagation();
    }
  };

  useEffect(() => {
    document.body.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.removeEventListener('keydown', onKeyDown);
      console.log(`cleaning timeout in useEffect[] destructor `);
      clearTimeout(viewTimeoutHandle.current);
    };
  }, []);

  useDebouncedEffect(
    () => {
      setActiveNpub(upcomingImage?.current?.author);
      setActiveContent(upcomingImage?.current?.content);
    },
    [upcomingImage?.current],
    2000
  );

  useEffect(() => {
    setPaused(false);
    setSlideShowStarted(false);
    setActiveImages([]);
    history.current = [];
    upcomingImage.current = undefined;

    console.log(`cleaning timeout in useEffect[settings] `);
    //clearTimeout(viewTimeoutHandle.current);
  }, [settings]);

  return (
    <div {...swipeHandlers} onClick={() => setPaused(p => !p)} style={{ overflow: 'hidden' }}>
      <Helmet>
        <title>{title}</title>
      </Helmet>

      {paused && (
        <div className="centerSymbol">
          <IconPause />
        </div>
      )}

      {loading && (
        <div className="centerSymbol spin">
          <IconSpinner />
        </div>
      )}

      {activeContent && (
        <div className="bottomPanel show">
          <div className="caption">{activeContent}</div>
        </div>
      )}
      {activeProfile && (
        <AuthorProfile
          setViewMode={setViewMode}
          src={urlFix(activeProfile.image || '')}
          author={activeProfile.displayName || activeProfile.name}
          npub={activeNpub}
        ></AuthorProfile>
      )}

      {activeImages.map(image => (
        <Slide key={image.url} noteId={image.noteId} url={image.url} paused={paused} type={image.type} />
      ))}
    </div>
  );
};

export default SlideView;
