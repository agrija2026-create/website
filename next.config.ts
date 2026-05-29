import type { NextConfig } from "next";

const SLUG_REDIRECTS: ReadonlyArray<readonly [string, string]> = [
  ["women-agriculture-empowerment", "women-active-promotion-agriculture"],
  ["trial-on-farm-employment-promotion", "trial-farming-employment-promotion"],
  ["farmland-efficiency-loan-support-type", "farm-land-efficiency-loan-support-r8"],
  ["seibi-55", "rural-resource-facility-infrastructure"],
  ["index-163", "vegetable-price-outlook-r8-may"],
  ["sanchipu-71", "production-base-power-up-program"],
  ["budget-15", "domestic-fertilizer-resource-expansion"],
  ["kokusan-shea-dakkan-85", "domestic-vegetable-share-recovery"],
  ["koudoka-r7hosei-4", "livestock-budget-r7-supplement"],
  ["daikibo-5koubo-20260227", "large-scale-growth-investment-subsidy-5"],
  ["organic-village-124", "organic-village-certification-paths"],
  ["r8kettei-pr41", "private-capital-agriculture-finance-r8"],
  ["yasai-shushi-antei-kyokyu-r8", "vegetable-seed-supply-stability-r8"],
  ["yasai-kakaku-antei-r8", "vegetable-price-stability-measures-r8"],
  ["tsuyoi-nogyo-sogo-shien-r8", "strong-agriculture-comprehensive-grant-r8"],
  ["nouchibank-basic-guide", "farmland-bank-guide"],
  ["nouchibank-koshin-futan-keigen", "farmland-bank-renewal-burden-reduction"],
  ["kyodo-riyo-shisetsu-seibi-r8", "shared-facility-infrastructure-support-r8"],
  ["ninaite-kikai-shisetsu-r8", "successor-farm-machinery-facility-r8"],
  ["suiden-katsuyo-direct-payment-r8", "paddy-field-direct-payment-r8"],
  ["r8-byogaichu-hassei-yoho-1", "pest-disease-forecast-r8-issue-1"],
  ["rural-resource-promotion-soushutsu", "rural-resource-value-creation-promotion"],
];

const nextConfig: NextConfig = {
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
