# QR Nostr Connect Login Design

## Overview

Replace the current login modal with a QR code-based nostr connect (NIP-46) flow as the primary authentication method, with browser extension login as secondary.

## Component Structure

```
LoginModal
├── QRCodeLogin (primary area)
│   ├── QR code SVG display
│   ├── "Scan with your Nostr signer app" label
│   ├── Action buttons row
│   │   ├── Copy URI button
│   │   └── Refresh button
│   └── Loading/error states
├── Divider ("or")
└── Extension login button (secondary)
```

### Files to Create/Modify

- `src/components/Login/QRCodeLogin.tsx` - New QR component
- `src/components/Login/Login.tsx` - Refactor existing modal
- `src/components/Login/Login.css` - Update styles

### Dependencies

- `qrcode.react` - Already in project (used by ZapModal)
- `applesauce-signers` - Already has NostrConnectSigner

## QR Code Generation Flow

1. **Generate connection** - Create `NostrConnectSigner` with:
   - Relays: Default relays from `src/nostr/core.ts`
   - App metadata: name "Slidestr", URL
   - Permissions: `[0, 1, 3, 7, 9734, 10002]` (profile, notes, contacts, reactions, zap requests, relay list)

2. **Create URI** - Generate `nostrconnect://` URI containing:
   - App's ephemeral pubkey
   - Relay list for communication
   - App name and metadata
   - Requested permissions

3. **Display QR** - Render via `QRCodeSVG` from qrcode.react

4. **Wait for connection** - Call `signer.waitForSigner()` with AbortSignal
   - On success: get pubkey, create account, persist, call `onLogin`
   - On abort (modal closed): cleanup silently

### Actions

- **Refresh**: Abort current connection, generate fresh URI/QR
- **Copy**: Copy `nostrconnect://` URI to clipboard

## Account Persistence & Integration

### On Successful Login

1. Get pubkey from `signer.getPublicKey()`
2. Build bunker URI: `bunker://<remotePubkey>?relay=...&secret=...`
3. Create `NostrConnectAccount` with the signer
4. Add to `accountManager` via NgineContext
5. Save to localStorage using existing `saveAccountToStorage()` with method `'bunker'`
6. Set as active account
7. Trigger session sync (relays, contacts) via existing `SessionProvider`

### Restoration

Existing `restoreAccountsToManager()` handles bunker accounts using `NostrConnectSigner.fromBunkerURI()`. No changes needed.

### Signer Setup

Register `subscriptionMethod` and `publishMethod` on NostrConnectSigner class using relay pool from `src/nostr/core.ts`.

## UI Design

### Visual Style

- Modal background: `#222` (existing dark theme)
- QR code: White background, dark modules, ~200x200px
- Buttons: Purple accent `rgb(99, 19, 173)`
- Copy/Refresh: Icon buttons below QR
- Extension button: Full-width secondary below divider

### States

| State | Display |
|-------|---------|
| Loading | Spinner while generating QR |
| Ready | QR displayed, waiting for scan |
| Connecting | Brief indicator when signer responds |
| Error | Message with retry option |

### Error Handling

- Relay failures: Show error, allow refresh
- Timeout: None (user controls via closing modal)
- Abort on unmount: Silent cleanup

### Accessibility

- Copy button announces "Copied!"
- QR has descriptive alt text
