import { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { NostrImage, createImgProxyUrl, isVideo } from '../nostrImageDownload';
import './ScrollImage.css';
import useOnScreen from '../../utils/useOnScreen';

interface ScrollImageProps {
  image: NostrImage;
  index: number;
  currentImage:  number | undefined;
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
  const currentImageProxyUrl = useMemo(() => createImgProxyUrl(image.url, 800, -1), [image.url]);

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
      style={
        nearCurrentImage
          ? { backgroundImage: `url(${!mediaIsVideo ? currentImageProxyUrl : ''})` }
          : { background: 'red' }
      }
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
          <button onClick={() => toggleMute(videoRef.current)}>
            {muted ? (
              <svg viewBox="0 0 36 36" fill="currentColor">
                <g fill="currentColor">
                  <path
                    fill="currentColor"
                    d="M3.61 6.41L9.19 12H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5.14l7.41 7.47A2 2 0 0 0 18 32a2 2 0 0 0 .76-.15A2 2 0 0 0 20 30v-7.23l5.89 5.89c-.25.15-.49.29-.75.42a1 1 0 0 0 .9 1.79a14.4 14.4 0 0 0 1.31-.75l2.28 2.28L31 31L5 5ZM18 30l-7.73-7.77a1 1 0 0 0-.71-.23H4v-8h5.64a1 1 0 0 0 .71-.3l.26-.26L18 20.81Z"
                  />
                  <path
                    fill="currentColor"
                    d="M24.89 6.69A12.42 12.42 0 0 1 29 26.1l1.42 1.42a14.42 14.42 0 0 0-4.66-22.64a1 1 0 1 0-.87 1.8Z"
                  />
                  <path
                    fill="currentColor"
                    d="M22.69 12.62A6.27 6.27 0 0 1 25.8 18a6.17 6.17 0 0 1-1.24 3.71L26 23.13A8.15 8.15 0 0 0 27.8 18a8.28 8.28 0 0 0-4.1-7.11a1 1 0 1 0-1 1.73Z"
                  />
                  <path fill="currentColor" d="M18 6v9.15l2 2V6a2 2 0 0 0-3.42-1.41L12 9.17l1.41 1.41Z" />
                  <path fill="none" d="M0 0h36v36H0z" />
                </g>
              </svg>
            ) : (
              <svg viewBox="0 0 36 36" fill="currentColor">
                <g fill="currentColor">
                  <path
                    fill="currentColor"
                    d="M23.41 25.25a1 1 0 0 1-.54-1.85a6.21 6.21 0 0 0-.19-10.65a1 1 0 1 1 1-1.73a8.21 8.21 0 0 1 .24 14.06a1 1 0 0 1-.51.17Z"
                  />
                  <path
                    fill="currentColor"
                    d="M25.62 31.18a1 1 0 0 1-.45-1.89A12.44 12.44 0 0 0 25 6.89a1 1 0 1 1 .87-1.8a14.44 14.44 0 0 1 .24 26a1 1 0 0 1-.49.09Z"
                  />
                  <path
                    fill="currentColor"
                    d="M18 32.06a2 2 0 0 1-1.42-.59L9.14 24H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h5.22l7.33-7.39A2 2 0 0 1 20 6v24a2 2 0 0 1-1.24 1.85a2 2 0 0 1-.76.21ZM4 14v8h5.56a1 1 0 0 1 .71.3L18 30.06V6l-7.65 7.7a1 1 0 0 1-.71.3Zm14-8Z"
                  />
                  <path fill="none" d="M0 0h36v36H0z" />
                </g>
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ScrollImage;
