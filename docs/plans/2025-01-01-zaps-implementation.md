# Zaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Lightning zap functionality with NWC as primary payment method and QR fallback.

**Architecture:** NWC connection stored in Jotai atom, zap requests via NIP-57, payments via NIP-47. Zap counts fetched via kind 9735 events. UI shows zap button with sats total, amount picker modal on long-press.

**Tech Stack:** nostr-tools (nip04, nip57), applesauce-relay, Jotai, React

---

## Task 1: Add NWC State Management

**Files:**
- Modify: `src/ngine/state.ts`
- Modify: `src/ngine/types.ts`

**Step 1: Add NWC types to types.ts**

Add after line 49 in `src/ngine/types.ts`:

```typescript
// NWC (Nostr Wallet Connect)
export interface NWCConnection {
  walletPubkey: string;
  relayUrl: string;
  secret: string;
}
```

**Step 2: Add NWC atom to state.ts**

Add after line 8 in `src/ngine/state.ts`:

```typescript
import type { Relay, Rates, Session, Currency, NWCConnection } from './types';
```

Then add after line 28:

```typescript
export const nwcAtom = atomWithStorage<NWCConnection | null>('ngine.nwc', null);

export function useNWC() {
  return useAtomValue(nwcAtom);
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add src/ngine/state.ts src/ngine/types.ts
git commit -m "feat(zaps): add NWC connection state management"
```

---

## Task 2: Create NWC Module

**Files:**
- Create: `src/ngine/nwc.ts`

**Step 1: Create NWC module with connection parsing and payment**

Create `src/ngine/nwc.ts`:

```typescript
import { nip04 } from 'nostr-tools';
import type { NostrEvent } from 'nostr-tools';
import { relayPool } from '../nostr/core';
import type { NWCConnection } from './types';
import { filter, firstValueFrom, timeout } from 'rxjs';

// Parse nostr+walletconnect:// URI
export function parseNWCUri(uri: string): NWCConnection | null {
  try {
    // Format: nostr+walletconnect://<wallet-pubkey>?relay=<relay-url>&secret=<secret>
    const url = new URL(uri);
    const walletPubkey = url.hostname || url.pathname.replace('//', '');
    const relayUrl = url.searchParams.get('relay');
    const secret = url.searchParams.get('secret');

    if (!walletPubkey || !relayUrl || !secret) {
      return null;
    }

    return { walletPubkey, relayUrl, secret };
  } catch {
    return null;
  }
}

// Generate keypair from secret for NIP-04 encryption
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Pay an invoice via NWC
export async function payInvoiceViaNWC(
  connection: NWCConnection,
  invoice: string
): Promise<{ preimage: string } | { error: string }> {
  const { walletPubkey, relayUrl, secret } = connection;

  // Create pay_invoice request
  const request = JSON.stringify({
    method: 'pay_invoice',
    params: { invoice },
  });

  // Encrypt with NIP-04
  const encryptedContent = await nip04.encrypt(secret, walletPubkey, request);

  // Create kind 23194 event (NWC request)
  const unsignedEvent = {
    kind: 23194,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['p', walletPubkey]],
    content: encryptedContent,
    pubkey: '', // Will be set by simple signing below
  };

  // Simple signing with secret key (NWC uses the secret as private key)
  const { getPublicKey, finalizeEvent } = await import('nostr-tools');
  const secretBytes = hexToBytes(secret);
  unsignedEvent.pubkey = getPublicKey(secretBytes);
  const signedEvent = finalizeEvent(unsignedEvent, secretBytes);

  // Subscribe to response before publishing
  const response$ = relayPool
    .subscription([relayUrl], [
      {
        kinds: [23195],
        authors: [walletPubkey],
        '#e': [signedEvent.id],
      },
    ])
    .pipe(
      filter((e): e is NostrEvent => typeof e !== 'string' && 'kind' in e),
      timeout(30000) // 30 second timeout
    );

  // Publish request
  await relayPool.publish([relayUrl], signedEvent);

  // Wait for response
  try {
    const responseEvent = await firstValueFrom(response$);
    const decrypted = await nip04.decrypt(secret, walletPubkey, responseEvent.content);
    const result = JSON.parse(decrypted);

    if (result.error) {
      return { error: result.error.message || 'Payment failed' };
    }

    return { preimage: result.result?.preimage || '' };
  } catch (err) {
    return { error: 'NWC request timed out' };
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/ngine/nwc.ts
git commit -m "feat(zaps): add NWC module for wallet connect payments"
```

