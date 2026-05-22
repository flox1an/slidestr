import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { NostrConnectSigner } from 'applesauce-signers';
import { NostrConnectAccount } from 'applesauce-accounts/accounts';
import { useAccountManager } from 'applesauce-react/hooks';
import { saveAccountToStorage, saveActiveAccount, type BunkerPersistData } from '../../nostr/accountPersistence';
import { bytesToHex } from '@noble/hashes/utils';
import { DEFAULT_RELAYS, subscriptionMethod, publishMethod } from '../../nostr/core';
import { appName, publicUrl } from '../env';

function buildBunkerUri(remotePubkey: string, relays: string[], secret?: string): string {
  const params = new URLSearchParams();
  relays.forEach(relay => params.append('relay', relay));
  if (secret) {
    params.append('secret', secret);
  }
  return `bunker://${remotePubkey}?${params.toString()}`;
}

interface QRCodeLoginProps {
  onLogin: () => void;
  onError: (error: string) => void;
}

export function QRCodeLogin({ onLogin, onError }: QRCodeLoginProps) {
  const accountManager = useAccountManager();
  const [nostrConnectUri, setNostrConnectUri] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const signerRef = useRef<NostrConnectSigner | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLoginRef = useRef(onLogin);
  const onErrorRef = useRef(onError);

  // Keep refs updated with latest callbacks
  useLayoutEffect(() => {
    onLoginRef.current = onLogin;
    onErrorRef.current = onError;
  });

  const generateQRCode = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      const signer = new NostrConnectSigner({
        relays: DEFAULT_RELAYS,
        subscriptionMethod,
        publishMethod,
      });
      signerRef.current = signer;

      const uri = signer.getNostrConnectURI({
        name: appName,
        url: publicUrl,
        permissions: NostrConnectSigner.buildSigningPermissions([0, 1, 3, 7, 9734, 10002]),
      });

      setNostrConnectUri(uri);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await signer.waitForSigner(controller.signal);

      const pubkey = await signer.getPublicKey();
      const account = new NostrConnectAccount(pubkey, signer);

      await accountManager.addAccount(account);
      accountManager.setActive(account);

      const remotePubkey = signer.remote;
      if (!remotePubkey) {
        throw new Error('Failed to get remote signer pubkey');
      }
      // Build bunkerUri WITHOUT the secret - secret is single-use for initial pairing only
      // Session persistence relies on the localKey (local signer private key)
      const bunkerUri = buildBunkerUri(remotePubkey, DEFAULT_RELAYS);

      // Save bunker URI and local signer key for session persistence across reloads
      const persistData: BunkerPersistData = {
        bunkerUri,
        localKey: bytesToHex(signer.signer.key),
      };
      saveAccountToStorage(account, 'bunker', JSON.stringify(persistData));
      saveActiveAccount(pubkey);

      onLoginRef.current();
    } catch (error) {
      const isAbort =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          error.message.toLowerCase().includes('aborted') ||
          error.message.toLowerCase().includes('abort'));
      if (isAbort) {
        return;
      }
      console.error('QR code login failed:', error);
      onErrorRef.current(error instanceof Error ? error.message : 'Connection failed');
    }
  }, [accountManager]);

  useEffect(() => {
    generateQRCode();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, [generateQRCode]);

  const handleRefresh = () => {
    setNostrConnectUri(null);
    setCopied(false);
    generateQRCode();
  };

  const handleCopy = async () => {
    if (!nostrConnectUri) return;
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    try {
      await navigator.clipboard.writeText(nostrConnectUri);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="qr-login">
      <div className="qr-login-header">
        <span className="qr-login-icon">📱</span>
        <p>Scan with your Nostr signer app</p>
        <span className="qr-login-apps">Amber, Nostrudel, or other NIP-46 signers</span>
      </div>

      <div className="qr-code-container">
        {nostrConnectUri ? (
          <QRCodeSVG value={nostrConnectUri} size={200} level="M" includeMargin={false} />
        ) : (
          <div className="qr-loading">
            <span className="qr-spinner"></span>
          </div>
        )}
      </div>

      <div className="qr-actions">
        <button onClick={handleCopy} disabled={!nostrConnectUri} className="qr-action-btn">
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
        <button onClick={handleRefresh} className="qr-action-btn">
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}
