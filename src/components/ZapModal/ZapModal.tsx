import { useState, useEffect } from 'react';
import './ZapModal.css';
import { useNWC } from '../../ngine/state';
import CloseButton from '../CloseButton/CloseButton';

interface ZapModalProps {
  onClose: () => void;
  onZap: (amount: number, comment?: string) => Promise<void>;
  onOpenSettings: () => void;
}

const PRESET_AMOUNTS = [21, 100, 500, 1000];

const ZapModal = ({ onClose, onZap, onOpenSettings }: ZapModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState(21);
  const [comment, setComment] = useState('');
  const [isZapping, setIsZapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nwc = useNWC();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleZap = async () => {
    setIsZapping(true);
    setError(null);
    try {
      await onZap(selectedAmount, comment || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zap failed');
    } finally {
      setIsZapping(false);
    }
  };

  return (
    <div className="zap-modal-overlay" onClick={onClose}>
      <div className="zap-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h3>Zap</h3>
        <CloseButton onClick={onClose} />

        <div className="zap-amounts">
          {PRESET_AMOUNTS.map(amount => (
            <button
              key={amount}
              className={`zap-amount-btn ${selectedAmount === amount ? 'selected' : ''}`}
              onClick={() => setSelectedAmount(amount)}
            >
              {amount}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="zap-comment"
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => e.stopPropagation()}
        />

        {!nwc ? (
          <button className="zap-setup-link" onClick={onOpenSettings}>
            Set up wallet to zap
          </button>
        ) : (
          <button
            className="zap-submit-btn"
            onClick={handleZap}
            disabled={isZapping}
          >
            {isZapping ? 'Zapping...' : `Zap ${selectedAmount} sats`}
          </button>
        )}

        {error && <div className="zap-error">{error}</div>}
      </div>
    </div>
  );
};

export default ZapModal;
