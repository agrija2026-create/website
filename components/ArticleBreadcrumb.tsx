import Link from "next/link";
import { getCategoryName } from "@/lib/categories";

type Props = {
  categorySlug: string;
  articleTitle: string;
};

export function ArticleBreadcrumb({ categorySlug, articleTitle }: Props) {
  const categoryName = getCategoryName(categorySlug);
  return (
    <nav aria-label="パンくず" className="text-sm text-stone-500">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link href="/" className="hover:text-orange-800 hover:underline">
            トップ
          </Link>
        </li>
        <li aria-hidden className="text-stone-400">
          /
        </li>
        <li>
          <Link
            href={`/categories/${categorySlug}`}
            className="hover:text-orange-800 hover:underline"
          >
            {categoryName}
          </Link>
        </li>
        <li aria-hidden className="text-stone-400">
          /
        </li>
        <li className="min-w-0 font-medium text-stone-700">
          <span className="line-clamp-2">{articleTitle}</span>
        </li>
      </ol>
    </nav>
  );
}
