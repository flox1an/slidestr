import { useEffect, useRef, useState } from 'react';
import AuthorProfile from '../AuthorProfile';
import Slide from './Slide';
import { NostrImage, urlFix } from '../nostrImageDownload';
import { appName } from '../env';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import useDebouncedEffect from '../../utils/useDebouncedEffect';
import { useSwipeable } from 'react-swipeable';
import { Helmet } from 'react-helmet';
import Settings from '../Settings';
import IconPause from '../Icons/IconPause';
import IconSpinner from '../Icons/IconSpinner';

type SlideViewProps = {
  settings: Settings;
  images: NostrImage[];
};

const SlideView = ({ settings, images }: SlideViewProps) => {
  const { getProfile } = useNDK();
  const [activeImages, setActiveImages] = useState<NostrImage[]>([]);
  const history = useRef<NostrImage[]>([]);
  const [paused, setPaused] = useState(false);
  const upcommingImage = useRef<NostrImage>();
  const [loading, setLoading] = useState(true);
  const viewTimeoutHandle = useRef(0);
  const [title, setTitle] = useState(appName);
  const [activeNpub, setActiveNpub] = useState<string | undefined>(undefined);
  const [slideShowStarted, setSlideShowStarted] = useState(false);
  const [activeContent, setActiveContent] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (settings.tags && settings.tags.length > 0) {
      setTitle('#' + settings.tags.join(' #') + ` | ${appName}`);
    } else {
      setTitle(`Random photos from popular hashtags | ${appName}`);
    }
  }, [settings]);

  const queueNextImage = (waitTime: number) => {
    console.log(`cleaining timeout in queueNextImage`);
    clearTimeout(viewTimeoutHandle.current);
    viewTimeoutHandle.current = setTimeout(() => {
      if (!paused) {
        console.log(`queueNextImage: setting loading to false`);
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

    console.log(history);

    if (history.current.length > 1) {
      const previousImage = history.current.pop(); // remove current image
      previousImage && images.push(previousImage); // add current image back to the pool
      const lastImage = history.current[history.current.length - 1]; // show preview image but leave in the history
      if (lastImage) {
        setActiveImages([lastImage]);
        upcommingImage.current = lastImage;
        queueNextImage(8000); // queue next image for 8s after showing this one
      }
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => nextImage(),
    onSwipedRight: () => previousImage(),
  });

  const animateImages = () => {
    console.log(`animateImages ${images.length}`);

    setActiveImages(activeImages => {
      const newActiveImages = [...activeImages];
      //console.log(`newActiveImages = ${JSON.stringify(newActiveImages)}`);
      if (newActiveImages.length > 2) {
        // always keep 2 images
        newActiveImages.shift();
      }

      //console.log(`images = ${images.length}`);
      if (images.length > 0) {
        const randomImage = images[Math.floor(Math.random() * images.length)];
        //  console.log(`randomImage = ${randomImage.url}`);
        // TODO this creates potential duplicates when images are loaded from multiple relays
        images = images.filter(i => i !== randomImage);

        history.current.push(randomImage);
        newActiveImages.push(randomImage);
        upcommingImage.current = randomImage;
      }
      return newActiveImages;
    });
  };

  useEffect(() => {
    console.log(`slideShowStarted = ${slideShowStarted}, images = ${images.length}`);
    // Make sure we have an image to start with but only trigger once
    if (!slideShowStarted && images.length > 2) {
      setSlideShowStarted(true);
      console.log('******* queueNextImage');
      queueNextImage(10);
    }
  }, [images]);

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
    }
  };

  useEffect(() => {
    document.body.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      console.log(`cleaining timeout in useEffect[] destructor `);
      clearTimeout(viewTimeoutHandle.current);
    };
  }, []);

  useDebouncedEffect(
    () => {
      setActiveNpub(upcommingImage?.current?.author);
      setActiveContent(upcommingImage?.current?.content);
    },
    [upcommingImage?.current],
    2000
  );

  useEffect(() => {
    setPaused(false);
    setSlideShowStarted(false);
    setActiveImages([]);
    history.current = [];
    upcommingImage.current = undefined;

    console.log(`cleaining timeout in useEffect[settings] `);
    //clearTimeout(viewTimeoutHandle.current);
  }, [settings]);

  const activeProfile = activeNpub && getProfile(activeNpub);

  useEffect(() => {
    if (settings.npubs.length > 0 && activeProfile && (activeProfile.displayName || activeProfile.name)) {
      setTitle(activeProfile.displayName || activeProfile.name + ` | ${appName}`);
    }
  }, [activeProfile]);

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
