import { useLocation, useNavigationType } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import type { PageTransitionProps } from './PageTransition.types';
import './PageTransition.css';

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'back' | 'fade'>('fade');
  const prevPathname = useRef(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (prevPathname.current !== location.pathname) {
      if (navigationType === 'POP') {
        setTransitionDirection('back');
      } else if (navigationType === 'PUSH') {
        setTransitionDirection('forward');
      } else {
        setTransitionDirection('fade');
      }
      prevPathname.current = location.pathname;
    }
  }, [location.pathname, navigationType]);

  return (
    <div
      key={location.pathname}
      className={`page-transition-container page-transition-${transitionDirection}`}
    >
      {children}
    </div>
  );
}
