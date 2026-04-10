"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArticleSearchForm } from "@/components/ArticleSearchForm";
import { CATEGORY_SLUGS, getCategoryName } from "@/lib/categories";

const navItems = CATEGORY_SLUGS.map((slug) => ({
  href: `/categories/${slug}`,
  label: getCategoryName(slug),
}));

function isCurrentPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <span
            className="h-8 w-1 rounded-full bg-orange-600 transition-colors group-hover:bg-orange-500"
            aria-hidden
          />
          <span className="whitespace-nowrap text-base font-bold tracking-tight text-stone-900 sm:text-lg">
            農業情報メディア
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ArticleSearchForm
            className="hidden w-[320px] lg:flex"
            inputClassName="bg-stone-50"
          />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-2 text-stone-700 transition-colors hover:border-orange-300 hover:text-orange-800 lg:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <nav
          id="mobile-navigation"
          className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden"
          aria-label="モバイルメインナビゲーション"
        >
          <div className="mx-auto max-w-6xl space-y-3">
            <ArticleSearchForm inputClassName="bg-stone-50" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {navItems.map((item) => {
                const active = isCurrentPath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl border px-4 py-3 transition-colors ${
                      active
                        ? "border-orange-300 bg-orange-50"
                        : "border-stone-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-stone-900">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
