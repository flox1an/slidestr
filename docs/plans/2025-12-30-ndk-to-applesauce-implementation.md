# NDK to Applesauce Migration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace NDK with applesauce libraries for all Nostr functionality in slidestr.

**Architecture:** EventStore + RelayPool + AccountManager replaces single NDK instance. Observable-hooks replaces React Query. Jotai remains for UI state only.

**Tech Stack:** applesauce-core, applesauce-react, applesauce-relay, applesauce-accounts, applesauce-signers, applesauce-loaders, nostr-idb, observable-hooks, rxjs

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add new dependencies**

Run:
```bash
npm install applesauce-core@^4.4.2 applesauce-react@^4.0.0 applesauce-relay@^4.4.2 applesauce-accounts@^4.1.0 applesauce-signers@^4.1.0 applesauce-loaders@^4.0.0 applesauce-factory@^4.0.0 nostr-idb@^4.0.1 observable-hooks@^4.2.4 rxjs@^7.8.2
```

**Step 2: Verify installation**

Run: `npm ls applesauce-core`
Expected: Shows installed version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add applesauce dependencies for NDK migration"
```

---

## Task 2: Create Core Nostr Module

**Files:**
- Create: `src/nostr/core.ts`

**Step 1: Create the core module**

```typescript
import { EventStore } from 'applesauce-core'
import { RelayPool } from 'applesauce-relay'
import { createAddressLoader } from 'applesauce-loaders/loaders'
import type { Filter, NostrEvent } from 'nostr-tools'
import { openDB, getEventsForFilters, addEvents } from 'nostr-idb'
import type { IDBPDatabase } from 'idb'
import { presistEventsToCache } from 'applesauce-core/helpers'
import { NostrConnectSigner } from 'applesauce-signers'
import type { NostrSubscriptionMethod, NostrPublishMethod } from 'applesauce-signers'
import { filter, mergeMap, race, throwError, timer } from 'rxjs'
import { defaultRelays } from '../components/env'

// Default relays
export const DEFAULT_RELAYS = defaultRelays

// IndexedDB cache
let cache: IDBPDatabase<unknown> | undefined

async function ensureCache() {
  if (!cache) {
    cache = await openDB()
  }
  return cache
}
ensureCache()

export async function cacheRequest(filters: Filter[]) {
  const db = await ensureCache()
  return getEventsForFilters(db, filters)
}

// Initialize EventStore and RelayPool
export const eventStore = new EventStore()
export const relayPool = new RelayPool()

// Add request timeout to prevent hanging
const REQUEST_TIMEOUT_MS = 5000
const originalRequest = relayPool.request.bind(relayPool)

relayPool.request = ((relays, filters, opts) => {
  const timeout$ = timer(REQUEST_TIMEOUT_MS).pipe(
    mergeMap(() =>
      throwError(() => new Error(`Relay request timed out after ${REQUEST_TIMEOUT_MS}ms`))
    )
  )
  return race(originalRequest(relays, filters, opts), timeout$)
}) as typeof relayPool.request

// Configure loaders for replaceable events (profiles, relay lists, etc.)
const replaceableLoader = createAddressLoader(relayPool, {
  eventStore,
  cacheRequest,
  lookupRelays: DEFAULT_RELAYS,
  bufferTime: 100,
})

eventStore.replaceableLoader = replaceableLoader
eventStore.addressableLoader = replaceableLoader

// Save all new events to cache
presistEventsToCache(eventStore, events => {
  if (cache) addEvents(cache, events)
})

// Configure NostrConnectSigner for NIP-46 bunker login
export const subscriptionMethod: NostrSubscriptionMethod = (
  relays: string[],
  filters: Filter[]
) => {
  return relayPool
    .subscription(relays, filters)
    .pipe(
      filter(
        (response): response is NostrEvent => typeof response !== 'string' && 'kind' in response
      )
    )
}

export const publishMethod: NostrPublishMethod = async (relays: string[], event: NostrEvent) => {
  const results = await relayPool.publish(relays, event)
  return results
}

NostrConnectSigner.subscriptionMethod = subscriptionMethod
NostrConnectSigner.publishMethod = publishMethod