---

## Task 3: Add NIP-57 Zap Request Creation

**Files:**
- Modify: `src/ngine/lnurl.ts`

**Step 1: Add createZapRequest function**

Add at the end of `src/ngine/lnurl.ts`:

```typescript
export function createZapRequestEvent(
  senderPubkey: string,
  recipientPubkey: string,
  eventId: string,
  amountMsats: number,
  relays: string[],
  lnurl: string,
  comment?: string
): Omit<NostrEvent, 'id' | 'sig'> {
  const tags: string[][] = [
    ['p', recipientPubkey],
    ['e', eventId],
    ['amount', amountMsats.toString()],
    ['relays', ...relays],
    ['lnurl', lnurl],
  ];

  return {
    kind: 9734,
    created_at: Math.floor(Date.now() / 1000),
    pubkey: senderPubkey,
    tags,
    content: comment || '',
  };
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/ngine/lnurl.ts
git commit -m "feat(zaps): add NIP-57 zap request creation"
```

---

## Task 4: Create Zap Count Hook

**Files:**
- Create: `src/hooks/useZapCount.ts`

**Step 1: Create the hook**

Create `src/hooks/useZapCount.ts`:

```typescript
import { useState, useEffect } from 'react';
import { eventStore, relayPool, DEFAULT_RELAYS } from '../nostr/core';
import type { NostrEvent } from 'nostr-tools';

// Decode bolt11 amount from invoice (simplified - gets amount in sats)
function decodeBolt11Amount(bolt11: string): number {
  // Look for amount in the invoice format: lnbc<amount><multiplier>
  const match = bolt11.toLowerCase().match(/^lnbc(\d+)([munp]?)/);
  if (!match) return 0;

  const amount = parseInt(match[1], 10);
  const multiplier = match[2];

  switch (multiplier) {
    case 'm': return amount * 100000; // milli-btc to sats
    case 'u': return amount * 100; // micro-btc to sats
    case 'n': return amount / 10; // nano-btc to sats
    case 'p': return amount / 10000; // pico-btc to sats
    default: return amount * 100000000; // btc to sats
  }
}

export function useZapCount(eventId: string | undefined): number {
  const [totalSats, setTotalSats] = useState(0);

  useEffect(() => {
    if (!eventId) {
      setTotalSats(0);
      return;
    }

    // Check cache first
    const cached = eventStore.getEventsForFilters([
      { kinds: [9735], '#e': [eventId] }
    ]);

    if (cached.length > 0) {
      const total = cached.reduce((sum, event) => {
        const bolt11Tag = event.tags.find(t => t[0] === 'bolt11');
        if (bolt11Tag) {
          return sum + decodeBolt11Amount(bolt11Tag[1]);
        }
        return sum;
      }, 0);
      setTotalSats(total);
    }

    // Subscribe to zap receipts
    const subscription = relayPool
      .subscription(DEFAULT_RELAYS, [{ kinds: [9735], '#e': [eventId] }])
      .subscribe(event => {
        if (typeof event === 'string') return;
        const nostrEvent = event as NostrEvent;
        eventStore.add(nostrEvent);

        // Recalculate total
        const allZaps = eventStore.getEventsForFilters([
          { kinds: [9735], '#e': [eventId] }
        ]);
        const total = allZaps.reduce((sum, e) => {
          const bolt11Tag = e.tags.find(t => t[0] === 'bolt11');
          if (bolt11Tag) {
            return sum + decodeBolt11Amount(bolt11Tag[1]);
          }
          return sum;
        }, 0);
        setTotalSats(total);
      });

    return () => subscription.unsubscribe();
  }, [eventId]);

  return totalSats;
}

// Format sats for display (e.g., 1000 -> "1k", 1500000 -> "1.5M")
export function formatSats(sats: number): string {
  if (sats === 0) return '';
  if (sats < 1000) return sats.toString();
  if (sats < 1000000) return (sats / 1000).toFixed(sats % 1000 === 0 ? 0 : 1) + 'k';
  return (sats / 1000000).toFixed(1) + 'M';
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/hooks/useZapCount.ts
git commit -m "feat(zaps): add useZapCount hook for fetching zap totals"
```

