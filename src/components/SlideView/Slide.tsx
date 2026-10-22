import { useEffect } from 'react';
import SlideImage from './SlideImage';
import SlideVideo from './SlideVideo';
import { ContentType } from '@/utils/useNav';

type SlideProps = {
  url: string;
  paused: boolean;
  type: ContentType;
  onAnimationEnded?: () => void;
  animationDuration?: number;
  noteId: string;
};

const Slide = ({ url, paused, type, noteId, onAnimationEnded, animationDuration = 12 }: SlideProps) => {
  useEffect(() => {
    const handle = setTimeout(() => {
      onAnimationEnded?.();
    }, animationDuration * 1000);
    return () => {
      clearTimeout(handle);
    };
    // Absichtlich nur beim Mount: Der Timer darf bei Parent-Re-Render
    // (neue onAnimationEnded-Identitaet) nicht neu gestartet werden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return type === 'image' ? (
    <SlideImage url={url} noteId={noteId} paused={paused} style={{ animationDuration: `${animationDuration}s` }} />
  ) : (
    <SlideVideo url={url} noteId={noteId} paused={paused} style={{ animationDuration: `${animationDuration}s` }} />
  );
};

export default Slide;