// Connect to default relays
export function connectToRelays(relays: string[] = DEFAULT_RELAYS) {
  relayPool.group(relays)
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/nostr/core.ts 2>&1 | head -20`
Expected: No errors (or only unrelated errors)

**Step 3: Commit**

```bash
git add src/nostr/core.ts
git commit -m "feat: add applesauce core module with EventStore and RelayPool"
```

---

## Task 3: Create Account Persistence Module

**Files:**
- Create: `src/nostr/accountPersistence.ts`

**Step 1: Create the account persistence module**

```typescript
import type { IAccount, AccountManager } from 'applesauce-accounts'
import { ExtensionAccount, NostrConnectAccount } from 'applesauce-accounts/accounts'
import { ExtensionSigner, NostrConnectSigner } from 'applesauce-signers'

const STORAGE_KEY_ACCOUNTS = 'slidestr:accounts'
const STORAGE_KEY_ACTIVE = 'slidestr:active-account'

export type AccountMethod = 'extension' | 'nsec' | 'bunker' | 'npub'

export interface PersistedAccount {
  pubkey: string
  method: AccountMethod
  data?: string
  createdAt: number
}

export function saveAccountToStorage(
  account: IAccount,
  method: AccountMethod,
  data?: string
): void {
  try {
    const accounts = loadAccountsFromStorage()
    const existingIndex = accounts.findIndex(acc => acc.pubkey === account.pubkey)

    const accountData: PersistedAccount = {
      pubkey: account.pubkey,
      method,
      data: method === 'nsec' ? undefined : data, // Don't store nsec for security
      createdAt: existingIndex >= 0 ? accounts[existingIndex].createdAt : Date.now(),
    }

    if (existingIndex >= 0) {
      accounts[existingIndex] = accountData
    } else {
      accounts.push(accountData)
    }

    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts))
  } catch (error) {
    console.error('Failed to save account to storage:', error)
  }
}

export function loadAccountsFromStorage(): PersistedAccount[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ACCOUNTS)
    if (!stored) return []
    const accounts = JSON.parse(stored) as PersistedAccount[]
    return Array.isArray(accounts) ? accounts : []
  } catch (error) {
    console.error('Failed to load accounts from storage:', error)
    localStorage.removeItem(STORAGE_KEY_ACCOUNTS)
    return []
  }
}

export function saveActiveAccount(pubkey: string | null): void {
  try {
    if (pubkey) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, pubkey)
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE)
    }
  } catch (error) {
    console.error('Failed to save active account:', error)
  }
}

export function loadActiveAccount(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE)
  } catch (error) {
    console.error('Failed to load active account:', error)
    return null
  }
}

export function removeAccountFromStorage(pubkey: string): void {
  try {
    const accounts = loadAccountsFromStorage()
    const filtered = accounts.filter(acc => acc.pubkey !== pubkey)
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(filtered))

    const active = loadActiveAccount()
    if (active === pubkey) {
      saveActiveAccount(null)
    }
  } catch (error) {
    console.error('Failed to remove account from storage:', error)
  }
}

export function canRestoreExtensionAccount(): boolean {
  return typeof window !== 'undefined' && 'nostr' in window && window.nostr !== undefined
}

export function waitForExtension(timeoutMs: number = 3000): Promise<boolean> {
  return new Promise(resolve => {
    if (canRestoreExtensionAccount()) {
      resolve(true)
      return
    }

    const startTime = Date.now()
    const checkInterval = 100

    const check = () => {
      if (canRestoreExtensionAccount()) {
        resolve(true)
        return
      }

      if (Date.now() - startTime >= timeoutMs) {
        resolve(false)
        return
      }

      setTimeout(check, checkInterval)
    }

    check()
  })
}