---

## Task 5: Create Zap Modal Component

**Files:**
- Create: `src/components/ZapModal/ZapModal.tsx`
- Create: `src/components/ZapModal/ZapModal.css`

**Step 1: Create ZapModal CSS**

Create `src/components/ZapModal/ZapModal.css`:

```css
.zap-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.zap-modal {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 24px;
  min-width: 300px;
  max-width: 400px;
}

.zap-modal h3 {
  margin: 0 0 16px 0;
  color: #fff;
  text-align: center;
}

.zap-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.zap-amount-btn {
  padding: 12px 8px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #222;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.zap-amount-btn:hover,
.zap-amount-btn.selected {
  background: #f7931a;
  border-color: #f7931a;
}

.zap-comment {
  width: 100%;
  padding: 12px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #222;
  color: #fff;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.zap-comment::placeholder {
  color: #666;
}

.zap-submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  background: #f7931a;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  font-size: 16px;
}

.zap-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zap-qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.zap-qr-container canvas {
  border-radius: 8px;
}

.zap-setup-link {
  color: #f7931a;
  text-decoration: none;
  text-align: center;
  display: block;
  margin-top: 8px;
}

.zap-error {
  color: #ff6b6b;
  text-align: center;
  margin-top: 8px;
}
```

**Step 2: Create ZapModal component**

Create `src/components/ZapModal/ZapModal.tsx`:

```typescript
import { useState } from 'react';
import './ZapModal.css';
import { useNWC } from '../../ngine/state';

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
      <div className="zap-modal" onClick={e => e.stopPropagation()}>
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

        {!nwc ? (
          <a className="zap-setup-link" onClick={onOpenSettings}>
            Set up wallet to zap
          </a>
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
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/ZapModal/
git commit -m "feat(zaps): add ZapModal component for amount selection"
```

---

## Task 6: Add Wallet Settings UI

**Files:**
- Modify: `src/components/Settings.tsx`
- Modify: `src/components/Settings.css`

**Step 1: Add wallet section CSS**

Add to `src/components/Settings.css`:

```css
.wallet-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #333;
}

.wallet-section h4 {
  margin: 0 0 12px 0;
  color: #fff;
}

.wallet-connected {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #222;
  border-radius: 8px;
  margin-bottom: 12px;
}

.wallet-connected .status {
  color: #4ade80;
}

.wallet-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #222;
  color: #fff;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.wallet-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.wallet-btn-connect {
  background: #f7931a;
  color: #000;
}

.wallet-btn-disconnect {
  background: #333;
  color: #fff;
}
```

**Step 2: Add wallet settings to Settings.tsx**

Add import at top of `src/components/Settings.tsx`:

```typescript
import { useAtom } from 'jotai';
import { nwcAtom } from '../ngine/state';
import { parseNWCUri } from '../ngine/nwc';
```

Add state inside SettingsDialog component (after line 30):

```typescript
const [nwc, setNwc] = useAtom(nwcAtom);
const [nwcInput, setNwcInput] = useState('');
const [nwcError, setNwcError] = useState<string | null>(null);

const handleConnectWallet = () => {
  const parsed = parseNWCUri(nwcInput);
  if (parsed) {
    setNwc(parsed);
    setNwcInput('');
    setNwcError(null);
  } else {
    setNwcError('Invalid NWC connection string');
  }
};

const handleDisconnectWallet = () => {
  setNwc(null);
};
```

