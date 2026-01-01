import { useState, useMemo } from 'react';
import { useAtom } from 'jotai';

import { useSign } from '../../context/NgineContext';
import { followsAtom, useSession } from '../../state/atoms';
import { relayPool, eventStore } from '../../nostr/core';
import { getWriteRelays } from '../../nostr/relays';

interface FollowButtonProps {
  pubkey: string;
  className?: string;
}

// todo: follow tags, communities, etc

function unixNow() {
  return Math.round(Date.now() / 1000);
}

export default function FollowButton({ pubkey, className, ...rest }: FollowButtonProps) {
  const sign = useSign();
  const session = useSession();
  const [isBusy, setIsBusy] = useState(false);
  const [contacts, setContacts] = useAtom(followsAtom);
  const loggedInUser = session?.pubkey;
  const canSign = !!session && session.method !== 'npub';

  const isFollowed = useMemo(() => {
    console.log(contacts, pubkey);
    return contacts?.tags.some(t => t[0] === 'p' && t[1] === pubkey);
  }, [contacts, pubkey]);

  async function follow(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    if (!session?.pubkey) return;

    setIsBusy(true);
    const tags = (contacts?.tags || []).concat([['p', pubkey]]);
    const unsigned = {
      kind: 3, // Contacts
      tags,
      created_at: unixNow(),
      content: '',
    };

    try {
      const signed = await sign(unsigned);
      if (!signed) {
        setIsBusy(false);
        return;
      }

      await relayPool.publish(getWriteRelays(session.pubkey), signed);
      eventStore.add(signed);
      setContacts(signed);
    } catch (error) {
      console.error(error);
    } finally {
      setIsBusy(false);
    }
  }

  async function unfollow(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    if (!session?.pubkey) return;

    setIsBusy(true);
    const tags = (contacts?.tags || []).filter(t => t[1] !== pubkey);
    const unsigned = {
      kind: 3, // Contacts
      tags,
      created_at: unixNow(),
      content: '',
    };

    try {
      const signed = await sign(unsigned);
      if (!signed) {
        setIsBusy(false);
        return;
      }

      await relayPool.publish(getWriteRelays(session.pubkey), signed);
      eventStore.add(signed);
      setContacts(signed);
    } catch (error) {
      console.error(error);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <button
      disabled={!pubkey || !contacts || !canSign || isBusy}
      //={isBusy}
      //variant="solid"
      style={{ backgroundColor: isFollowed ? '#888' : 'white' }}
      onClick={e => (isFollowed ? unfollow(e) : follow(e))}
      className={className}
      //colorScheme={isFollowed ? "red" : "brand"}
      {...rest}
    >
      {isFollowed ? 'Unfollow' : 'Follow'}
    </button>
  );
}
