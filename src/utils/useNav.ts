import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export type Settings = {
  showNsfw: boolean;
  showReplies: boolean;
  showReposts: boolean;
  tags: string[];
  npubs: string[];
};

const useNav = () => {
  const { tags, npub } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentSettings: Settings = useMemo(() => {
    const nsfw = searchParams.get('nsfw') === 'true';
    const replies = searchParams.get('replies') === 'true';
    const reposts = searchParams.get('reposts') === 'true';

    console.log(`tags = ${tags}, npub = ${npub}, nsfw = ${nsfw}, replies = ${replies}, reposts = ${reposts}`);

    const useTags = tags?.split(',') || [];

    return {
      tags: useTags,
      npubs: npub ? [npub] : [],
      showNsfw: nsfw,
      showReplies: replies,
      showReposts: reposts,
    };
  }, [tags, npub, searchParams]);

  const nav = (settings: Settings) => {
    const validTags = settings.tags.filter(t => t.length > 0);
    const validNpubs = settings.npubs.filter(t => t.length > 0);

    const searchParams = [];
    if (settings.showNsfw) {
      searchParams.push('nsfw=true');
    }
    if (settings.showReplies) {
      searchParams.push('replies=true');
    }
    if (settings.showReposts) {
      searchParams.push('reposts=true');
    }

    const postfix = searchParams.length > 0 ? `?${searchParams.join('&')}` : '';

    if (validTags.length > 0) {
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
