import { RefObject, useEffect, useMemo, useState } from 'react';

export default function useOnScreen(ref: RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);
  const options: IntersectionObserverInit = {
    threshold: 0.7,
  };
  const observer = useMemo(
    () => new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), options),
    [ref]
  );

  useEffect(() => {
    if (ref.current != null) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [observer, ref]);

  return isIntersecting;
}
