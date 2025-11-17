import './SlideShow.css';
import React, { useMemo, useState } from 'react';
import { adultContentTags, adultNPubs, mixedAdultNPubs } from './env';
import Settings from './Settings';
import SlideView from './SlideView';
import { nip19 } from 'nostr-tools';
import AdultContentInfo from './AdultContentInfo';
import useNav from '../utils/useNav';
import { useGlobalState } from '../utils/globalState';
import ScrollView from './ScrollView/ScrollView';
import useZapsAndReations from '../utils/useZapAndReaction';
import useEvents from '../ngine/hooks/useEvents';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import MasonryView from './MasonryView/MasonryView';
import GridView from './GridView';
import useWindowSize from '../utils/useWindowSize';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../ngine/state';
import useProfile from '../ngine/hooks/useProfile';
import useBookMarks from '../utils/useBookMarks';
import useImageFilter from '../utils/useImageFilter';
import useProcessedPosts from '../utils/useProcessedPosts';
import useExtractedImages from '../utils/useExtractedImages';
import useKeyboardShortcuts from '../utils/useKeyboardShortcuts';
import BottomControls from './BottomControls';
import TopControls from './TopControls';

// type AlbyNostr = typeof window.nostr & { enabled: boolean };

/*
FEATURES:
- When one relay is not available the whole app stops working
- Login automatically / Save log in user
- the image grid div is updated constantly, why?
- Improve login (show login dialog, show login status)
- Detect if user/post does not have zap capability and show warning
- Retrieve reactions (likes, zaps) for all posts iteratively (pagination)
- Store posts separately from image urls to track likes/zaps per post
- improve mobile support
- widescreen mobile details view should be 2 columns
- improve large grid performance by adding images on scroll
- how to get back from a filtered user/tag to the full feed?
- always update title (grid and slideshow, maybe details too?)
- add respost/reply filter to the settings dialog
- Support re-posts and replies (incl. filter in settings)
- show tags 
- Suche der People Browser????
- Actions: Repost, Reply, Block, Mute, Follow, Unfollow, Add to Album
- preview for videos
- jump to note
- negative hashtag filter
- login to use your own feed
- login to use your your blocked/muted list
- Support people lists and note lists 
- flag/mute button?
- Add to album button? Favorite button?
- Prevent duplicates (shuffle?), prevent same author twice in a row
- show content warning?
- Support Deleted Events
- Prevent duplicate images (shuffle? history?)
*/

export type ViewMode = 'grid' | 'slideshow' | 'scroll';

const SlideShow = () => {
  const { width } = useWindowSize();
  const isMobile = useMemo(() => !!width && width <= 768, [width]);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSettings, setShowSettings] = useState(false);

  const { nav, currentSettings: settings } = useNav();
  const [state] = useGlobalState();
  const [imageIdx, setImageIdx] = useState<number | undefined>();

  const session = useSession();
  const profile = useProfile(session?.pubkey || ' ');
  const userNPub = session ? (nip19.npubEncode(session?.pubkey) as string) : undefined;
  const { bookmarkClick, bookmarkState } = useBookMarks(session?.pubkey, state.activeImage);

  const { zapClick, heartClick, zapState, heartState, repostClick, repostState } = useZapsAndReations(
    state.activeImage,
    userNPub
  );
  const navigate = useNavigate();

  // Use custom hooks to manage complex logic
  const filter = useImageFilter(settings);
  const { events } = useEvents(filter, {
    cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
    // when seeing global, close stream because of too many updates.
    closeOnEose: settings.npubs.length == 0 && settings.tags.length == 0,
  });

  const posts = useProcessedPosts(events, settings);
  const images = useExtractedImages(posts, settings);

  useKeyboardShortcuts({
    showSettings,
    setViewMode,
    setShowSettings,
    nav,
    settings,
  });

  const showAdultContentWarning =
    !settings.showAdult &&
    (adultContentTags.some(t => settings.tags.includes(t)) ||
      adultNPubs.some(p => settings.npubs.includes(p)) ||
      mixedAdultNPubs.some(p => settings.npubs.includes(p)));

  if (showAdultContentWarning) {
    return <AdultContentInfo></AdultContentInfo>;
  }

  return (
    <>
      {showSettings && <Settings onClose={() => setShowSettings(false)} setViewMode={setViewMode}></Settings>}

      <TopControls
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNavigateHome={() => navigate(`/${settings.type !== 'all' ? `?type=${settings.type}` : ''}`)}
      />

      <BottomControls
        showNavButtons={state.showNavButtons}
        viewMode={viewMode}
        isMobile={isMobile}
        sessionPubkey={session?.pubkey}
        activeImage={state.activeImage}
        bookmarkState={bookmarkState}
        bookmarkClick={bookmarkClick}
        repostState={repostState}
        repostClick={repostClick}
        heartState={heartState}
        heartClick={heartClick}
        zapState={zapState}
        zapClick={zapClick}
        profile={profile}
        setViewMode={setViewMode}
        setShowSettings={setShowSettings}
      />

      {viewMode == 'grid' &&
        (isMobile ? (
          <GridView
            images={images.current}
            settings={settings}
            setCurrentImage={setImageIdx}
            currentImage={imageIdx}
            setViewMode={setViewMode}
          ></GridView>
        ) : (
          <MasonryView
            images={images.current}
            settings={settings}
            setCurrentImage={setImageIdx}
            currentImage={imageIdx}
            setViewMode={setViewMode}
          ></MasonryView>
        ))}
      {viewMode == 'scroll' && (
        <ScrollView
          images={images.current}
          settings={settings}
          setCurrentImage={setImageIdx}
          currentImage={imageIdx}
          setViewMode={setViewMode}
        ></ScrollView>
      )}
      {viewMode == 'slideshow' && <SlideView images={images} settings={settings} setViewMode={setViewMode}></SlideView>}
    </>
  );
};

export default SlideShow;
