import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './ZapModal.css';
import { useNWC } from '../../state/atoms';
import CloseButton from '../CloseButton/CloseButton';
import { relayPool, DEFAULT_RELAYS } from '../../nostr/core';

interface ZapModalProps {
  onClose: () => void;
  onZap: (amount: number, comment?: string) => Promise<void>;
  onGenerateInvoice?: (amount: number, comment?: string) => Promise<string | null>;
  onOpenSettings: () => void;
  eventId?: string;
  userPubkey?: string;
}

const PRESET_AMOUNTS = [21, 100, 500, 1000];

const ZapModal = ({ onClose, onZap, onGenerateInvoice, onOpenSettings, eventId, userPubkey }: ZapModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState(21);
  const [comment, setComment] = useState('');
  const [isZapping, setIsZapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const nwc = useNWC();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Subscribe to zap receipts when QR code is shown
  useEffect(() => {
    if (!invoice || !eventId || !userPubkey) return;

    const sub = relayPool
      .subscription(DEFAULT_RELAYS, [{ kinds: [9735], '#e': [eventId] }])
      .subscribe({
        next: (event) => {
          if (typeof event === 'string') return;
          // Parse the description tag to find our zap request
          const descTag = event.tags.find((t: string[]) => t[0] === 'description');
          if (descTag && descTag[1]) {
            try {
              const zapRequest = JSON.parse(descTag[1]);
              if (zapRequest.pubkey === userPubkey) {
                setPaymentReceived(true);
              }
            } catch {
              // Invalid JSON in description tag
            }
          }
        },
      });

    return () => sub.unsubscribe();
  }, [invoice, eventId, userPubkey]);

  // Close modal after payment is received (with brief delay to show success)
  useEffect(() => {
    if (paymentReceived) {
      const timeout = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [paymentReceived, onClose]);

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
          paymentReceived ? (
            <>
              <h3>Payment Received!</h3>
              <div className="qr-container payment-success">
                <span className="success-icon">⚡</span>
              </div>
            </>
          ) : (
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
          )
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
