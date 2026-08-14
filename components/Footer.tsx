import Link from "next/link";
import { CATEGORY_SLUGS, getCategoryName } from "@/lib/categories";
import { AUDIENCE_TAGS, encodeTagForUrl, getSeoHeadThemeTags } from "@/lib/tags";

const themeHubs = getSeoHeadThemeTags();

const siteLinks = [
  { href: "/", label: "トップ" },
  { href: "/recent", label: "新着記事" },
  { href: "/tools/subsidy-finder", label: "補助金かんたん診断" },
  { href: "/tools/market-calendar", label: "卸売市場の休市日カレンダー" },
  { href: "/data/rice-advance-payment", label: "概算金データ（CSV）" },
  { href: "/feed.xml", label: "RSS フィード" },
  { href: "/privacy", label: "プライバシーポリシー" },
];

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500">
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const className =
    "text-stone-600 underline-offset-2 transition-colors hover:text-orange-800 hover:underline";
  // /feed.xml のようなページ以外のルート（Route Handler）は通常のリンクで開く
  const isFileRoute = /\.[a-z0-9]+$/i.test(href);
  // prefetch={false}: 全ページの末尾に常時あるハブリンクなので、スクロールで
  // 通過しただけで先読みされるとリクエストが跳ね上がる。ホバー/タップ時の
  // 先読みは残るので、実際にクリックするときの体感速度は落ちない。
  return (
    <li>
      {isFileRoute ? (
        <a href={href} className={className}>
          {label}
        </a>
      ) : (
        <Link href={href} className={className} prefetch={false}>
          {label}
        </Link>
      )}
    </li>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <FooterColumn title="カテゴリ">
            {CATEGORY_SLUGS.map((slug) => (
              <FooterLink
                key={slug}
                href={`/categories/${slug}`}
                label={getCategoryName(slug)}
              />
            ))}
          </FooterColumn>

          <FooterColumn title="読者別">
            {AUDIENCE_TAGS.map((tag) => (
              <FooterLink
                key={tag}
                href={`/tags/${encodeTagForUrl(tag)}`}
                label={tag}
              />
            ))}
          </FooterColumn>

          <FooterColumn title="テーマから探す">
            {themeHubs.map((tag) => (
              <FooterLink
                key={tag.urlSlug}
                href={`/tags/${tag.urlSlug}`}
                label={tag.head}
              />
            ))}
          </FooterColumn>

          <FooterColumn title="サイト">
            {siteLinks.map((link) => (
              <FooterLink key={link.href} href={link.href} label={link.label} />
            ))}
          </FooterColumn>
        </div>

        <p className="mt-10 border-t border-stone-100 pt-6 text-xs text-stone-500">
          農業情報メディア — 農林水産省など一次情報をもとに、農政・補助金・制度をわかりやすく解説しています。
        </p>
      </div>
    </footer>
  );
}
