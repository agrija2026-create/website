import type { Metadata } from "next";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "農業情報メディアにおける Google アナリティクス4（GA4）によるアクセス解析について。",
  robots: {
    index: false,
    follow: true,
  },
};

const googleLinks = [
  {
    label: "Google のプライバシーポリシー",
    href: "https://policies.google.com/privacy?hl=ja",
  },
  {
    label: "Google のサービスを利用するサイトやアプリから収集した情報の使用",
    href: "https://policies.google.com/technologies/partner-sites?hl=ja",
  },
  {
    label: "Google アナリティクスに関する Google の説明",
    href: "https://support.google.com/analytics/topic/2919631?hl=ja",
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="flex w-full flex-col px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 lg:flex-row lg:items-start">
        <main className="min-w-0 flex-1 space-y-8 rounded-xl border border-stone-200 bg-white p-6 shadow-lg md:p-8">
          <nav className="text-sm text-stone-500">
            <Link href="/" className="hover:text-orange-800 hover:underline">
              トップ
            </Link>
          </nav>

          <h1 className="border-l-4 border-orange-600 pl-3 text-2xl font-bold text-stone-900">
            プライバシーポリシー（アクセス解析・GA4）
          </h1>

          <div className="space-y-8 text-sm leading-relaxed text-stone-700">
            <p>
              <strong className="text-stone-900">農業情報メディア</strong>
              は、当サイト（以下「本サイト」）の利用状況の把握および改善のため、
              <strong className="text-stone-900">
                {" "}
                Google LLC が提供する Google アナリティクス（Google アナリティクス4）
              </strong>
              を利用する場合があります。
            </p>

            <section>
              <h2 className="text-base font-bold text-stone-900">1. 利用目的</h2>
              <p className="mt-2">
                本サイトへのアクセス状況を統計的に把握し、コンテンツや表示の改善に利用します。
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-stone-900">2. 使用する Cookie 等</h2>
              <p className="mt-2">
                Google アナリティクスは、
                <strong className="text-stone-900">Cookie 等</strong>
                を用いて、ページの閲覧状況、参照元、端末・ブラウザに関する情報、おおよその地域などの情報を取得する場合があります。詳細は
                Google の説明をご参照ください。
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-stone-900">3. データの取扱い</h2>
              <p className="mt-2">
                取得された情報は、
                <strong className="text-stone-900">Google のプライバシーポリシー</strong>
                に従い、Google により処理されます。本サイトの運営者が、Google
                アナリティクスの設定により収集範囲を制限する場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-stone-900">4. 参考リンク（Google）</h2>
              <ul className="mt-2 list-inside list-disc space-y-2">
                {googleLinks.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-800 underline-offset-2 hover:underline"
                    >
                      {item.label}
                    </a>
                    <span className="break-all text-stone-500"> — {item.href}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-stone-900">5. 無効化について</h2>
              <p className="mt-2">
                お使いのブラウザの設定で
                <strong className="text-stone-900"> Cookie を無効化</strong>
                するなどの方法で、解析を制限できる場合があります。方法はブラウザのヘルプ等をご確認ください。
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-stone-900">6. 本ポリシーの変更</h2>
              <p className="mt-2">
                法令の改正や運営上の必要に応じ、本内容を変更することがあります。変更後の内容は、本サイトに掲載した時点から効力を生じるものとします。
              </p>
            </section>

            <p className="border-t border-stone-200 pt-6 text-stone-600">
              <strong className="text-stone-900">制定日：2026年4月2日</strong>
            </p>
          </div>
        </main>
        <Sidebar />
      </div>
    </div>
  );
}
