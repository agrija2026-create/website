import {
  ORGANIZATION_ID,
  SAME_AS_SOCIAL,
  SITE_KNOWS_ABOUT,
  SITE_NAME,
  SITE_ORG_DESCRIPTION,
  SITE_URL_ORIGIN,
  absoluteUrl,
} from "@/lib/site";

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL_ORIGIN,
    description: SITE_ORG_DESCRIPTION,
    knowsAbout: [...SITE_KNOWS_ABOUT],
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon.png"),
    },
    sameAs: [...SAME_AS_SOCIAL],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
