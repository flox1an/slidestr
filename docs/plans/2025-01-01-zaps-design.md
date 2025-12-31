# Zaps Feature Design

## Overview

Add Lightning zap functionality to Slidestr, allowing users to send sats to image authors.

## UX Summary

- **Quick zap**: Single click sends 21 sats instantly
- **Amount picker**: Long-press/right-click opens modal with presets (21, 100, 500, 1000 sats) and optional comment
- **Feedback**: Button animation on success (no toast)
- **Display**: Show total sats received per image

## Payment Architecture

### Primary: NWC (NIP-47)

User configures Nostr Wallet Connect in Settings:
- Paste `nostr+walletconnect://` URI, or
- Scan QR code from wallet (Alby, Mutiny, etc.)

Connection stored in localStorage. On zap:
1. Create NIP-57 zap request (kind 9734)
2. Send to recipient's LNURL callback to get invoice
3. Send `pay_invoice` command via NWC relay
4. Wait for response, show success animation

### Fallback: QR Code

If no NWC configured:
1. Create zap request, fetch invoice from LNURL
2. Display invoice as QR code in modal
3. Poll `verify` endpoint to detect payment
4. Show success animation when paid

## NIP-57 Zap Request

Kind 9734 event with tags:
- `p` - recipient pubkey
- `e` - event being zapped
- `amount` - millisatoshis
- `relays` - relays to publish receipt
- `lnurl` - recipient's LNURL

Signed by current user, sent to recipient's LNURL callback.

## UI Components

### Zap Button (SlideView)

- Lightning bolt icon
- Shows total sats received (e.g., "2.1k")
- Click: quick zap (21 sats)
- Long-press/right-click: amount picker

### Amount Picker Modal

- Preset buttons: 21, 100, 500, 1000
- Optional comment field
- "Zap" button
- "Set up wallet" link if no NWC

### Button Animation

- Brief pulse/flash on zap icon
- Yellow/gold glow that fades
- Optimistic sats count update

### Settings: Wallet Section

- "Connect wallet" with two options:
  - Paste connection string
  - Scan QR code
- Shows connection status
- Disconnect button

## Technical Implementation

### New Files

| File | Purpose |
|------|---------|
| `src/ngine/nwc.ts` | NWC connection, `pay_invoice` command |
| `src/components/ZapModal.tsx` | Amount picker modal |
| `src/hooks/useZapCount.ts` | Fetch zap receipts (kind 9735), sum totals |

### Modified Files

| File | Changes |
|------|---------|
| `utils/useZapAndReaction.ts` | Complete `zapClick()` implementation |
| `ngine/lnurl.ts` | Add `createZapRequest()` for NIP-57 |
| `ngine/state.ts` | Add `nwcAtom` for persisted connection |
| `components/Settings.tsx` | Add wallet configuration UI |
| `components/SlideView/index.tsx` | Wire zap button with long-press |

### NWC Flow Detail

1. Parse URI: extract wallet pubkey, relay URL, secret key
2. Connect to NWC relay via RelayPool
3. Create kind 23194 request with `pay_invoice` method
4. Encrypt content with NIP-04 using secret
5. Publish and subscribe for kind 23195 response
6. Decrypt response, handle success/error

### Zap Receipt Fetching

- Subscribe to kind 9735 with `#e` tag for current event
- Parse `bolt11` tag to extract amount
- Sum totals per event
- Cache in EventStore for instant display
- Use TimelineLoader for real-time updates

## Data Flow

```
User clicks zap
    ↓
Check NWC configured?
    ├─ Yes → Create zap request → Get invoice → Pay via NWC → Animate success
    └─ No  → Create zap request → Get invoice → Show QR → Poll verify → Animate success
```

## State

```typescript
// ngine/state.ts
interface NWCConnection {
  walletPubkey: string;
  relayUrl: string;
  secret: string;
}

const nwcAtom = atomWithStorage<NWCConnection | null>('nwc', null);
```
