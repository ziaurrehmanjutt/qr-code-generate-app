/**
 * AdMob configuration, shared by the dev and production builds.
 *
 * The IDs below are Google's official TEST ids, so no real ads are served and the account
 * cannot be penalised for invalid traffic. Before the Play Store release:
 *   1. Create the app and ad units in AdMob.
 *   2. Put the real ids in `LIVE_ADS` below.
 *   3. Set `USE_TEST_ADS` to false.
 *   4. Replace `admob_app_id` in android/app/src/main/res/values/strings.xml with the real app id.
 */
const USE_TEST_ADS = true;

const TEST_ADS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
};

const LIVE_ADS = {
  banner: 'ca-app-pub-REPLACE_ME/REPLACE_ME',
  interstitial: 'ca-app-pub-REPLACE_ME/REPLACE_ME',
};

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
