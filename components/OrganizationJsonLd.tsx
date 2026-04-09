import {
  ORGANIZATION_ID,
  SAME_AS_SOCIAL,
  SITE_NAME,
  SITE_URL_ORIGIN,
} from "@/lib/site";

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL_ORIGIN,
    sameAs: [...SAME_AS_SOCIAL],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
