import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import { ArticleImageLightbox } from "@/components/ArticleImageLightbox";
import { Header } from "@/components/Header";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { SITE_URL_ORIGIN } from "@/lib/site";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL_ORIGIN),
  title: {
    default: "農業情報メディア",
    template: "%s | 農業情報メディア",
  },
  description: "農政をもっと身近に。農林水産の政策・予算・現場の動きをわかりやすく整理します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJp.variable} font-sans`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-J3785516LP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J3785516LP');
          `}
        </Script>
        <OrganizationJsonLd />
        <Header />
        {children}
        <ArticleImageLightbox />
      </body>
    </html>
  );
}