export async function restoreAccount(
  accountData: PersistedAccount,
  skipExtensionWait: boolean = false
): Promise<IAccount | null> {
  try {
    switch (accountData.method) {
      case 'extension': {
        if (!skipExtensionWait && !canRestoreExtensionAccount()) {
          const extensionReady = await waitForExtension(3000)
          if (!extensionReady) {
            console.warn('Extension not available, cannot restore extension account')
            return null
          }
        } else if (skipExtensionWait && !canRestoreExtensionAccount()) {
          return null
        }
        const signer = new ExtensionSigner()
        const pubkey = await signer.getPublicKey()
        if (pubkey !== accountData.pubkey) {
          console.warn('Extension pubkey does not match stored pubkey')
          return null
        }
        return new ExtensionAccount(pubkey, signer)
      }

      case 'nsec': {
        console.warn('Nsec accounts require re-authentication for security')
        return null
      }

      case 'npub': {
        // Read-only accounts don't need restoration - just return null
        // They'll be handled by the session atom
        return null
      }

      case 'bunker': {
        if (!accountData.data) {
          console.warn('Bunker URI missing for account')
          return null
        }
        try {
          const signer = await NostrConnectSigner.fromBunkerURI(accountData.data)
          const pubkey = await signer.getPublicKey()
          if (pubkey !== accountData.pubkey) {
            console.warn('Bunker pubkey does not match stored pubkey')
            return null
          }
          return new NostrConnectAccount(pubkey, signer)
        } catch (error) {
          console.error('Failed to restore bunker account:', error)
          return null
        }
      }

      default:
        console.warn('Unknown account method:', accountData.method)
        return null
    }
  } catch (error) {
    console.error('Failed to restore account:', error)
    return null
  }
}

export async function restoreAccountsToManager(accountManager: AccountManager): Promise<void> {
  const persistedAccounts = loadAccountsFromStorage()
  const activePubkey = loadActiveAccount()

  if (persistedAccounts.length === 0) return

  const hasExtensionAccounts = persistedAccounts.some(acc => acc.method === 'extension')
  if (hasExtensionAccounts) {
    await waitForExtension(3000)
  }

  const restoredAccounts: IAccount[] = []

  for (const accountData of persistedAccounts) {
    const account = await restoreAccount(accountData, true)
    if (account) {
      restoredAccounts.push(account)
      accountManager.addAccount(account)
    } else if (accountData.method !== 'nsec' && accountData.method !== 'npub') {
      removeAccountFromStorage(accountData.pubkey)
    }
  }

  if (activePubkey) {
    const activeAccount = restoredAccounts.find(acc => acc.pubkey === activePubkey)
    if (activeAccount) {
      accountManager.setActive(activeAccount)
    } else {
      saveActiveAccount(null)
    }
  }
}

export function clearAllAccounts(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_ACCOUNTS)
    localStorage.removeItem(STORAGE_KEY_ACTIVE)
  } catch (error) {
    console.error('Failed to clear accounts:', error)
  }
}
```

**Step 2: Commit**

```bash
git add src/nostr/accountPersistence.ts
git commit -m "feat: add account persistence for applesauce accounts"
```

---

## Task 4: Create Relay Management Module

**Files:**
- Create: `src/nostr/relays.ts`

**Step 1: Create the relay management module**

```typescript
import { kinds } from 'nostr-tools'
import type { NostrEvent } from 'nostr-tools'
import { eventStore, relayPool, DEFAULT_RELAYS } from './core'

export interface ParsedRelays {
  read: string[]
  write: string[]
}

export function parseRelayList(event: NostrEvent): ParsedRelays {
  const read: string[] = []
  const write: string[] = []

  for (const tag of event.tags) {
    if (tag[0] !== 'r') continue
    const url = tag[1]?.replace(/\/$/, '')
    if (!url) continue
    const marker = tag[2]

    if (!marker || marker === 'read') read.push(url)
    if (!marker || marker === 'write') write.push(url)
  }

  return { read, write }
}

export function getUserRelays(pubkey: string): ParsedRelays {
  const relayList = eventStore.getReplaceable(kinds.RelayList, pubkey)
  if (!relayList) return { read: DEFAULT_RELAYS, write: DEFAULT_RELAYS }
  return parseRelayList(relayList)
}

export function getAuthorReadRelays(pubkey: string): string[] {
  const { write } = getUserRelays(pubkey)
  return write.length > 0 ? write : DEFAULT_RELAYS
}

export function getWriteRelays(pubkey: string | undefined): string[] {
  if (!pubkey) return DEFAULT_RELAYS
  const { write } = getUserRelays(pubkey)
  return write.length > 0 ? write : DEFAULT_RELAYS
}

export function syncUserRelays(pubkey: string): void {
  const { read, write } = getUserRelays(pubkey)
  const allRelays = [...new Set([...read, ...write, ...DEFAULT_RELAYS])]
  relayPool.group(allRelays)
}

