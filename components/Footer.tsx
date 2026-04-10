import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Link
          href="/privacy"
          className="text-sm text-stone-600 underline-offset-2 transition-colors hover:text-orange-800 hover:underline"
        >
          プライバシーポリシー
        </Link>
      </div>
    </footer>
  );
}
