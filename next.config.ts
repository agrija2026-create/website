import type { NextConfig } from "next";

const SLUG_REDIRECTS: ReadonlyArray<readonly [string, string]> = [
  ["women-agriculture-empowerment", "women-active-promotion-agriculture"],
  ["trial-on-farm-employment-promotion", "trial-farming-employment-promotion"],
  ["farmland-efficiency-loan-support-type", "farm-land-efficiency-loan-support-r8"],
  ["seibi-55", "rural-resource-facility-infrastructure"],
  // 野菜価格見通しは毎月更新の恒久ページ vegetable-price-outlook に一本化（月別の旧slugは301集約）
  ["index-163", "vegetable-price-outlook"],
  ["index-164", "vegetable-price-outlook"],
  ["vegetable-price-outlook-r8-may", "vegetable-price-outlook"],
  ["vegetable-price-outlook-r8-june", "vegetable-price-outlook"],
  ["sanchipu-71", "production-base-power-up-program"],
  ["budget-15", "domestic-fertilizer-resource-expansion"],
  ["kokusan-shea-dakkan-85", "domestic-vegetable-share-recovery"],
  ["koudoka-r7hosei-4", "livestock-budget-r7-supplement"],
  ["daikibo-5koubo-20260227", "large-scale-growth-investment-subsidy-5"],
  ["organic-village-124", "organic-village-certification-paths"],
  ["r8kettei-pr41", "private-capital-agriculture-finance-r8"],
  ["yasai-shushi-antei-kyokyu-r8", "vegetable-seed-supply-stability-r8"],
  ["yasai-kakaku-antei-r8", "vegetable-price-stability-system"],
  ["vegetable-price-stability-measures-r8", "vegetable-price-stability-system"],
  ["tsuyoi-nogyo-sogo-shien-r8", "strong-agriculture-comprehensive-grant-r8"],
  ["nouchibank-basic-guide", "farmland-bank-guide"],
  ["nouchibank-koshin-futan-keigen", "farmland-bank-renewal-burden-reduction"],
  ["kyodo-riyo-shisetsu-seibi-r8", "shared-facility-infrastructure-support-r8"],
  ["ninaite-kikai-shisetsu-r8", "successor-farm-machinery-facility-r8"],
  ["suiden-katsuyo-direct-payment-r8", "paddy-field-direct-payment-r8"],
  ["r8-byogaichu-hassei-yoho-1", "pest-disease-forecast-r8-issue-1"],
  ["rural-resource-promotion-soushutsu", "rural-resource-value-creation-promotion"],
  ["farmland-bank-utilization-benefits", "farmland-bank-guide"],
  // 末尾sタイポ（外部由来のアクセスをGA未照合で検出）→ 正規slugへ301
  ["gfp-export-communitys", "gfp-export-community"],
  ["agricultural-subsidies-guides", "agricultural-subsidies-guide"],
  ["farmland-bank-guides", "farmland-bank-guide"],
  ["income-insurance-comparisons", "income-insurance-comparison"],
];

const nextConfig: NextConfig = {
  /**
   * /mcp は実行時に fs で content/ を読む唯一のルート（他ページはビルド時に読む）。
   * トレースに含めないと Vercel 上で ENOENT になるので明示する。
   */
  outputFileTracingIncludes: {
    "/mcp": [
      "./content/articles/**",
      "./content/source-html/**",
      "./content/data/**",
      "./content/tools/**",
    ],
  },
  /**
   * MCP公式レジストリのドメイン認証ファイル。
   * Vercel は public/ 配下のドットディレクトリを配信しないため、
   * public/mcp-registry-auth を /.well-known/ 配下に見せる。
   */
  async rewrites() {
    return [
      {
        source: "/.well-known/mcp-registry-auth",
        destination: "/mcp-registry-auth",
      },
    ];
  },
  async redirects() {
    return SLUG_REDIRECTS.map(([source, destination]) => ({
      source: `/articles/${source}`,
      destination: `/articles/${destination}`,
      permanent: true,
    }));
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