export function getDefaultRelays(): string[] {
  return DEFAULT_RELAYS
}
```

**Step 2: Commit**

```bash
git add src/nostr/relays.ts
git commit -m "feat: add NIP-65 relay management module"
```

---

## Task 5: Migrate useEvents Hook

**Files:**
- Modify: `src/ngine/hooks/useEvents.ts`

**Step 1: Rewrite useEvents with observables**

```typescript
import { useState, useEffect, useMemo, useRef } from 'react'
import { useObservableState } from 'observable-hooks'
import { createTimelineLoader } from 'applesauce-loaders/loaders'
import type { Filter, NostrEvent } from 'nostr-tools'
import { eventStore, relayPool, cacheRequest, DEFAULT_RELAYS } from '../nostr/core'
import { hashSha256 } from './utils'

export interface SubscriptionOptions {
  disable?: boolean
  closeOnEose?: boolean
}

export default function useEvents(
  filter: Filter | Filter[],
  opts?: SubscriptionOptions,
  relays?: string[]
) {
  const [eose, setEose] = useState(false)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  const effectiveRelays = relays?.length ? relays : DEFAULT_RELAYS
  const normalizedFilter = Array.isArray(filter) ? filter[0] : filter

  const id = useMemo(() => hashSha256(filter), [filter])

  // Create and manage loader subscription
  useEffect(() => {
    if (opts?.disable || !normalizedFilter) return

    // Clean up previous subscription
    subscriptionRef.current?.unsubscribe()

    const loader = createTimelineLoader(relayPool, effectiveRelays, normalizedFilter, {
      eventStore,
      cache: cacheRequest,
      limit: 100,
    })

    const sub = loader().subscribe({
      complete: () => setEose(true),
      error: (err) => console.error('Timeline loader error:', err),
    })

    subscriptionRef.current = sub

    return () => {
      sub.unsubscribe()
      subscriptionRef.current = null
    }
  }, [id, opts?.disable])

  // Subscribe to timeline from event store
  const events = useObservableState(
    () => eventStore.timeline(normalizedFilter),
    []
  ) as NostrEvent[]

  return { id, eose, events }
}
```

**Step 2: Update utils import path**

The `hashSha256` function is in `src/ngine/utils.ts`. Verify it exists and exports correctly.

**Step 3: Commit**

```bash
git add src/ngine/hooks/useEvents.ts
git commit -m "refactor: migrate useEvents to applesauce observables"
```

---

## Task 6: Migrate useProfile Hook

**Files:**
- Modify: `src/ngine/hooks/useProfile.ts`

**Step 1: Rewrite useProfile with observables**

```typescript
import { useMemo } from 'react'
import { useObservableState } from 'observable-hooks'
import { kinds } from 'nostr-tools'
import { map } from 'rxjs/operators'
import { eventStore } from '../nostr/core'

export interface ProfileContent {
  name?: string
  display_name?: string
  displayName?: string
  about?: string
  picture?: string
  banner?: string
  nip05?: string
  lud06?: string
  lud16?: string
  website?: string
  [key: string]: unknown
}

export default function useProfile(pubkey: string): ProfileContent | undefined {
  const profile$ = useMemo(
    () =>
      eventStore.replaceable(kinds.Metadata, pubkey).pipe(
        map(event => {
          if (!event) return undefined
          try {
            return JSON.parse(event.content) as ProfileContent
          } catch {
            return undefined
          }
        })
      ),
    [pubkey]
  )

  return useObservableState(profile$, undefined)
}
```

**Step 2: Commit**

```bash
git add src/ngine/hooks/useProfile.ts
git commit -m "refactor: migrate useProfile to applesauce observables"
```

---

## Task 7: Migrate useEvent Hook

**Files:**
- Modify: `src/ngine/hooks/useEvent.ts`

**Step 1: Rewrite useEvent with observables**

```typescript
import { useMemo, useEffect, useRef } from 'react'
import { useObservableState } from 'observable-hooks'
import type { Filter, NostrEvent } from 'nostr-tools'
import { createTimelineLoader } from 'applesauce-loaders/loaders'
import { eventStore, relayPool, cacheRequest, DEFAULT_RELAYS } from '../nostr/core'
import { hashSha256 } from './utils'
import { SubscriptionOptions } from './useEvents'

