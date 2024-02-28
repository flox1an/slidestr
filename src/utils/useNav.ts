import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export type Settings = {
  showAdult: boolean;
  showReplies: boolean;
  showReposts: boolean;
  tags: string[];
  npubs: string[];
  followers: boolean;
  list?: string;
  topic?: string;
};

const useNav = () => {
  const { tags, npub, list, topic } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentSettings: Settings = useMemo(() => {
    const adult = searchParams.get('adult') === 'true' || searchParams.get('nsfw') === 'true';
    const replies = searchParams.get('replies') === 'true';
    const reposts = searchParams.get('reposts') === 'true';
    const followers = window.location.pathname.startsWith('/followers');
    const useTags = tags?.split(',') || [];

    return {
      tags: useTags,
      npubs: npub ? [npub] : [],
      showAdult: adult,
      showReplies: replies,
      showReposts: reposts,
      followers,
      list,
      topic,
    };
  }, [tags, npub, searchParams, list, topic]);

  const nav = (settings: Settings) => {
    const validTags = settings.tags.filter(t => t.length > 0);
    const validNpubs = settings.npubs.filter(t => t.length > 0);

    const searchParams = [];
    if (settings.showAdult) {
      searchParams.push('adult=true');
    }
    if (settings.showReplies) {
      searchParams.push('replies=true');
    }
    if (settings.showReposts) {
      searchParams.push('reposts=true');
    }

    const postfix = searchParams.length > 0 ? `?${searchParams.join('&')}` : '';
    if (settings.topic) {
      navigate(`/topic/${settings.topic}${postfix}`);
    } else if (settings.followers) {
      navigate(`/followers${postfix}`);
    } else if (settings.list !== undefined) {
      navigate(`/list/${settings.list}${postfix}`);
    } else if (validTags.length > 0) {
      navigate(`/tags/${validTags.join('%2C')}${postfix}`);
    } else if (validNpubs.length == 1) {
      navigate(`/p/${validNpubs[0]}${postfix}`);
    } else {
      navigate(`/${postfix}`);
    }
  };

  return { nav, currentSettings };
};

export default useNav;
