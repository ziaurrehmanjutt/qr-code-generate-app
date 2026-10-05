/**
 * AdMob configuration, shared by the dev and production builds.
 *
 * While `USE_TEST_ADS` is true the app uses Google's official TEST ids, so no real ads are served
 * and the account cannot be penalised for invalid traffic.
 *
 * To go live, see README-ADS.md: set `USE_TEST_ADS` to false and switch `admob_app_id` in
 * android/app/src/main/res/values/strings.xml to the real app id.
 */
const USE_TEST_ADS = false;

const TEST_ADS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
};

const LIVE_ADS = {
  // AdMob app: DiyaQR (ca-app-pub-9813075579951410~9000954205)
  banner: 'ca-app-pub-9813075579951410/3325869978',
  // No interstitial ad unit exists yet. Create one in AdMob and paste its id here;
  // until then interstitials are simply skipped.
  interstitial: 'ca-app-pub-9813075579951410/3857187165',
};

/** True when an ad unit id has really been filled in. */
export const isConfigured = (adUnitId: string): boolean => !adUnitId.includes('REPLACE_ME');

export const adsConfig = {
  useTestAds: USE_TEST_ADS,
  ...(USE_TEST_ADS ? TEST_ADS : LIVE_ADS),
  /** An interstitial is shown after every Nth user action (save, export, scan). */
  interstitialEvery: 3,
  /** Minimum time between two interstitials. */
  interstitialCooldownMs: 60_000,
  /** Space kept free at the bottom for the tab bar, in dp, so the banner sits above it. */
  bannerBottomMargin: 56,
};