export default function useEvent(
  filter: Filter,
  opts?: SubscriptionOptions,
  relays?: string[]
): NostrEvent | undefined {
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const effectiveRelays = relays?.length ? relays : DEFAULT_RELAYS

  const id = useMemo(() => hashSha256(filter), [filter])

  // Load event from relays
  useEffect(() => {
    if (opts?.disable) return

    subscriptionRef.current?.unsubscribe()

    const loader = createTimelineLoader(relayPool, effectiveRelays, filter, {
      eventStore,
      cache: cacheRequest,
      limit: 1,
    })

    const sub = loader().subscribe({
      error: (err) => console.error('Event loader error:', err),
    })

    subscriptionRef.current = sub

    return () => {
      sub.unsubscribe()
      subscriptionRef.current = null
    }
  }, [id, opts?.disable])

  // Subscribe to timeline and get first event
  const events = useObservableState(
    () => eventStore.timeline(filter),
    []
  ) as NostrEvent[]

  return events[0]
}
```

**Step 2: Commit**

```bash
git add src/ngine/hooks/useEvent.ts
git commit -m "refactor: migrate useEvent to applesauce observables"
```

---

## Task 8: Migrate useLatestEvent Hook

**Files:**
- Modify: `src/ngine/hooks/useLatestEvent.tsx`

**Step 1: Rewrite useLatestEvent with observables**

```typescript
import { useMemo, useEffect, useRef } from 'react'
import { useObservableState } from 'observable-hooks'
import type { Filter, NostrEvent } from 'nostr-tools'
import { map } from 'rxjs/operators'
import { createTimelineLoader } from 'applesauce-loaders/loaders'
import { eventStore, relayPool, cacheRequest, DEFAULT_RELAYS } from '../nostr/core'
import { SubscriptionOptions } from './useEvents'

export default function useLatestEvent(
  filter: Filter | Filter[],
  opts?: SubscriptionOptions,
  relays?: string[]
): NostrEvent | undefined {
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const effectiveRelays = relays?.length ? relays : DEFAULT_RELAYS
  const normalizedFilter = Array.isArray(filter) ? filter[0] : filter

  // Load events from relays
  useEffect(() => {
    if (opts?.disable || !normalizedFilter) return

    subscriptionRef.current?.unsubscribe()

    const loader = createTimelineLoader(relayPool, effectiveRelays, normalizedFilter, {
      eventStore,
      cache: cacheRequest,
      limit: 10,
    })

    const sub = loader().subscribe({
      error: (err) => console.error('Latest event loader error:', err),
    })

    subscriptionRef.current = sub

    return () => {
      sub.unsubscribe()
      subscriptionRef.current = null
    }
  }, [JSON.stringify(normalizedFilter), opts?.disable])

  // Subscribe to timeline and get latest (first) event
  const latestEvent$ = useMemo(
    () =>
      eventStore.timeline(normalizedFilter).pipe(
        map(events => events[0])
      ),
    [JSON.stringify(normalizedFilter)]
  )

  return useObservableState(latestEvent$, undefined)
}
```

**Step 2: Commit**

```bash
git add src/ngine/hooks/useLatestEvent.tsx
git commit -m "refactor: migrate useLatestEvent to applesauce observables"
```

---

## Task 9: Migrate Context and Authentication

**Files:**
- Modify: `src/ngine/context.tsx`

**Step 1: Rewrite context with AccountManager**

```typescript
import { useEffect, createContext, useContext, ReactNode } from 'react'
import { useAtom, Provider } from 'jotai'
import { useActiveAccount, useAccountManager } from 'applesauce-react/hooks'
import { AccountManager } from 'applesauce-accounts'
import { registerCommonAccountTypes } from 'applesauce-accounts/accounts'
import { ExtensionAccount, SimpleAccount, NostrConnectAccount } from 'applesauce-accounts/accounts'
import { ExtensionSigner, SimpleSigner, NostrConnectSigner } from 'applesauce-signers/signers'
import { EventFactory } from 'applesauce-factory'
import {
  AccountsProvider,
  EventStoreProvider,
  FactoryProvider,
} from 'applesauce-react/providers'
import { nip19 } from 'nostr-tools'
import type { NostrEvent } from 'nostr-tools'

