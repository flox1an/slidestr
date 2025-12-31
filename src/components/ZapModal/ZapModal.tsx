import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './ZapModal.css';
import { useNWC } from '../../ngine/state';
import CloseButton from '../CloseButton/CloseButton';

interface ZapModalProps {
  onClose: () => void;
  onZap: (amount: number, comment?: string) => Promise<void>;
  onGenerateInvoice?: (amount: number, comment?: string) => Promise<string | null>;
  onOpenSettings: () => void;
}

const PRESET_AMOUNTS = [21, 100, 500, 1000];

const ZapModal = ({ onClose, onZap, onGenerateInvoice, onOpenSettings }: ZapModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState(21);
  const [comment, setComment] = useState('');
  const [isZapping, setIsZapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
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

  const handleGenerateQR = async () => {
    if (!onGenerateInvoice) return;
    setIsZapping(true);
    setError(null);
    try {
      const inv = await onGenerateInvoice(selectedAmount, comment || undefined);
      if (inv) {
        setInvoice(inv);
      } else {
        setError('Failed to generate invoice');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice');
    } finally {
      setIsZapping(false);
    }
  };

  const copyInvoice = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice);
    }
  };

  return (
    <div className="zap-modal-overlay" onClick={onClose}>
      <div className="zap-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose} />

        {invoice ? (
          <>
            <h3>Scan to Zap</h3>
            <div className="qr-container">
              <QRCodeSVG value={invoice.toUpperCase()} size={200} />
            </div>
            <p className="qr-hint">Scan with your Lightning wallet</p>
            <button className="zap-copy-btn" onClick={copyInvoice}>
              Copy Invoice
            </button>
          </>
        ) : (
          <>
            <h3>Zap</h3>
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

            {nwc ? (
              <button
                className="zap-submit-btn"
                onClick={handleZap}
                disabled={isZapping}
              >
                {isZapping ? 'Zapping...' : `Zap ${selectedAmount} sats`}
              </button>
            ) : onGenerateInvoice ? (
              <button
                className="zap-submit-btn"
                onClick={handleGenerateQR}
                disabled={isZapping}
              >
                {isZapping ? 'Generating...' : `Show QR for ${selectedAmount} sats`}
              </button>
            ) : (
              <button className="zap-setup-link" onClick={onOpenSettings}>
                Set up wallet to zap
              </button>
            )}
          </>
        )}

        {error && <div className="zap-error">{error}</div>}
      </div>
    </div>
  );
};

export default ZapModal;
