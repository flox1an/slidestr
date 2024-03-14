import React from 'react';
import { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { NostrImage, createImgProxyUrl, isVideo } from '../nostrImageDownload';
import './ScrollImage.css';
import useOnScreen from '../../utils/useOnScreen';
import IconMicMuted from '../Icons/IconMicMuted';
import IconMicOn from '../Icons/IconMicOn';
import useWindowSize from '../../utils/useWindowSize';

interface ScrollImageProps {
  image: NostrImage;
  index: number;
  currentImage: number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
}

const ScrollImage = ({ image, currentImage, setCurrentImage, index }: ScrollImageProps) => {
  const { width } = useWindowSize();
  const isMobile = useMemo(() => width && width <= 768, [width]);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(isMobile ? true : false);
  const isVisible = useOnScreen(containerRef);
  const nearCurrentImage = useMemo(() => Math.abs((currentImage || 0) - index) < 3, [currentImage, index]);
  const mediaIsVideo = useMemo(() => isVideo(image.url), [image.url]);

  const imageProxyUrl320 = useMemo(() => createImgProxyUrl(image.url, 320, -1), [image.url]);

  const currentImageProxyUrl = useMemo(() => {
    const imageProxyUrl800 = createImgProxyUrl(image.url, 800, -1);
    const imageProxyUrl1920 = createImgProxyUrl(image.url, 1920, -1);

    return width == undefined
      ? imageProxyUrl320
      : width < 800
        ? imageProxyUrl320
        : width < 1920
          ? imageProxyUrl800
          : imageProxyUrl1920;
  }, [image.url, imageProxyUrl320, width]);

  const blurBgUrl = useMemo(() => {
    if (mediaIsVideo) return '';

    if (isMobile) {
      // On mobile use the 200x200 grid image
      return createImgProxyUrl(image.url, 200, 200);
    } else {
      // on Desktop use the 320x masonry image
      return imageProxyUrl320;
    }
  }, [image.url, imageProxyUrl320, isMobile, mediaIsVideo]);

  /*
  const toggleVideoPause = (video: HTMLVideoElement | null) => {
    if (!video) return;
    setMuted(false);
    video.muted = false;
    video.paused ? video.play() : video.pause();
  };
  */

  const toggleMute = (video: HTMLVideoElement | null) => {
    if (!video) return;

    setMuted(before => {
      video.muted = !before;
      return !before;
    });
  };

  useEffect(() => {
    if (isVisible) {
      setCurrentImage(index);

      if (mediaIsVideo) {
        if (!videoRef.current) {
          console.error("VideoRef is null. couldn't play video");
        } else {
          videoRef.current
            .play()
            .then(() => console.log(`started playing video ${index}`))
            .catch(e => console.error(`error playing video ${index}`, e));
        }
      }
    } else {
      videoRef.current?.pause();
    }
  }, [isVisible, videoRef, index, currentImage, setCurrentImage, mediaIsVideo]);

  return (
    <div
      ref={containerRef}
      id={'sc' + index}
      className="scroll-content"
      style={nearCurrentImage ? { backgroundImage: `url(${blurBgUrl})` } : undefined}
    >
      {nearCurrentImage &&
        (mediaIsVideo ? (
          <video
            ref={videoRef}
            className={`image`}
            data-node-id={image.noteId}
            key={image.url}
            autoPlay={false}
            loop
            /* onClick={() => toggleVideoPause(videoRef.current)} */
            onClick={() => toggleMute(videoRef.current)}
            src={image.url + '#t=0.1'}
            playsInline
            muted={muted}
            preload="auto"
            onCanPlay={() => {
              if (isVisible) videoRef.current?.play();
            }}
          ></video>
        ) : (
          <img
            referrerPolicy="no-referrer"
            data-node-id={image.noteId}
            onError={(e: SyntheticEvent<HTMLImageElement>) => {
              console.log('not found: ', e.currentTarget.src);
              e.currentTarget.src = '/notfound.png';
            }}
            className={`image`}
            loading="lazy"
            key={image.url}
            src={currentImageProxyUrl}
          ></img>
        ))}
      {isVisible && mediaIsVideo && (
        <div className="left-bottom-menu">
          <button onClick={() => toggleMute(videoRef.current)}>{muted ? <IconMicMuted /> : <IconMicOn />}</button>
        </div>
      )}
    </div>
  );
};

export default ScrollImage;