Add wallet section JSX before the closing `</div>` of settings-content (after line 193):

```tsx
<div className="wallet-section">
  <h4>Lightning Wallet</h4>
  {nwc ? (
    <div className="wallet-connected">
      <span className="status">Connected</span>
      <button className="wallet-btn wallet-btn-disconnect" onClick={handleDisconnectWallet}>
        Disconnect
      </button>
    </div>
  ) : (
    <>
      <input
        type="text"
        className="wallet-input"
        placeholder="Paste nostr+walletconnect:// URI"
        value={nwcInput}
        onChange={e => setNwcInput(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
      />
      {nwcError && <div style={{ color: '#ff6b6b', marginBottom: 12 }}>{nwcError}</div>}
      <button className="wallet-btn wallet-btn-connect" onClick={handleConnectWallet}>
        Connect Wallet
      </button>
    </>
  )}
</div>
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/Settings.tsx src/components/Settings.css
git commit -m "feat(zaps): add wallet connection UI in settings"
```

---

## Task 7: Complete Zap Implementation

**Files:**
- Modify: `src/utils/useZapAndReaction.ts`

**Step 1: Rewrite useZapAndReaction with full zap support**

Replace `src/utils/useZapAndReaction.ts` with:

```typescript
import { useSign } from '../ngine/context';
import { useSession, useNWC } from '../ngine/state';
import { relayPool, eventStore, DEFAULT_RELAYS } from '../nostr/core';
import { getWriteRelays } from '../nostr/relays';
import { NostrImage } from '../components/nostrImageDownload';
import type { Filter } from 'nostr-tools';
import { nip19 } from 'nostr-tools';
import { useEffect, useMemo, useState, useCallback } from 'react';
import useReposts from './useReposts';
import { useLnurl, loadInvoice, createZapRequestEvent } from '../ngine/lnurl';
import { payInvoiceViaNWC } from '../ngine/nwc';
import useProfile from '../ngine/hooks/useProfile';

export type HeartState = 'none' | 'liked' | 'liking';
export type ZapState = 'none' | 'zapped' | 'zapping' | 'error';

const DEFAULT_ZAP_AMOUNT = 21;

const useZapsAndReations = (currentImageData?: NostrImage, userNPub?: string) => {
  const sign = useSign();
  const session = useSession();
  const nwc = useNWC();
  const reposts = useReposts(userNPub);

  const [zapState, setZapState] = useState<ZapState>('none');
  const [heartState, setHeartState] = useState<HeartState>('none');

  // Get author profile for LNURL
  const authorProfile = useProfile(currentImageData?.authorId);
  const { data: lnurlService } = useLnurl(authorProfile);

  const fetchLikeAndZaps = async (noteIds: string[], selfNPub: string) => {
    const filter: Filter = { kinds: [7], '#e': noteIds };
    filter.authors = [nip19.decode(selfNPub).data as string];
    const events = eventStore.getEventsForFilters([filter]);
    return { selfLiked: events && events.length > 0 };
  };

  const repostState = useMemo(
    () => reposts.some(r => r == currentImageData?.post.event.id),
    [currentImageData?.post.event.id, reposts]
  );

  useEffect(() => {
    setZapState('none');
    setHeartState('none');

    if (!currentImageData?.noteId || !userNPub) return;

    if (currentImageData.post.wasLiked !== undefined) {
      setHeartState(currentImageData.post.wasLiked ? 'liked' : 'none');
      return;
    }

    fetchLikeAndZaps([currentImageData.noteId], userNPub).then(likes => {
      currentImageData.post.wasLiked = likes.selfLiked;
      setHeartState(likes.selfLiked ? 'liked' : 'none');
    });
  }, [currentImageData, currentImageData?.noteId, userNPub]);

  const heartClick = async (currentImage: NostrImage) => {
    setHeartState('liking');
    if (!session?.pubkey) return;

    const unsigned = {
      kind: 7,
      created_at: Math.floor(Date.now() / 1000),
      content: '+',
      tags: [
        ['e', currentImage.noteId],
        ['p', currentImage.authorId],
      ],
    };

    const signed = await sign(unsigned);
    if (!signed) {
      setHeartState('none');
      return;
    }

    await relayPool.publish(getWriteRelays(session.pubkey), signed);
    eventStore.add(signed);
    setHeartState('liked');
    currentImage.post.wasLiked = true;
  };

  const zapClick = useCallback(async (
    currentImage: NostrImage,
    amount: number = DEFAULT_ZAP_AMOUNT,
    comment?: string
  ) => {
    setZapState('zapping');

    if (!session?.pubkey) {
      setZapState('error');
      throw new Error('Not logged in');
    }

    if (!lnurlService) {
      setZapState('error');
      throw new Error('Author has no Lightning address');
    }

    if (!nwc) {
      setZapState('error');
      throw new Error('No wallet connected');
    }

    try {
      // Create zap request
      const lnurlEncoded = authorProfile?.lud16 || '';
      const zapRequest = createZapRequestEvent(
        session.pubkey,
        currentImage.authorId,
        currentImage.noteId,
        amount * 1000, // Convert to msats
        DEFAULT_RELAYS,
        lnurlEncoded,
        comment
      );

      // Sign zap request
      const signedZapRequest = await sign(zapRequest);
      if (!signedZapRequest) {
        setZapState('error');
        throw new Error('Failed to sign zap request');
      }

      // Get invoice from LNURL service
      const invoiceResponse = await loadInvoice(
        lnurlService,
        amount,
        comment,
        signedZapRequest
      );

      if (!invoiceResponse?.pr) {
        setZapState('error');
        throw new Error('Failed to get invoice');
      }

      // Pay via NWC
      const payResult = await payInvoiceViaNWC(nwc, invoiceResponse.pr);

      if ('error' in payResult) {
        setZapState('error');
        throw new Error(payResult.error);
      }

      setZapState('zapped');

      // Reset after animation
      setTimeout(() => setZapState('none'), 2000);
    } catch (err) {
      setZapState('error');
      throw err;
    }
  }, [session, nwc, lnurlService, authorProfile, sign]);

  const repostClick = async () => {
    if (!session?.pubkey) return;

    const orgEvent = currentImageData?.post.event;
    if (!orgEvent || !orgEvent.id) return;

    const relayUrl = 'wss://relay.damus.io';

    const unsigned = {
      kind: 6,
      created_at: Math.floor(Date.now() / 1000),
      content: JSON.stringify(orgEvent),
      tags: [
        ['e', orgEvent.id, relayUrl],
        ['p', orgEvent.pubkey],
      ],
    };

    const signed = await sign(unsigned);
    if (!signed) return;

    await relayPool.publish(getWriteRelays(session.pubkey), signed);
    eventStore.add(signed);
  };

  return {
    zapState,
    heartState,
    zapClick,
    heartClick,
    repostClick,
    repostState,
    hasLnurl: !!lnurlService,
    hasNwc: !!nwc,
  };
};

export default useZapsAndReations;
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/utils/useZapAndReaction.ts
git commit -m "feat(zaps): complete zap implementation with NWC"
```

