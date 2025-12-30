# NDK to Applesauce Migration Design

## Overview

Replace NDK (Nostr Development Kit) with applesauce libraries for the slidestr codebase. This is a complete replacement, removing NDK entirely and rewriting all integration points.

## Key Decisions

- **Migration approach:** Complete replacement (not incremental)
- **State management:** Switch to observable-hooks, drop React Query, keep Jotai for UI state only
- **Caching:** Fresh start with nostr-idb (no data migration from Dexie)
- **Authentication:** Keep all 4 methods (NIP-07, NIP-46, nsec, npub read-only)
- **Relay management:** Full NIP-65 outbox model support

## Architecture

### Current (NDK)

```
App.tsx
  └── NDK instance (with Dexie cache, outbox model)
        └── NgineProvider (context)
              └── React Query + Jotai
                    └── Custom hooks (useEvents, useProfile, etc.)
```

### Proposed (Applesauce)

```
App.tsx
  └── Core singletons (eventStore, relayPool, accountManager)
        └── Providers stack:
              ├── AccountsProvider (auth state)
              ├── EventStoreProvider (event queries)
              └── FactoryProvider (event creation)
                    └── Jotai (session atoms, UI state only)
                          └── Custom hooks using observable-hooks
```

## Core Setup

### `src/nostr/core.ts`

```typescript
import { EventStore } from 'applesauce-core'
import { RelayPool } from 'applesauce-relay'
import { createAddressLoader, createTimelineLoader } from 'applesauce-loaders'
import { defaultRelays } from '@/constants/relays'

export const eventStore = new EventStore()
export const relayPool = new RelayPool()

const replaceableLoader = createAddressLoader(relayPool, {
  eventStore,
  lookupRelays: defaultRelays,
  bufferTime: 100,
})

eventStore.replaceableLoader = replaceableLoader
eventStore.addressableLoader = replaceableLoader

export function connectToRelays() {
  relayPool.group(defaultRelays)
}
```

### `src/nostr/cache.ts`

```typescript
import { openDB, addEvents, getEventsForFilters } from 'nostr-idb'
import { persistEventsToCache } from 'applesauce-core/helpers'
import { eventStore } from './core'

let cache: Awaited<ReturnType<typeof openDB>> | null = null

export async function initCache() {
  cache = await openDB()
  persistEventsToCache(eventStore, events => {
    if (cache) addEvents(cache, events)
  })
}

export function cacheRequest(filters: Filter[]) {
  if (!cache) return Promise.resolve([])
  return getEventsForFilters(cache, filters)
}
```

## Authentication

Replace NDK signers with applesauce accounts:

```typescript
import { AccountManager } from 'applesauce-accounts'
import { ExtensionAccount, SimpleAccount, NostrConnectAccount } from 'applesauce-accounts'
import { ExtensionSigner, SimpleSigner, NostrConnectSigner } from 'applesauce-signers'

// NIP-07 Extension Login
async function loginWithExtension() {
  const signer = new ExtensionSigner()
  const pubkey = await signer.getPublicKey()
  const account = new ExtensionAccount(pubkey, signer)
  await accountManager.addAccount(account)
  accountManager.setActiveAccount(account)
}

// NIP-46 Bunker Login
async function loginWithBunker(bunkerUri: string) {
  const signer = await NostrConnectSigner.fromBunkerURI(bunkerUri, {
    pool: relayPool,
  })
  const pubkey = await signer.getPublicKey()
  const account = new NostrConnectAccount(pubkey, signer)
  await accountManager.addAccount(account)
  accountManager.setActiveAccount(account)
}

// nsec Login
async function loginWithNsec(nsec: string) {
  const signer = SimpleSigner.fromKey(nsec)
  const pubkey = await signer.getPublicKey()
  const account = new SimpleAccount(pubkey, signer)
  await accountManager.addAccount(account)
  accountManager.setActiveAccount(account)
}

// npub Read-Only Login
async function loginWithNpub(npub: string) {
  const pubkey = nip19.decode(npub).data as string
  const account = { pubkey, readonly: true }
  accountManager.addAccount(account)
  accountManager.setActiveAccount(account)
}
```

## Hook Migration

Replace NDK subscriptions with RxJS observables:

### `useEvents`

```typescript
import { useObservableState } from 'observable-hooks'
import { createTimelineLoader } from 'applesauce-loaders'

export function useEvents(filter: Filter, relays?: string[]) {
  const effectiveRelays = relays ?? defaultRelays

  const events = useObservableState(() => {
    const loader = createTimelineLoader(relayPool, effectiveRelays, filter, {
      eventStore,
      cache: cacheRequest,
    })
    loader().subscribe()
    return eventStore.timeline(filter)
  }, [])

  return events ?? []
}
```

