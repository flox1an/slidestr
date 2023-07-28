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
      console.log(`newActiveImages = ${JSON.stringify(newActiveImages)}`);
      if (newActiveImages.length > 2) {
        // always keep 2 images
        newActiveImages.shift();
      }

      console.log(`images = ${images.length}`);
      if (images.length > 0) {
        const randomImage = images[Math.floor(Math.random() * images.length)];
        console.log(`randomImage = ${randomImage.url}`);
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
          <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512">
            <path d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z" />
          </svg>
        </div>
      )}

      {loading && (
        <div className="centerSymbol spin">
          <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
            <path d="M256 96c38.4 0 73.7 13.5 101.3 36.1l-32.6 32.6c-4.6 4.6-5.9 11.5-3.5 17.4s8.3 9.9 14.8 9.9H448c8.8 0 16-7.2 16-16V64c0-6.5-3.9-12.3-9.9-14.8s-12.9-1.1-17.4 3.5l-34 34C363.4 52.6 312.1 32 256 32c-10.9 0-21.5 .8-32 2.3V99.2c10.3-2.1 21-3.2 32-3.2zM132.1 154.7l32.6 32.6c4.6 4.6 11.5 5.9 17.4 3.5s9.9-8.3 9.9-14.8V64c0-8.8-7.2-16-16-16H64c-6.5 0-12.3 3.9-14.8 9.9s-1.1 12.9 3.5 17.4l34 34C52.6 148.6 32 199.9 32 256c0 10.9 .8 21.5 2.3 32H99.2c-2.1-10.3-3.2-21-3.2-32c0-38.4 13.5-73.7 36.1-101.3zM477.7 224H412.8c2.1 10.3 3.2 21 3.2 32c0 38.4-13.5 73.7-36.1 101.3l-32.6-32.6c-4.6-4.6-11.5-5.9-17.4-3.5s-9.9 8.3-9.9 14.8V448c0 8.8 7.2 16 16 16H448c6.5 0 12.3-3.9 14.8-9.9s1.1-12.9-3.5-17.4l-34-34C459.4 363.4 480 312.1 480 256c0-10.9-.8-21.5-2.3-32zM256 416c-38.4 0-73.7-13.5-101.3-36.1l32.6-32.6c4.6-4.6 5.9-11.5 3.5-17.4s-8.3-9.9-14.8-9.9H64c-8.8 0-16 7.2-16 16l0 112c0 6.5 3.9 12.3 9.9 14.8s12.9 1.1 17.4-3.5l34-34C148.6 459.4 199.9 480 256 480c10.9 0 21.5-.8 32-2.3V412.8c-10.3 2.1-21 3.2-32 3.2z" />
          </svg>
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
