import { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { NostrImage, createImgProxyUrl, isVideo } from '../nostrImageDownload';
import './ScrollImage.css';
import useOnScreen from '../../utils/useOnScreen';
import IconMicMuted from '../Icons/IconMicMuted';
import IconMicOn from '../Icons/IconMicOn';

interface ScrollImageProps {
  image: NostrImage;
  index: number;
  currentImage: number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
}

const ScrollImage = ({ image, currentImage, setCurrentImage, index }: ScrollImageProps) => {
  const isMobile = typeof screen.orientation !== 'undefined';
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(isMobile);
  const isVisible = useOnScreen(containerRef);
  const nearCurrentImage = useMemo(() => Math.abs((currentImage || 0) - index) < 3, [currentImage, index]);
  const mediaIsVideo = useMemo(() => isVideo(image.url), [image.url]);
  const currentImageProxyUrl = image.url // useMemo(() => createImgProxyUrl(image.url, 800, -1), [image.url]); // TODO only use proxy for smaller displays and mobile

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
      style={nearCurrentImage ? { backgroundImage: `url(${!mediaIsVideo ? currentImageProxyUrl : ''})` } : undefined}
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
