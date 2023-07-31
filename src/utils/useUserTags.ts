import { useEffect, useState } from 'react';

declare global {
  interface Window {
    localStorage: any;
  }
}

const useUserTags = (): [string[], (tags: string[]) => void] => {
  const [userTags, setUserTags] = useState<string[]>([]);

  useEffect(() => {
    const previousUserTags = JSON.parse(localStorage.getItem('userTags') as string);
    console.log(previousUserTags);
    if (previousUserTags) {
      setUserTags(previousUserTags);
    }
  }, []);

  return [
    userTags,
    (tags: string[]) => {
      console.log(tags);
      setUserTags(tags);
      localStorage.setItem('userTags', JSON.stringify(tags));
    },
  ];
};

export default useUserTags;
