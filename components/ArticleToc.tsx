import type { TocItem } from "@/lib/articleHtml";

type Props = {
  items: TocItem[];
  variant: "mobile" | "desktop" | "accordion";
  summaryLabel?: string;
  summaryHint?: string;
};

export function ArticleToc({
  items,
  variant,
  summaryLabel = "このページ内",
  summaryHint = "タップで開く",
}: Props) {
  if (items.length === 0) return null;

  const list = (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className={item.level === 3 ? "ml-3 border-l border-stone-200 pl-3" : ""}
        >
          <a
            href={`#${encodeURIComponent(item.id)}`}
            className="text-stone-700 underline-offset-2 hover:text-orange-800 hover:underline"
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );

  if (variant === "mobile" || variant === "accordion") {
    return (
      <details className={variant === "mobile" ? "lg:hidden" : ""}>
        <summary className="cursor-pointer list-none rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow-sm [&::-webkit-details-marker]:hidden">
          <span className="inline-flex w-full items-center justify-between gap-2">
            {summaryLabel}
            <span className="text-xs font-normal text-stone-500" aria-hidden>
              {summaryHint}
            </span>
          </span>
        </summary>
        <nav
          aria-label="このページ内の見出し"
          className="mt-2 rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
        >
          {list}
        </nav>
      </details>
    );
  }

  return (
    <section aria-labelledby="toc-desktop-heading">
      <h2 id="toc-desktop-heading" className="text-sm font-bold text-stone-900">
        このページ内
      </h2>
      <nav aria-label="このページ内の見出し" className="mt-3">
        {list}
      </nav>
    </section>
  );
}
