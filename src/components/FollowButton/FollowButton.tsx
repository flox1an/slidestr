import { useState, useMemo } from "react";
import { useAtom } from "jotai";
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";

import { useNDK, useSigner } from "../../ngine/context";
import { followsAtom, useSession } from "../../ngine/state";

interface FollowButtonProps {
  pubkey: string;
  className?: string;
}

// todo: follow tags, communities, etc

function unixNow() {
  return Math.round(Date.now() / 1000);
}

export default function FollowButton({ pubkey, className, ...rest }: FollowButtonProps) {
  const ndk = useNDK();
  const canSign = useSigner();
  const [isBusy, setIsBusy] = useState(false);
  const session = useSession();
  const [contacts, setContacts] = useAtom(followsAtom);
  const loggedInUser = session?.pubkey;
  const isFollowed = useMemo(() => {
    console.log(contacts, pubkey);
    return contacts?.tags.some((t) => t[0] === "p" && t[1] === pubkey);
  }, [contacts, pubkey]);

  async function follow(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsBusy(true);
    const tags = (contacts?.tags || []).concat([["p", pubkey]]);
    const ev = {
      pubkey: loggedInUser as string,
      kind: NDKKind.Contacts,
      tags,
      created_at: unixNow(),
      content: "",
    };
    try {
      const signed = new NDKEvent(ndk, ev);
      await signed.sign();
      await signed.publish();
      setContacts(signed.rawEvent());
    } catch (error) {
      console.error(error);
    } finally {
      setIsBusy(false);
    }
  }

  async function unfollow(e: React.MouseEvent<HTMLButtonElement, MouseEvent>)  {
    e.stopPropagation();
    setIsBusy(true);
    const tags = (contacts?.tags || []).filter((t) => t[1] !== pubkey);
    const ev = {
      pubkey: loggedInUser as string,
      kind: NDKKind.Contacts,
      tags,
      created_at: unixNow(),
      content: "",
    };
    try {
      const signed = new NDKEvent(ndk, ev);
      await signed.sign();
      await signed.publish();
      setContacts(signed.rawEvent());
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
      onClick={e=> isFollowed ? unfollow(e) : follow(e)}
      className={className}
      //colorScheme={isFollowed ? "red" : "brand"}
      {...rest}
    >
      {isFollowed ? (
        "Unfollow"
      ) : (
        "Follow"
      )}
    </button>
  );
}
