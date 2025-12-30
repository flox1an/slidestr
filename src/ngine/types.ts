import type { ReactNode } from 'react';
import type { NostrEvent } from 'nostr-tools';
import { kinds } from 'nostr-tools';

// Reactions - using nostr-tools kinds instead of NDKKind

export type ReactionKind =
  | typeof kinds.Zap
  | typeof kinds.ShortTextNote
  | typeof kinds.Reaction
  | typeof kinds.Repost
  | typeof kinds.GenericRepost
  | typeof kinds.Bookmarksets
  | typeof kinds.RelayList
  | typeof kinds.Emojisets;

// Relays

export interface Relay {
  url: string;
  read: boolean;
  write: boolean;
}

// Links

export interface Links {
  npub?: (npub: string) => string;
  nrelay?: (nrelay: string) => string;
  nprofile?: (nprofile: string) => string;
  nevent?: (nevent: string) => string;
  naddr?: (naddr: string) => string;
  t?: (t: string) => string;
}

// Sessions

// todo: nip05 with nip46
export type LoginMethod = 'nip07' | 'nip46' | 'npub' | 'nsec';

export interface Session {
  method: LoginMethod;
  pubkey: string;
  privkey?: string;
  bunker?: {
    privkey: string;
    relays: string[];
  };
}

// Components

export type Fragment = string | ReactNode;

export type EventComponent = (props: EventProps) => ReactNode;
export type Components = Record<number, EventComponent>;

export interface EventProps {
  event: NostrEvent;
  components?: Components;
  reactionKinds?: ReactionKind[];
}

// Nostr

export type Tag = string[];
export type Tags = Tag[];

// Money

export type RateSymbol = 'BTCUSD' | 'BTCEUR';
export type FiatCurrency = 'USD' | 'EUR';
export type Currency = 'BTC' | 'USD' | 'EUR';

export interface Rates {
  time: number;
  ask: number;
  bid: number;
  low: number;
  high: number;
  currency: FiatCurrency;
  symbol: RateSymbol;
}