---

## Task 8: Add Zap Button Animation CSS

**Files:**
- Create: `src/components/ZapButton/ZapButton.css`
- Create: `src/components/ZapButton/ZapButton.tsx`

**Step 1: Create ZapButton CSS**

Create `src/components/ZapButton/ZapButton.css`:

```css
.zap-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 8px;
  color: #999;
  transition: color 0.2s;
}

.zap-button:hover {
  color: #f7931a;
}

.zap-button svg {
  width: 24px;
  height: 24px;
}

.zap-button.zapping svg {
  animation: zap-pulse 0.5s ease-in-out infinite;
}

.zap-button.zapped svg {
  color: #f7931a;
  animation: zap-flash 0.5s ease-out;
}

.zap-button .sats-count {
  font-size: 11px;
  color: #f7931a;
}

@keyframes zap-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes zap-flash {
  0% { transform: scale(1.5); filter: brightness(2); }
  100% { transform: scale(1); filter: brightness(1); }
}
```

**Step 2: Create ZapButton component**

Create `src/components/ZapButton/ZapButton.tsx`:

```typescript
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
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/ZapButton/
git commit -m "feat(zaps): add ZapButton component with animation"
```

---

## Task 9: Integrate Zap UI into MasonryImage

**Files:**
- Modify: `src/components/MasonryView/MasonryImage.tsx`

