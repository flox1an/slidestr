import { useMemo } from 'react';
import { defaultHashTags } from '../components/env';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export type Settings = {
  showNsfw: boolean;
  tags: string[];
  npubs: string[];
};

const useNav = () => {
  const { tags, npub } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentSettings: Settings = useMemo(() => {
    const nsfw = searchParams.get('nsfw') === 'true';

    console.log(`tags = ${tags}, npub = ${npub}, nsfw = ${nsfw}`);

    const useTags = tags?.split(',') || [];

    return {
      tags: useTags,
      npubs: npub ? [npub] : [],
      showNsfw: nsfw,
    };
  }, [tags, npub, searchParams]);

  const nav = (settings: Settings) => {
    const nsfwPostfix = settings.showNsfw ? '?nsfw=true' : '';
    const validTags = settings.tags.filter(t => t.length > 0);
    const validNpubs = settings.npubs.filter(t => t.length > 0);

    if (validTags.length > 0) {
      navigate(`/tags/${validTags.join('%2C')}${nsfwPostfix}`);
    } else if (validNpubs.length == 1) {
      navigate(`/p/${validNpubs[0]}${nsfwPostfix}`);
    } else {
      navigate(`/${nsfwPostfix}`);
    }
  };

  return { nav, currentSettings };
};

export default useNav;
