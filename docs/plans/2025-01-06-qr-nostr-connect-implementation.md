# QR Nostr Connect Login Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current login modal with QR code-based nostr connect (NIP-46) as primary login method.

**Architecture:** Create a QRCodeLogin component that generates a `nostrconnect://` URI, displays it as a QR code, and waits for a remote signer to connect. The existing account persistence and session management infrastructure will be reused.

**Tech Stack:** React, applesauce-signers (NostrConnectSigner), qrcode.react (QRCodeSVG), existing relay pool from core.ts

---

### Task 1: Create QRCodeLogin Component

**Files:**
- Create: `src/components/Login/QRCodeLogin.tsx`

**Step 1: Create the QRCodeLogin component**

```tsx
import { useEffect, useState, useRef, useCallback, useContext } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { NostrConnectSigner } from 'applesauce-signers';
import { NostrConnectAccount } from 'applesauce-accounts/accounts';
import { AccountsContext } from 'applesauce-react';
import { saveAccountToStorage, saveActiveAccount } from '../../nostr/accountPersistence';
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
  const accountManager = useContext(AccountsContext);
  const [nostrConnectUri, setNostrConnectUri] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const signerRef = useRef<NostrConnectSigner | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!accountManager) {
    throw new Error('QRCodeLogin must be used within AccountsProvider');
  }

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
      const bunkerUri = buildBunkerUri(remotePubkey, DEFAULT_RELAYS, signer.secret);

      saveAccountToStorage(account, 'bunker', bunkerUri);
      saveActiveAccount(pubkey);

      onLogin();
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
      onError(error instanceof Error ? error.message : 'Connection failed');
    }
  }, [accountManager, onLogin, onError]);

  useEffect(() => {
    generateQRCode();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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
    try {
      await navigator.clipboard.writeText(nostrConnectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
```

**Step 2: Verify the file was created correctly**

Run: `cat src/components/Login/QRCodeLogin.tsx | head -20`
Expected: File header with imports visible

**Step 3: Commit**

```bash
git add src/components/Login/QRCodeLogin.tsx
git commit -m "feat(login): add QRCodeLogin component for NIP-46 nostr connect"
```

---

### Task 2: Update Login Component

**Files:**
- Modify: `src/components/Login/Login.tsx`

**Step 1: Replace the Login component implementation**

```tsx
import { useState } from 'react';
import './Login.css';
import { useExtensionLogin } from '../../context/NgineContext';
import { QRCodeLogin } from './QRCodeLogin';
import { useAtom } from 'jotai';
import { sessionAtom } from '../../state/atoms';
import { syncUserRelays } from '../../nostr/relays';

type LoginProps = {
  onClose: () => void;
};

const Login = ({ onClose }: LoginProps) => {
  const extensionLogin = useExtensionLogin();
  const [, setSession] = useAtom(sessionAtom);
  const [error, setError] = useState<string | null>(null);

  const handleQRLogin = () => {
    // QRCodeLogin handles account creation and persistence
    // We need to update the session atom
    // The account is already set as active by QRCodeLogin
    // We can get the pubkey from the account manager, but simpler to just close
    // and let AccountRestoreInit handle session sync on next render
    onClose();
  };

  const handleQRError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const loginWithExtension = async () => {
    setError(null);
    const pubkey = await extensionLogin();
    if (pubkey) {
      onClose();
    } else {
      setError('Extension login failed');
    }
  };

  return (
    <div className="login-dialog">
      <div className="close-button" onClick={() => onClose()}>
        ✕
      </div>
      <h2>Login</h2>

      {error && <div className="login-error">{error}</div>}

      <QRCodeLogin onLogin={handleQRLogin} onError={handleQRError} />

      <div className="login-divider">
        <span>or</span>
      </div>

      <div className="login-extension">
        <button onClick={() => loginWithExtension()}>Login with extension</button>
      </div>
    </div>
  );
};

export default Login;
```

**Step 2: Verify the changes**

Run: `cat src/components/Login/Login.tsx`
Expected: New Login component with QRCodeLogin

**Step 3: Commit**

```bash
git add src/components/Login/Login.tsx
git commit -m "feat(login): integrate QRCodeLogin as primary login method"
```

---

### Task 3: Update Login Styles

**Files:**
- Modify: `src/components/Login/Login.css`

