import { useState, useEffect, useRef } from 'react';
import { kinds, type NostrEvent } from 'nostr-tools';
import { bech32 } from 'bech32';
import { ProfileContent } from '../hooks/useProfile';
import { unixNow } from '../utils/time';

const BECH32_MAX_BYTES = 42000;

interface LNURLService {
  nostrPubkey?: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
  callback: string;
  commentAllowed?: number;
}

export function useLnurl(profile: ProfileContent | undefined) {
  const [data, setData] = useState<LNURLService | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastKey = useRef<string | undefined>(undefined);

  const key = profile?.lud16;

  useEffect(() => {
    if (key === lastKey.current) return;
    lastKey.current = key;

    if (!key) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    loadService(key)
      .then(result => {
        setData(result);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
      });
  }, [key]);

  return { data, isLoading, error };
}

export function useLnurlVerify(lnurlVerifyUrl?: string) {
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    let pollingInterval: ReturnType<typeof setTimeout> | undefined;

    const pollLnurlPayment = async () => {
      try {
        if (lnurlVerifyUrl) {
          const response = await fetch(lnurlVerifyUrl);
          const data = await response.json();

          if (data.settled) {
            setIsPaid(true);
            clearInterval(pollingInterval);
          }
        }
      } catch (error) {
        console.error('Error polling LNURL:', error);
      }
    };

    if (lnurlVerifyUrl) {
      pollingInterval = setInterval(pollLnurlPayment, 1000);

      return () => clearInterval(pollingInterval);
    }

    return () => {};
  }, [lnurlVerifyUrl]);

  return isPaid;
}

export function useLnurls(profiles: ProfileContent[]) {
  const [results, setResults] = useState<(LNURLService | null)[]>([]);
  const lastKeys = useRef<string>('');

  useEffect(() => {
    const keys = profiles.map(p => p.lud16 ?? '').join(',');
    if (keys === lastKeys.current) return;
    lastKeys.current = keys;

    Promise.all(
      profiles.map(async profile => {
        if (profile.lud16) {
          return loadService(profile.lud16);
        }
        return null;
      })
    ).then(setResults);
  }, [profiles]);

  return results.map(data => ({ data }));
}

function bech32ToText(str: string) {
  const decoded = bech32.decode(str, BECH32_MAX_BYTES);
  const buf = bech32.fromWords(decoded.words);
  return new TextDecoder().decode(Uint8Array.from(buf));
}

async function fetchJson<T>(url: string) {
  const rsp = await fetch(url);
  if (rsp.ok) {
    const data: T = await rsp.json();
    return data;
  }
  return null;
}

export async function loadService(service?: string): Promise<LNURLService | null> {
  if (service) {
    const isServiceUrl = service.toLowerCase().startsWith('lnurl');
    if (isServiceUrl) {
      const serviceUrl = bech32ToText(service);
      return await fetchJson(serviceUrl);
    } else {
      const ns = service.split('@');
      return await fetchJson(`https://${ns[1]}/.well-known/lnurlp/${ns[0]}`);
    }
  }
  return null;
}

export async function loadInvoice(payService: LNURLService, amount: number, comment?: string, nostr?: NostrEvent) {
  if (!amount || !payService) return null;

  const callback = new URL(payService.callback);
  const query = new Map<string, string>();
  if (callback.search.length > 0) {
    callback.search
      .slice(1)
      .split('&')
      .forEach(a => {
        const pSplit = a.split('=');
        query.set(pSplit[0], pSplit[1]);
      });
  }
  query.set('amount', Math.floor(amount * 1000).toString());
  if (comment && payService?.commentAllowed) {
    query.set('comment', comment);
  }
  if (payService.nostrPubkey && nostr) {
    query.set('nostr', JSON.stringify(nostr));
  }

  const baseUrl = `${callback.protocol}//${callback.host}${callback.pathname}`;
  // @ts-ignore
  const queryJoined = [...query.entries()].map(v => `${v[0]}=${encodeURIComponent(v[1])}`).join('&');
  try {
    const rsp = await fetch(`${baseUrl}?${queryJoined}`);
    if (rsp.ok) {
      const data = await rsp.json();
      if (data.status === 'ERROR') {
        throw new Error(data.reason);
      } else {
        return data;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

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
    kind: kinds.ZapRequest,
    created_at: unixNow(),
    pubkey: senderPubkey,
    tags,
    content: comment || '',
  };
}
