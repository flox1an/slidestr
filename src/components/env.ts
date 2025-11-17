// Re-export data from organized data files
export { topics, defaultHashTags, visibleHashTags } from '../data/topics';
export type { Topic } from '../data/topics';
export {
  adultContentTags,
  mixedAdultNPubs,
  adultNPubs,
  adultPublicKeys,
  mixedAdultPublicKeys,
} from '../data/contentFilters';
export { blockedNPubs, blockedPublicKeys, spamAccounts } from '../data/blocklist';

// Application configuration
export const imageProxy = import.meta.env.VITE_IMAGE_PROXY || 'https://images.slidestr.net';

export const appName = import.meta.env.VITE_APP_NAME || 'slidestr.net';

export const publicUrl = import.meta.env.VITE_PUBLIC_URL || 'https://slidestr.net';

// Default Nostr relays
export const defaultRelays = [
  // 'ws://localhost:4869',
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://nos.lol',
  'wss://nostr.wine',
  'wss://relay.primal.net',
  'wss://relay.mostr.pub',
  'wss://purplepag.es/', // needed for user profiles
];
