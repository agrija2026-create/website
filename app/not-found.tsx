import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-stone-900">ページが見つかりません</h1>
      <p className="mt-4 text-stone-600">
        URLが間違っているか、ページが移動した可能性があります。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-500"
      >
        トップへ戻る
      </Link>
    </div>
  );
}
