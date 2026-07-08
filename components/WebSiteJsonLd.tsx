import {
  ORGANIZATION_ID,
  SITE_NAME,
  SITE_URL_ORIGIN,
  absoluteUrl,
} from "@/lib/site";

/** サイト全体の WebSite + サイトリンク検索ボックス（SearchAction）。/search?q= に対応。 */
export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL_ORIGIN}/#website`,
    name: SITE_NAME,
    url: SITE_URL_ORIGIN,
    inLanguage: "ja",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
