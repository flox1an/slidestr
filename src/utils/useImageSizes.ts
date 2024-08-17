import { createImgProxyUrl } from '../components/nostrImageDownload';
import useWindowSize from './useWindowSize';
import { useMemo } from 'react';

const useImageSizes = (imageUrl: string) => {
  const { width } = useWindowSize();

  const imageUrl320w = useMemo(() => createImgProxyUrl(imageUrl, 320, -1), [imageUrl]);
  const imageUrl800w = useMemo(() => createImgProxyUrl(imageUrl, 800, -1), [imageUrl]);
  const imageUrl1920w = useMemo(() => createImgProxyUrl(imageUrl, 1920, -1), [imageUrl]);

  const optimalImageUrl = useMemo(() => {
    return width == undefined
      ? imageUrl320w
      : width <= 640
        ? imageUrl320w
        : width < 1500
          ? imageUrl800w
          : imageUrl1920w;
  }, [width, imageUrl320w, imageUrl800w, imageUrl1920w]);

  return {
    optimalImageUrl,
    imageUrl320w,
    imageUrl800w,
    imageUrl1920w,
  };
};

export default useImageSizes;
