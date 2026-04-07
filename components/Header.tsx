import Link from "next/link";

const navItems = [
  { href: "/", label: "トップ" },
  { href: "/categories/yosan", label: "R8年度予算" },
  { href: "/categories/seisaku", label: "政策・制度" },
  { href: "/tags/smart-agriculture", label: "スマート農業" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span
            className="h-8 w-1 rounded-full bg-orange-600 transition-colors group-hover:bg-orange-500"
            aria-hidden
          />
          <span className="text-lg font-bold tracking-tight text-stone-900">
            農業情報メディア
          </span>
        </Link>
        <nav
          className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-medium text-stone-700"
          aria-label="メインナビゲーション"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-1 py-0.5 transition-colors hover:text-orange-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
