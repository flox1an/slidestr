import { useEffect, useState } from "react";

const useImageLoaded = (src?: string) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      return;
    }
    setLoaded(false);

    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;

    return () => {
      // unregister event callback when component unmount
      img.onload = null;
    };
  }, [src]);

  return loaded;
};

export default useImageLoaded;