import { eventStore, relayPool, connectToRelays } from '../nostr/core'
import { syncUserRelays, getWriteRelays } from '../nostr/relays'
import {
  saveAccountToStorage,
  saveActiveAccount,
  removeAccountFromStorage,
  restoreAccountsToManager,
} from '../nostr/accountPersistence'
import useRates from './hooks/useRates'
import useLatestEvent from './hooks/useLatestEvent'
import { sessionAtom, relayListAtom, followsAtom, ratesAtom } from './state'
import { Links } from './types'
import { getNip05For } from '../utils/nip05'

// Create account manager
const accountManager = new AccountManager()
registerCommonAccountTypes(accountManager)

const factory = new EventFactory({
  signer: accountManager.signer,
})

interface NgineContextProps {
  nip07Login: () => Promise<string | undefined>
  nip46Login: (url: string) => Promise<string | undefined>
  nsecLogin: (nsec: string) => Promise<string>
  npubLogin: (npub: string) => Promise<string>
  sign: (ev: Omit<NostrEvent, 'pubkey' | 'id' | 'sig'>) => Promise<NostrEvent | undefined>
  logOut: () => void
  links?: Links
}

const NgineContext = createContext<NgineContextProps>({
  nip07Login: () => Promise.reject(),
  nip46Login: () => Promise.reject(),
  nsecLogin: () => Promise.reject(),
  npubLogin: () => Promise.reject(),
  sign: () => Promise.reject(),
  logOut: () => {},
  links: {},
})

interface NgineProviderProps {
  links?: Links
  children: ReactNode
  enableFiatRates?: boolean
}

function SessionProvider({ pubkey, children }: { pubkey: string; children: ReactNode }) {
  const [contactList, setContacts] = useAtom(followsAtom)
  const [relayList, setRelayList] = useAtom(relayListAtom)

  // Contacts
  const contacts = useLatestEvent(
    { kinds: [3], authors: [pubkey] },
    { closeOnEose: false }
  )

  useEffect(() => {
    if (contacts) {
      const lastSeen = contactList?.created_at ?? 0
      const createdAt = contacts.created_at ?? 0
      if (createdAt > lastSeen) {
        setContacts(contacts as NostrEvent)
      }
    }
  }, [contacts])

  // Relays
  const relays = useLatestEvent(
    { kinds: [10002], authors: [pubkey] },
    { closeOnEose: false }
  )

  useEffect(() => {
    if (relays) {
      const lastSeen = relayList?.created_at ?? 0
      const createdAt = relays.created_at ?? 0
      if (createdAt > lastSeen) {
        setRelayList(relays as NostrEvent)
        syncUserRelays(pubkey)
      }
    }
  }, [relays])

  return <>{children}</>
}

function AccountRestoreInit() {
  useEffect(() => {
    restoreAccountsToManager(accountManager).catch(error => {
      console.error('Failed to restore accounts:', error)
    })
  }, [])
  return null
}

