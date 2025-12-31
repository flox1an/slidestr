import { useRef, useCallback, useEffect } from 'react';
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
  const isLongPressRef = useRef(false);

  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
    };
  }, []);

  const handleMouseDown = useCallback(() => {
    isLongPressRef.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPressRef.current = true;
      onOpenModal();
    }, LONG_PRESS_DURATION);
  }, [onOpenModal]);

  const handleMouseUp = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    if (!isLongPressRef.current) {
      onQuickZap();
    }
  }, [onQuickZap]);

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
      aria-label="Zap"
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
