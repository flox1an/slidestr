import { ReactNode, useEffect, useRef, useState } from 'react';

type LazyLoadProps = {
  children: ReactNode;
  className?: string;
  height?: number;
};

const LazyLoad = ({ children, className, height }: LazyLoadProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={ref} className={className} style={height ? { minHeight: height } : undefined}>
      {isVisible ? children : null}
    </div>
  );
};

export default LazyLoad;