export const NgineProvider = ({ links, children, enableFiatRates = false }: NgineProviderProps) => {
  const [session, setSession] = useAtom(sessionAtom)
  const [, setFollows] = useAtom(followsAtom)
  const [, setRelays] = useAtom(relayListAtom)
  const [, setRates] = useAtom(ratesAtom)
  const rates = useRates(!enableFiatRates)

  useEffect(() => {
    setRates(rates)
  }, [rates])

  useEffect(() => {
    connectToRelays()
  }, [])

  async function nip07Login() {
    const signer = new ExtensionSigner()
    const pubkey = await signer.getPublicKey()
    const account = new ExtensionAccount(pubkey, signer)
    await accountManager.addAccount(account)
    saveAccountToStorage(account, 'extension')
    saveActiveAccount(pubkey)
    setSession({ method: 'nip07', pubkey })
    return pubkey
  }

  async function getNostrConnectSettings(url: string) {
    if (url.includes('bunker://')) {
      const asURL = new URL(url)
      const relays = asURL.searchParams.getAll('relay')
      const pubkey = asURL.pathname.replace(/^\/\//, '')
      return { relays, pubkey, bunkerUri: url }
    } else {
      const user = await getNip05For(url)
      if (user) {
        const pubkey = user.pubkey
        const relays = user.nip46 && user.nip46.length > 0 ? user.nip46 : ['wss://relay.nsecbunker.com']
        const bunkerUri = `bunker://${pubkey}?${relays.map(r => `relay=${encodeURIComponent(r)}`).join('&')}`
        return { pubkey, relays, bunkerUri }
      }
    }
  }

  async function nip46Login(url: string) {
    const settings = await getNostrConnectSettings(url)
    if (settings) {
      const { pubkey, bunkerUri } = settings
      const signer = await NostrConnectSigner.fromBunkerURI(bunkerUri)
      const account = new NostrConnectAccount(pubkey, signer)
      await accountManager.addAccount(account)
      saveAccountToStorage(account, 'bunker', bunkerUri)
      saveActiveAccount(pubkey)
      setSession({ method: 'nip46', pubkey, bunker: { privkey: '', relays: settings.relays } })
      return pubkey
    }
  }

  async function npubLogin(pubkeyOrNpub: string) {
    const pubkey = pubkeyOrNpub.startsWith('npub')
      ? nip19.decode(pubkeyOrNpub).data as string
      : pubkeyOrNpub
    setSession({ method: 'npub', pubkey })
    saveActiveAccount(pubkey)
    return pubkey
  }

  async function nsecLogin(privkey: string) {
    const signer = SimpleSigner.fromKey(privkey)
    const pubkey = await signer.getPublicKey()
    const account = new SimpleAccount(pubkey, signer)
    await accountManager.addAccount(account)
    saveAccountToStorage(account, 'nsec') // Don't store nsec for security
    saveActiveAccount(pubkey)
    setSession({ method: 'nsec', pubkey, privkey })
    return pubkey
  }

  async function sign(ev: Omit<NostrEvent, 'pubkey' | 'id' | 'sig'>) {
    const activeAccount = accountManager.activeAccount
    if (!activeAccount?.signer) {
      console.log('Could not sign event - no active signer')
      return undefined
    }
    const unsigned = {
      ...ev,
      pubkey: activeAccount.pubkey,
      created_at: ev.created_at ?? Math.floor(Date.now() / 1000),
    }
    const signed = await activeAccount.signer.signEvent(unsigned)
    return signed
  }

  function logOut() {
    const activeAccount = accountManager.activeAccount
    if (activeAccount) {
      accountManager.removeAccount(activeAccount.pubkey)
      removeAccountFromStorage(activeAccount.pubkey)
    }
    saveActiveAccount(null)
    setSession(null)
    setFollows(null)
    setRelays(null)
  }

  return (
    <AccountsProvider manager={accountManager}>
      <EventStoreProvider eventStore={eventStore}>
        <FactoryProvider factory={factory}>
          <NgineContext.Provider
            value={{
              nip07Login,
              nip46Login,
              nsecLogin,
              npubLogin,
              sign,
              logOut,
              links,
            }}
          >
            <Provider>
              <AccountRestoreInit />
              {session ? <SessionProvider pubkey={session.pubkey}>{children}</SessionProvider> : children}
            </Provider>
          </NgineContext.Provider>
        </FactoryProvider>
      </EventStoreProvider>
    </AccountsProvider>
  )
}

export const useExtensionLogin = () => {
  const context = useContext(NgineContext)
  return context.nip07Login
}

export const usePubkeyLogin = () => {
  const context = useContext(NgineContext)
  return context.npubLogin
}

export const useBunkerLogin = () => {
  const context = useContext(NgineContext)
  return context.nip46Login
}

export const useNsecLogin = () => {
  const context = useContext(NgineContext)
  return context.nsecLogin
}

export const useSign = () => {
  const context = useContext(NgineContext)
  return context.sign
}

export const useSigner = () => {
  const activeAccount = useActiveAccount()
  return activeAccount?.signer
}

type LinkType = keyof Links

export const useLink = (type: LinkType, value: string): string | null => {
  const context = useContext(NgineContext)
  if (context.links && context.links[type]) {
    return context.links[type](value)
  }
  return null
}

export const useLinks = (): Links | undefined => {
  const context = useContext(NgineContext)
  return context.links
}

export const useLogOut = () => {
  const context = useContext(NgineContext)
  return context.logOut
}

// Legacy compatibility - useNDK replaced with relayPool access
export const useNDK = () => {
  console.warn('useNDK is deprecated - use applesauce hooks instead')
  return { relayPool, eventStore }
}
```

**Step 2: Commit**

```bash
git add src/ngine/context.tsx
git commit -m "refactor: migrate NgineProvider to applesauce AccountManager"
```

---

## Task 10: Update App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Simplify App.tsx (providers now in context)**

```typescript
import './App.css'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { defaultHashTags } from './components/env'
import Home from './components/Home'
import { NgineProvider } from './ngine/context'
import Layout from './components/Layout/Layout'
import SlideShow from './components/SlideShow'

const App = () => {
  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [
        {
          path: '/',
          element: <Navigate to={'/tags/' + defaultHashTags.join(',')} replace />,
        },
        {
          path: 'global',
          element: <SlideShow />,
        },
        {
          path: 'list/:list',
          element: <SlideShow />,
        },
        {
          path: 'tags/:tags',
          element: <SlideShow />,
        },
        {
          path: 'topic/:topic',
          element: <SlideShow />,
        },
        {
          path: 'profile/:npub',
          element: <SlideShow />,
        },
        {
          path: 'p/:npub',
          element: <SlideShow />,
        },
        {
          path: '/follows',
          element: <SlideShow />,
        },
        {
          path: '/:npub',
          element: <SlideShow />,
        },
      ],
    },
  ])

  return (
    <NgineProvider>
      <RouterProvider router={router} />
    </NgineProvider>
  )
}

