import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export default function SEO({ title, description, image = '/og-image.png', url = 'https://claimtagx.com' }: SEOProps) {
  useEffect(() => {
    document.title = title;
    
    const setMetaTag = (name: string, content: string, property?: string) => {
      let element = document.querySelector(`meta[${name ? `name="${name}"` : `property="${property}"`}]`);
      if (!element) {
        element = document.createElement('meta');
        if (name) element.setAttribute('name', name);
        if (property) element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('description', description);
    setMetaTag('', title, 'og:title');
    setMetaTag('', description, 'og:description');
    setMetaTag('', image, 'og:image');
    setMetaTag('', url, 'og:url');
    setMetaTag('twitter:card', 'summary_large_image');
    
    return () => {
      // Optional cleanup, but usually we just overwrite on next page load
    };
  }, [title, description, image, url]);

  return null;
}
