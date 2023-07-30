import { useEffect, useState } from 'react';
import './TagEditor.css';
import useNav from '../utils/useNav';
import uniq from 'lodash/uniq';
import { visibleHashTags } from './env';

type TagEditorProps = {
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
};

export type Tag = {
  name: string;
  selected: boolean;
  deletable: boolean;
};

const TagEditor = ({ selectedTags, setSelectedTags }: TagEditorProps) => {
  const { currentSettings } = useNav();

  const [editMode, setEditMode] = useState(false);
  const [userTags, setUserTags] = useState<string[]>([]);

  useEffect(() => {
    const previousSelected = selectedTags.filter(tag => tag.selected).map(tag => tag.name);
    const previousDeletable = selectedTags.filter(tag => tag.deletable).map(tag => tag.name);

    //add currentSettings.tags to userTags

    const tags = uniq([...userTags, ...visibleHashTags, ...currentSettings.tags])
      .sort()
      .map(name => ({ name, selected: false }));
    const selected = tags.map(tag => ({
      ...tag,
      selected: previousSelected.includes(tag.name),
      deletable: previousDeletable.includes(tag.name),
    }));
    setSelectedTags([...selected]);
  }, [currentSettings, userTags]);

  const selectTag = (e: any) => {
    const tagName = e.target.innerText;
    const tag = selectedTags.find(tag => tag.name === tagName);
    if (tag) {
      tag.selected = !tag.selected;
      setSelectedTags([...selectedTags]);
    }
  };

  const onEditKeyDown = (e: any) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const newTag = e.target.value as string;
      setUserTags([...userTags, newTag]);
      setSelectedTags([...selectedTags, { name: newTag, selected: true, deletable: true }]);
      setEditMode(false);
    }
  };

  const deleteTag = (tagName: string) => {
    const tags = selectedTags.filter(tag => tag.name !== tagName);
    setSelectedTags([...tags]);
  };

  return (
    <div className="tag-editor">
      {selectedTags.map(tag => (
        <div className={`tag ${tag.selected ? 'selected' : ''}`} key={tag.name} onClick={e => selectTag(e)}>
          {tag.name}
          {tag.deletable && (
            <span className="delete-tag" onClick={() => deleteTag(tag.name)}>
              x
            </span>
          )}
        </div>
      ))}
      <div className="tag" onClick={() => setEditMode(true)}>
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
    </div>
  );
};

export default TagEditor;