export default App
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: simplify App.tsx - NDK init moved to NgineProvider"
```

---

## Task 11: Update Publishing Hooks

**Files:**
- Modify: `src/utils/useZapAndReaction.ts`
- Modify: `src/utils/useBookMarks.ts`
- Modify: `src/components/FollowButton/FollowButton.tsx`

**Step 1: Update useZapAndReaction**

Replace NDKEvent usage with direct event signing and publishing via applesauce.

**Step 2: Update useBookMarks**

Replace NDKEvent with applesauce signing.

**Step 3: Update FollowButton**

Replace NDKEvent with applesauce signing.

**Step 4: Commit**

```bash
git add src/utils/useZapAndReaction.ts src/utils/useBookMarks.ts src/components/FollowButton/FollowButton.tsx
git commit -m "refactor: migrate publishing to applesauce signing"
```

---

## Task 12: Remove NDK Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Remove old dependencies**

Run:
```bash
npm uninstall @nostr-dev-kit/ndk @nostr-dev-kit/ndk-cache-dexie @tanstack/react-query
```

**Step 2: Clean up any remaining NDK imports**

Search for remaining imports:
```bash
grep -r "@nostr-dev-kit/ndk" src/ --include="*.ts" --include="*.tsx"
grep -r "@tanstack/react-query" src/ --include="*.ts" --include="*.tsx"
```

Fix any remaining imports.

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove NDK and React Query dependencies"
```

---

## Task 13: Test and Fix Issues

**Step 1: Run development server**

Run: `npm run dev`

**Step 2: Test authentication**

- Test NIP-07 extension login
- Test bunker login
- Test nsec login
- Test npub read-only login
- Test logout

**Step 3: Test event loading**

- Verify images load in slideshow
- Verify profiles load
- Verify reactions display

**Step 4: Test publishing**

- Test like/reaction
- Test bookmark
- Test follow/unfollow

**Step 5: Fix any issues found**

**Step 6: Final commit**

```bash
git add -A
git commit -m "fix: address issues found during testing"
```

---

## Summary

This plan migrates slidestr from NDK to applesauce in 13 tasks:

1. Install dependencies
2. Create core nostr module (EventStore, RelayPool)
3. Create account persistence
4. Create relay management
5. Migrate useEvents hook
6. Migrate useProfile hook
7. Migrate useEvent hook
8. Migrate useLatestEvent hook
9. Migrate context and authentication
10. Update App.tsx
11. Update publishing hooks
12. Remove NDK dependencies
13. Test and fix issues

Each task is designed to be committed independently, allowing for incremental progress and easy rollback if needed.