**Step 1: Add zap button to MasonryImage**

Add imports at top:

```typescript
import ZapButton from '../ZapButton/ZapButton';
import ZapModal from '../ZapModal/ZapModal';
import { useZapCount } from '../../hooks/useZapCount';
import useZapsAndReations from '../../utils/useZapAndReaction';
import { useSession } from '../../ngine/state';
```

Add state and hooks inside MasonryImage component (after line 23):

```typescript
const session = useSession();
const [showZapModal, setShowZapModal] = useState(false);
const { zapState, zapClick, hasLnurl, hasNwc } = useZapsAndReations(
  image,
  session?.pubkey ? `npub${session.pubkey}` : undefined
);
const totalSats = useZapCount(image.post.event.id);

const handleQuickZap = async () => {
  if (!session?.pubkey || !hasLnurl) return;
  try {
    await zapClick(image, 21);
  } catch (err) {
    console.error('Quick zap failed:', err);
  }
};

const handleModalZap = async (amount: number, comment?: string) => {
  await zapClick(image, amount, comment);
};
```

Add zap button in the info-section div (after showTags map, around line 125):

```tsx
{session?.pubkey && hasLnurl && (
  <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
    <ZapButton
      zapState={zapState}
      totalSats={totalSats}
      onQuickZap={handleQuickZap}
      onOpenModal={() => setShowZapModal(true)}
      disabled={!hasNwc}
    />
  </div>
)}

{showZapModal && (
  <ZapModal
    onClose={() => setShowZapModal(false)}
    onZap={handleModalZap}
    onOpenSettings={() => {
      setShowZapModal(false);
      // TODO: Navigate to settings
    }}
  />
)}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/MasonryView/MasonryImage.tsx
git commit -m "feat(zaps): integrate zap button into MasonryImage"
```

---

## Task 10: Final Testing and Polish

**Step 1: Run the dev server**

Run: `npm run dev`
Expected: App runs without errors

**Step 2: Manual testing checklist**

- [ ] Settings shows wallet connection UI
- [ ] Can paste NWC connection string
- [ ] Zap button appears on images when logged in
- [ ] Zap button shows sats count when available
- [ ] Quick click triggers zap (if NWC connected)
- [ ] Long press opens amount picker modal
- [ ] Right-click opens amount picker modal
- [ ] Button animates on successful zap

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(zaps): complete zaps feature implementation"
```

---

## Summary

This plan implements:
1. **NWC connection storage** - Jotai atom with localStorage persistence
2. **NWC payment module** - NIP-47 pay_invoice via encrypted relay messages
3. **NIP-57 zap requests** - Proper zap request event creation
4. **Zap count fetching** - Real-time kind 9735 subscription
5. **ZapModal** - Amount picker with presets and optional comment
6. **ZapButton** - Quick zap on click, modal on long-press/right-click
7. **Wallet settings** - NWC URI paste in settings dialog
8. **Integration** - Zap button in MasonryImage view

The implementation uses existing patterns from the codebase (applesauce-relay, Jotai atoms, CSS modules) and builds on the partial zap infrastructure already in place.