**Step 1: Replace the CSS with updated styles**

```css
.login-dialog {
  display: flex;
  flex-direction: column;
  padding: 2em;
  border-radius: 20px;
  background-color: #222;
  z-index: 200;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  gap: 16px;
  min-width: 280px;
}

.login-dialog h2 {
  text-align: center;
  margin-top: 0px;
  margin-bottom: 0px;
}

.login-dialog .close-button {
  cursor: pointer;
  position: absolute;
  right: 1.2em;
  top: 1em;
}

.login-error {
  background-color: rgba(255, 100, 100, 0.2);
  color: #ff6b6b;
  padding: 0.5em 1em;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9em;
}

/* QR Login Styles */
.qr-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.qr-login-header {
  text-align: center;
}

.qr-login-icon {
  font-size: 2em;
  display: block;
  margin-bottom: 0.5em;
}

.qr-login-header p {
  margin: 0;
  color: #fff;
  font-size: 0.95em;
}

.qr-login-apps {
  color: #888;
  font-size: 0.8em;
  display: block;
  margin-top: 0.25em;
}

.qr-code-container {
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
}

.qr-loading {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #ddd;
  border-top-color: rgb(99, 19, 173);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.qr-actions {
  display: flex;
  gap: 8px;
}

.qr-action-btn {
  background-color: transparent;
  color: #888;
  border: 1px solid #444;
  padding: 0.5em 1em;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.2s;
}

.qr-action-btn:hover {
  background-color: #333;
  color: #fff;
}

.qr-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Divider */
.login-divider {
  display: flex;
  align-items: center;
  gap: 1em;
  color: #666;
  font-size: 0.85em;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: #444;
}

/* Extension Button */
.login-dialog button,
.login-dialog button:visited,
.login-dialog button:active {
  background-color: rgb(99, 19, 173);
  color: #fff;
  height: 3em;
  padding-left: 1em;
  padding-right: 1em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}

.login-dialog button:hover {
  background-color: rgb(119, 39, 193);
}

.login-extension {
  display: flex;
  justify-content: center;
}

.login-extension button {
  width: 100%;
}
```

**Step 2: Verify the changes**

Run: `cat src/components/Login/Login.css | head -30`
Expected: Updated CSS with QR styles

**Step 3: Commit**

```bash
git add src/components/Login/Login.css
git commit -m "style(login): update styles for QR code login layout"
```

---

### Task 4: Update Session After QR Login

**Files:**
- Modify: `src/components/Login/Login.tsx`

The QRCodeLogin component creates the account but doesn't update the Jotai session atom. We need to fix the handleQRLogin to properly set the session.

**Step 1: Update handleQRLogin to set session**

Update the `handleQRLogin` function in Login.tsx:

```tsx
import { useContext } from 'react';
import { AccountsContext } from 'applesauce-react';

// Inside Login component, add:
const accountManager = useContext(AccountsContext);

const handleQRLogin = () => {
  const active = accountManager?.active;
  if (active) {
    setSession({
      method: 'nip46',
      pubkey: active.pubkey,
    });
    syncUserRelays(active.pubkey);
  }
  onClose();
};
```

**Step 2: Verify the full Login.tsx is correct**

Run: `cat src/components/Login/Login.tsx`
Expected: Login component with accountManager context and proper session setting

**Step 3: Commit**

```bash
git add src/components/Login/Login.tsx
git commit -m "fix(login): properly set session after QR login"
```

---

### Task 5: Build and Test

**Step 1: Run the build to check for type errors**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 2: If there are errors, fix them**

Common issues:
- Missing imports
- Type mismatches
- Missing dependencies

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(login): resolve build errors"
```

---

### Task 6: Manual Testing Checklist

Test the following scenarios:

1. **QR Code Display**
   - Open login modal
   - QR code should appear after brief loading
   - Copy button should copy URI to clipboard
   - Refresh button should generate new QR code

2. **QR Login Flow**
   - Scan QR code with Amber or other NIP-46 signer
   - Modal should close on successful connection
   - User should be logged in with correct pubkey

3. **Extension Login**
   - Click "Login with extension"
   - Should work as before

4. **Error Handling**
   - If QR login fails, error message should appear
   - Refresh should clear error and generate new QR

5. **Session Persistence**
   - After QR login, refresh page
   - User should remain logged in (bunker reconnection)
