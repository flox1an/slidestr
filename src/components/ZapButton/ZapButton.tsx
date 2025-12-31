import { useState, useRef, useCallback } from 'react';
import './ZapButton.css';
import IconBolt from '../Icons/IconBolt';
import { formatSats } from '../../hooks/useZapCount';
import type { ZapState } from '../../utils/useZapAndReaction';

interface ZapButtonProps {
  zapState: ZapState;
  totalSats: number;
  onQuickZap: () => void;
  onOpenModal: () => void;
  disabled?: boolean;
}

const LONG_PRESS_DURATION = 500;

const ZapButton = ({ zapState, totalSats, onQuickZap, onOpenModal, disabled }: ZapButtonProps) => {
  const pressTimer = useRef<ReturnType<typeof setTimeout>>();
  const [isLongPress, setIsLongPress] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsLongPress(false);
    pressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      onOpenModal();
    }, LONG_PRESS_DURATION);
  }, [onOpenModal]);

  const handleMouseUp = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    if (!isLongPress) {
      onQuickZap();
    }
  }, [isLongPress, onQuickZap]);

  const handleMouseLeave = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onOpenModal();
  }, [onOpenModal]);

  return (
    <button
      className={`zap-button ${zapState}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onContextMenu={handleContextMenu}
      disabled={disabled}
    >
      <IconBolt />
      {totalSats > 0 && <span className="sats-count">{formatSats(totalSats)}</span>}
    </button>
  );
};

export default ZapButton;
