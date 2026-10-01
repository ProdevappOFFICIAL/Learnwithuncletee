import { useEffect } from 'react';

export const PageMetadata = ({ title, description }: { title: string; description: string }) => {
  useEffect(() => {
    document.title = `${title} | Learnwithuncletee`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.append(meta);
    }
    meta.content = description;
  }, [title, description]);

  return null;
};