### `useProfile`

```typescript
export function useProfile(pubkey: string) {
  return useObservableState(() =>
    eventStore.replaceable(0, pubkey).pipe(
      map(event => event ? JSON.parse(event.content) : undefined)
    )
  , undefined)
}
```

### `useLatestEvent`

```typescript
export function useLatestEvent(filter: Filter) {
  return useObservableState(() =>
    eventStore.timeline(filter).pipe(
      map(events => events[0])
    )
  , undefined)
}
```

## Event Publishing

```typescript
import { useFactory } from 'applesauce-react/hooks'

export function useReaction() {
  const factory = useFactory()
  const account = useActiveAccount()

  async function react(targetEvent: NostrEvent, content = '+') {
    if (!account?.signer) return

    const unsigned = {
      kind: kinds.Reaction,
      content,
      tags: [
        ['e', targetEvent.id],
        ['p', targetEvent.pubkey],
      ],
      created_at: Math.floor(Date.now() / 1000),
    }

    const signed = await account.signer.signEvent(unsigned)
    await relayPool.publish(getWriteRelays(), signed)
    eventStore.add(signed)
  }

  return { react }
}
```

## Relay Management (NIP-65)

### `src/nostr/relays.ts`

```typescript
import { kinds } from 'nostr-tools'
import { eventStore, relayPool } from './core'
import { defaultRelays } from '@/constants/relays'

export function parseRelayList(event: NostrEvent) {
  const read: string[] = []
  const write: string[] = []

  for (const tag of event.tags) {
    if (tag[0] !== 'r') continue
    const url = tag[1]
    const marker = tag[2]

    if (!marker || marker === 'read') read.push(url)
    if (!marker || marker === 'write') write.push(url)
  }

  return { read, write }
}

export function getUserRelays(pubkey: string) {
  const relayList = eventStore.getReplaceable(kinds.RelayList, pubkey)
  if (!relayList) return { read: defaultRelays, write: defaultRelays }
  return parseRelayList(relayList)
}

export function getAuthorReadRelays(pubkey: string): string[] {
  const { write } = getUserRelays(pubkey)
  return write.length > 0 ? write : defaultRelays
}

export function getWriteRelays(): string[] {
  const account = accountManager.activeAccount
  if (!account) return defaultRelays
  const { write } = getUserRelays(account.pubkey)
  return write.length > 0 ? write : defaultRelays
}

export function syncUserRelays(pubkey: string) {
  const { read, write } = getUserRelays(pubkey)
  const allRelays = [...new Set([...read, ...write, ...defaultRelays])]
  relayPool.group(allRelays)
}
```

## Package Changes

### Add

```json
"applesauce-core": "^0.x",
"applesauce-react": "^0.x",
"applesauce-relay": "^0.x",
"applesauce-accounts": "^0.x",
"applesauce-signers": "^0.x",
"applesauce-loaders": "^0.x",
"applesauce-factory": "^0.x",
"nostr-idb": "^2.x",
"observable-hooks": "^4.x",
"rxjs": "^7.x"
```

### Remove

```json
"@nostr-dev-kit/ndk": "x",
"@nostr-dev-kit/ndk-cache-dexie": "x",
"@tanstack/react-query": "x"
```

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/nostr/core.ts` | EventStore, RelayPool, loaders |
| `src/nostr/cache.ts` | nostr-idb integration |
| `src/nostr/relays.ts` | NIP-65 relay management |
| `src/hooks/useAccountPersistence.ts` | Session persistence |

### Files to Refactor

| File | Changes |
|------|---------|
| `src/App.tsx` | Replace NDK init with applesauce providers |
| `src/ngine/context.tsx` | Replace NDK signers with AccountManager |
| `src/ngine/hooks/useEvents.ts` | Observable-based timeline |
| `src/ngine/hooks/useEvent.ts` | Observable single event |
| `src/ngine/hooks/useProfile.ts` | Observable replaceable |
| `src/ngine/hooks/useProfiles.ts` | Batch profile loading |
| `src/ngine/hooks/useLatestEvent.ts` | Observable latest |
| `src/ngine/hooks/useReactions.ts` | Observable reactions |
| `src/utils/useZapAndReaction.ts` | New publishing pattern |
| `src/utils/useBookMarks.ts` | New publishing pattern |
| `src/components/FollowButton/` | New publishing pattern |

## Migration Order

1. Core setup (eventStore, relayPool, cache)
2. Auth (AccountManager, signers)
3. Providers (wrap app)
4. Hooks (one by one, test each)
5. Publishing (reactions, follows, bookmarks)
6. Remove NDK, Dexie, React Query
