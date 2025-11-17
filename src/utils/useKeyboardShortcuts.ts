import { useEffect } from 'react';
import { ViewMode } from '../components/SlideShow';
import { Settings } from './useNav';

interface UseKeyboardShortcutsProps {
  showSettings: boolean;
  setViewMode: (mode: ViewMode) => void;
  setShowSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
  nav: (settings: Settings) => void;
  settings: Settings;
}

/**
 * Custom hook to handle keyboard shortcuts for the slideshow
 */
export default function useKeyboardShortcuts({
  showSettings,
  setViewMode,
  setShowSettings,
  nav,
  settings,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (showSettings) return;

      if (event.key === 'Escape') {
        setViewMode('grid');
        setShowSettings(false);
      }
      if (event.key.toLowerCase() === 'g') {
        setViewMode('grid');
      }
      if (event.key.toLowerCase() === 'h') {
        nav({ ...settings, npubs: [], list: undefined, topic: undefined, tags: [], follows: false });
      }
      if (event.key.toLowerCase() === 'x') {
        setViewMode('scroll');
      }
      if (event.key.toLowerCase() === 's') {
        setShowSettings(s => !s);
      }
    };

    document.body.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.removeEventListener('keydown', onKeyDown);
    };
  }, [showSettings, setViewMode, setShowSettings, nav, settings]);
}
