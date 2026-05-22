import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  structuredData?: Record<string, any>;
}

const DEFAULT_SITE_NAME = '오사카J부동산';
const DEFAULT_IMAGE = 'https://osaka-j.pages.dev/favicon.PNG';

function setMetaByName(name: string, content: string) {
  if (!content) return;

  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string) {
  if (!content) return;

  let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

function setCanonical(url: string) {
  if (!url) return;

  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', url);
}

export default function Seo({
  title,
  description,
  keywords,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const currentUrl =
      canonical ||
      (typeof window !== 'undefined'
        ? window.location.href.split('#')[0]
        : 'https://osaka-j.pages.dev/');

    const fullTitle = title.includes(DEFAULT_SITE_NAME)
      ? title
      : `${title} | ${DEFAULT_SITE_NAME}`;

    document.title = fullTitle;

    setMetaByName('description', description);
    setMetaByName('robots', 'index, follow');
    setMetaByName('author', DEFAULT_SITE_NAME);

    if (keywords) {
      setMetaByName('keywords', keywords);
    }

    setCanonical(currentUrl);

    setMetaByProperty('og:locale', 'ko_KR');
    setMetaByProperty('og:type', type);
    setMetaByProperty('og:site_name', DEFAULT_SITE_NAME);
    setMetaByProperty('og:title', fullTitle);
    setMetaByProperty('og:description', description);
    setMetaByProperty('og:url', currentUrl);
    setMetaByProperty('og:image', image);

    setMetaByName('twitter:card', 'summary');
    setMetaByName('twitter:title', fullTitle);
    setMetaByName('twitter:description', description);
    setMetaByName('twitter:image', image);

    const existingStructuredData = document.getElementById('page-structured-data');
    if (existingStructuredData) {
      existingStructuredData.remove();
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.id = 'page-structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      const script = document.getElementById('page-structured-data');
      if (script) {
        script.remove();
      }
    };
  }, [
    title,
    description,
    keywords,
    canonical,
    image,
    type,
    JSON.stringify(structuredData),
  ]);

  return null;
}
