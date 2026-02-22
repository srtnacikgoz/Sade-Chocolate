import { useEffect } from 'react';

type BreadcrumbItem = {
  name: string;
  url: string;
};

type SEOHeadProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product';
  breadcrumbs?: BreadcrumbItem[];
  // Ürün sayfaları için
  product?: {
    name: string;
    price: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock';
    image?: string;
    description?: string;
    ratingValue?: number;
    reviewCount?: number;
  };
};

const BASE_URL = 'https://sadechocolate.com';
const DEFAULT_TITLE = 'Sade Chocolate | El Yapımı Premium Çikolata - Antalya';
const DEFAULT_DESC = "Sade Chocolate - Antalya'dan el yapımı premium artisan çikolata. Bonbon, tablet çikolata ve özel hediye kutuları. Türkiye'nin her yerine güvenli kargo.";
const DEFAULT_IMAGE = `${BASE_URL}/kakaologo.png`;

// Dinamik meta tag ve sayfa title yönetimi
export function SEOHead({ title, description, path = '', image, type = 'website', product, breadcrumbs }: SEOHeadProps) {
  const fullTitle = title ? `${title} | Sade Chocolate` : DEFAULT_TITLE;
  const fullDesc = description || DEFAULT_DESC;
  const fullUrl = `${BASE_URL}${path}`;
  const fullImage = image || DEFAULT_IMAGE;

  useEffect(() => {
    // Title güncelle
    document.title = fullTitle;

    // Meta tagları güncelle
    updateMeta('description', fullDesc);
    updateMeta('og:title', fullTitle, 'property');
    updateMeta('og:description', fullDesc, 'property');
    updateMeta('og:url', fullUrl, 'property');
    updateMeta('og:image', fullImage, 'property');
    updateMeta('og:type', type, 'property');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', fullDesc);
    updateMeta('twitter:image', fullImage);

    // Canonical URL güncelle
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      canonical.href = fullUrl;
    }

    // Product structured data ekle
    if (product) {
      const existingScript = document.querySelector('script[data-seo-product]');
      if (existingScript) existingScript.remove();

      const productSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || fullDesc,
        image: product.image || fullImage,
        brand: {
          '@type': 'Brand',
          name: 'Sade Chocolate'
        },
        offers: {
          '@type': 'Offer',
          url: fullUrl,
          priceCurrency: product.currency || 'TRY',
          price: product.price,
          availability: `https://schema.org/${product.availability || 'InStock'}`,
          seller: {
            '@type': 'Organization',
            name: 'Sade Chocolate'
          }
        }
      };

      // Yorum puanı varsa aggregateRating ekle
      if (product.ratingValue && product.reviewCount && product.reviewCount > 0) {
        productSchema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: product.ratingValue,
          reviewCount: product.reviewCount,
          bestRating: 5,
          worstRating: 1
        };
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-product', 'true');
      script.textContent = JSON.stringify(productSchema);
      document.head.appendChild(script);
    }

    // BreadcrumbList structured data
    if (breadcrumbs && breadcrumbs.length > 0) {
      const existingBc = document.querySelector('script[data-seo-breadcrumb]');
      if (existingBc) existingBc.remove();

      const bcScript = document.createElement('script');
      bcScript.type = 'application/ld+json';
      bcScript.setAttribute('data-seo-breadcrumb', 'true');
      bcScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${BASE_URL}${item.url}`
        }))
      });
      document.head.appendChild(bcScript);
    }

    // Cleanup
    return () => {
      const productScript = document.querySelector('script[data-seo-product]');
      if (productScript) productScript.remove();
      const bcScript = document.querySelector('script[data-seo-breadcrumb]');
      if (bcScript) bcScript.remove();
    };
  }, [fullTitle, fullDesc, fullUrl, fullImage, type, product, breadcrumbs]);

  return null;
}

// Meta tag güncelleme yardımcı fonksiyonu
function updateMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
  if (meta) {
    meta.content = content;
  } else {
    meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    meta.content = content;
    document.head.appendChild(meta);
  }
}
