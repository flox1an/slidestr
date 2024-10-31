import { useEffect, useMemo, useState } from 'react';
import './TagEditor.css';
import useNav from '../utils/useNav';
import uniq from 'lodash/uniq';
import { visibleHashTags } from './env';
import useUserTags from '../utils/useUserTags';

type TagEditorProps = {
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
};

export type Tag = {
  name: string;
  selected: boolean;
  deletable: boolean;
};

const TagEditor = ({ selectedTags, setSelectedTags }: TagEditorProps) => {
  const { currentSettings } = useNav();

  const [editMode, setEditMode] = useState(false);
  const [userTags, setUserTags] = useUserTags();

  useEffect(() => {
    const previousSelected = selectedTags.filter(tag => tag.selected).map(tag => tag.name);
    const previousDeletable = selectedTags.filter(tag => tag.deletable).map(tag => tag.name);

    const tags = uniq([...userTags, ...visibleHashTags, ...currentSettings.tags]).sort();

    const selected = tags.map(tag => ({
      name: tag,
      selected: previousSelected.includes(tag),
      deletable: (previousDeletable.includes(tag) || userTags.includes(tag)) && !currentSettings.tags.includes(tag),
    }));
    setSelectedTags([...selected]);
  }, [currentSettings, userTags]);

  const selectTag = (tagName: string) => {
    const tag = selectedTags.find(tag => tag.name === tagName);
    if (tag) {
      tag.selected = !tag.selected;
      setSelectedTags([...selectedTags]);
    }
  };

  const onEditKeyDown = (e: any) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return; // Do not handle key events if focused on an input or textarea
    }

    e.stopPropagation();
    if (e.key === 'Enter') {
      const newTag = (e.target.value as string).toLowerCase();
      setUserTags([...userTags, newTag]);
      setSelectedTags([...selectedTags, { name: newTag, selected: true, deletable: true }]);
      setEditMode(false);
    }
  };

  const deleteTag = (tagName: string) => {
    const tags = selectedTags.filter(tag => tag.name !== tagName);
    setUserTags(userTags.filter(t => t !== tagName));
    setSelectedTags([...tags]);
  };

  const isATagSelected = useMemo(() => selectedTags.some(tag => tag.selected), [selectedTags]);

  return (
    <div className="tag-editor">
      {selectedTags.map(tag => (
        <div className={`tag ${tag.selected ? 'selected' : ''}`} key={tag.name} onClick={() => selectTag(tag.name)}>
          {tag.name}
          {tag.deletable && (
            <span className="delete-tag" onClick={() => deleteTag(tag.name)}>
              x
            </span>
          )}
        </div>
      ))}
      <div className="tag action" onClick={() => setEditMode(true)}>
        +
        {editMode && (
          <input
            type="text"
            placeholder="new tag"
            autoFocus
            onKeyDown={onEditKeyDown}
            onKeyUp={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onBlur={() => setEditMode(false)}
          />
        )}
      </div>
      {isATagSelected && (
        <div className="tag action" onClick={() => setSelectedTags(tags => tags.map(s => ({ ...s, selected: false })))}>
          none
        </div>
      )}
    </div>
  );
};

export default TagEditor;
