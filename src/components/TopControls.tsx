import React from 'react';
import { ViewMode } from './SlideShow';
import { Settings } from '../utils/useNav';

interface TopControlsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onNavigateHome: () => void;
}

/**
 * Top control buttons (back/close button)
 */
const TopControls: React.FC<TopControlsProps> = ({ viewMode, setViewMode, onNavigateHome }) => {
  return (
    <div className="top-left-controls">
      <a
        className="back-button"
        onClick={() => {
          if (viewMode == 'scroll' || viewMode == 'slideshow') {
            setViewMode('grid');
          } else {
            onNavigateHome();
          }
        }}
      >
        ✕
      </a>
    </div>
  );
};

export default TopControls;
