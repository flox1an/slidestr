import React, { useEffect, useRef, useState } from 'react';
import AuthorProfile from '../AuthorProfile/AuthorProfile';
import useActiveProfile from '../../utils/useActiveProfile';
import { topics } from '../env';
import { urlFix } from '../nostrImageDownload';
import useNav, { Settings } from '../../utils/useNav';
import { ViewMode } from '../SlideShow';
import './PageHeader.css';
import IconSearch from '../Icons/IconSearch';

type PageHeaderProps = {
  settings: Settings;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  searchText: string | undefined;
  setSearchText: React.Dispatch<React.SetStateAction<string | undefined>>;
};

const PageHeader = ({ settings, setViewMode, searchText, setSearchText }: PageHeaderProps) => {
  const { activeProfile, activeNpub } = useActiveProfile(settings);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('Gallery');
  const searchInputRef = useRef<number | null>(null); // Create a ref for the timeout
  const [internalSearchText, setInternalSearchText] = useState(searchText);
  const { nav, currentSettings } = useNav();

  function startEditing(e?: React.FocusEvent<HTMLInputElement, Element>) {
    if (e) {
      e.target.setSelectionRange(0, e.target.value.length);
    }
    setSearchText('');
    setInternalSearchText('');
  }

  function endEditing() {
    setEditMode(false);
    handleSearchChange(undefined);
  }

  useEffect(() => {
    if (settings.topic) {
      setTitle('Topic: ' + (topics[settings.topic].name || settings.topic));
    } else if (settings.tags.length > 0) {
      setTitle(settings.tags.length > 6 ? 'Mixed hashtags' : settings.tags.map(t => `#${t}`).join(' '));
    } else if (settings.follows) {
      setTitle('Your follows');
    } else if (settings.list) {
      setTitle('List contents');
    } else {
      setTitle('Gallery');
    }
  }, [settings]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      endEditing();
    }
    if (event.key === 'Enter') {
      if (searchText) {
        endEditing();
        nav({ ...currentSettings, tags: [searchText] });
      }
    }
  };
  /*
  useEffect(() => {
    document.body.addEventListener('keydown', onKeyDown);
 
    return () => {
      document.body.removeEventListener('keydown', onKeyDown);
    };
  }, []);
*/

  const handleSearchChange = (value: string | undefined) => {
    setInternalSearchText(value);
    if (searchInputRef.current) {
      clearTimeout(searchInputRef.current); // Clear the previous timeout
    }
    searchInputRef.current = setTimeout(() => {
      setSearchText(value); // Update searchText after 300ms
    }, 300);
  };

  return (
    <div className="page-header">
      {activeProfile ? (
        <AuthorProfile
          src={urlFix(activeProfile.image || '')}
          author={activeProfile.displayName || activeProfile.name}
          npub={activeNpub}
          nip5={activeProfile.nip05}
          setViewMode={setViewMode}
          followButton
          externalLink
        ></AuthorProfile>
      ) : (
        <div className="page-search" onClick={() => setEditMode(true)}>
          {editMode ? (
            <input
              autoFocus
              onFocus={e => startEditing(e)}
              onBlur={() => endEditing()}
              onKeyDown={onKeyDown}
              placeholder="search for topics, tags or people"
              value={internalSearchText}
              onChange={e => handleSearchChange(e.target.value)} // Update to use the new handler
            ></input>
          ) : (
            <>
              <h2>{title}</h2> <IconSearch></IconSearch>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
