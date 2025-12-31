import { nip04, finalizeEvent } from 'nostr-tools';
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

  // Convert secret to bytes for signing
  const secretBytes = hexToBytes(secret);

  // Encrypt with NIP-04
  const encryptedContent = nip04.encrypt(secretBytes, walletPubkey, request);

  // Create kind 23194 event (NWC request)
  const unsignedEvent = {
    kind: 23194,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['p', walletPubkey]],
    content: encryptedContent,
  };

  // Simple signing with secret key (NWC uses the secret as private key)
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
    const decrypted = nip04.decrypt(secretBytes, walletPubkey, responseEvent.content);
    const result = JSON.parse(decrypted);

    if (result.error) {
      return { error: result.error.message || 'Payment failed' };
    }

    return { preimage: result.result?.preimage || '' };
  } catch (err) {
    return { error: 'NWC request timed out' };
  }
}
