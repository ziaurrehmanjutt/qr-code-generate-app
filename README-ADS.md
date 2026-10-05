# DiyaQR – ads, privacy policy and release notes

## 1. Where the AdMob IDs go

| What | Value | Where it lives in the project |
|---|---|---|
| AdMob **App ID** | `ca-app-pub-9813075579951410~9000954205` | `android/app/src/main/res/values/strings.xml` → `admob_app_id` |
| **Banner** ad unit | `ca-app-pub-9813075579951410/3325869978` | `src/environments/ads.config.ts` → `LIVE_ADS.banner` (already filled in) |
| **Interstitial** ad unit | _not created yet_ | `src/environments/ads.config.ts` → `LIVE_ADS.interstitial` |

Right now the app runs on **Google's test ads**, so nothing real is shown and your account is safe while you develop.

### Switch to real ads (do this only for the release build)

1. **`src/environments/ads.config.ts`**: change
   ```ts
   const USE_TEST_ADS = true;
   ```
   to
   ```ts
   const USE_TEST_ADS = false;
   ```
2. **`android/app/src/main/res/values/strings.xml`**: replace the test app id
   ```xml
   <string name="admob_app_id">ca-app-pub-3940256099942544~3347511713</string>
   ```
   with your real one
   ```xml
   <string name="admob_app_id">ca-app-pub-9813075579951410~9000954205</string>
   ```
   > Both steps are needed. The app id lives in the Android manifest, so changing only the TypeScript file is not enough.
3. Build and sync:
   ```bash
   npx ng build --configuration production
   npx cap sync android
   ```
   then build the signed release (AAB) in Android Studio.

### Interstitial (full-screen) ads

The app shows a full-screen ad after every 3rd save / export / scan (at most once a minute). This needs its own ad unit:

1. AdMob → **Apps → DiyaQR → Ad units → Add ad unit → Interstitial**.
2. Paste the new id (`ca-app-pub-9813075579951410/xxxxxxxxxx`) into `LIVE_ADS.interstitial` in `ads.config.ts`.

Until you do, interstitials are skipped automatically and only the banner is shown.

### Safe testing with real ads

Never tap your own live ads, because Google can disable the account. To check the real ad units on your own phone, register it as a test device: run the app once with real ads, find your device id in `adb logcat` (search for `AdRequest.Builder.addTestDevice`), and add it to `AdMob.initialize({ testingDevices: [...] })` in `src/app/services/ad.service.ts`. Remove it again before you publish.

### Required: app-ads.txt

AdMob needs `app-ads.txt` on **the root of your developer website** (the website address you put in the Play Store listing), for example `https://your-site.com/app-ads.txt`. The ready file is in this project: **`policy/app-ads.txt`**. Upload it to the website root, then in AdMob open the app and press "Check for updates". New apps can take a few days to be verified.

### Banner position

The banner sits above the tab bar on **Home** and **Scan**. It is not shown on **Create** so it never covers the live preview. To change this, see `showBanner()` / `hideBanner()` in `tab1.page.ts` and `tab3.page.ts`, and `bannerBottomMargin` in `ads.config.ts`.

## 2. Privacy policy

Files: **`policy/policy.html`** (English and Arabic, with a language switch) and **`policy/app-ads.txt`**.

1. Open `policy/policy.html` and edit the `CONFIG` block near the bottom: your name, contact email and dates. It is set to `ziaa520@gmail.com`, so change it if you want another contact address.
2. Upload `policy.html` (and `app-ads.txt`) to your website.
3. Put the final address in the app: **`src/environments/app-links.ts`**
   ```ts
   privacyPolicyUrl: 'https://your-site.com/policy.html',
   ```
   Settings then shows a **Privacy policy** row that opens it. While the value is empty the row stays hidden.
4. Use the same address in **Play Console → App content → Privacy policy**.

If you change features that touch user data (for example you add analytics, accounts or a backend), update the policy first.

### "Ad privacy choices" row

Settings also shows **Ad privacy choices** automatically for users in regions where Google requires it (EEA, UK and so on). It opens Google's consent form. Nothing for you to configure.

### Create the consent message in AdMob

AdMob → **Privacy & messaging → European regulations** → create and publish a message for the DiyaQR app. Without a published message the consent form does not appear, and personalised ads may not be served in the EEA/UK.

## 3. Play Console checklist (short)

- **Ads:** App content → Ads → "Yes, my app contains ads".
- **Data safety:** declare what the AdMob SDK collects. Google lists it in "Provide information for Google Play's Data safety section" (AdMob help). In practice for this app: _Device or other IDs_ (advertising ID), _App info and performance_, and approximate _Location_, all **collected and shared with Google for advertising**, and "data is encrypted in transit". The app itself collects nothing else. Check Google's current list before submitting because it changes.
- **Target audience:** 13+ / general audience, not "designed for children".
- **Permissions you will see in the manifest:** Camera, Internet, Wi-Fi state/change, Fine & Coarse Location (Wi-Fi connect and "Use my location"), Advertising ID. The privacy policy already explains each of them.
- **App ID** is `io.zia.diyaqr` and cannot change after publishing.
- Build the release as an **AAB**, signed with your own keystore, with Play App Signing enabled.
- New personal developer accounts must run a **closed test (12+ testers for 14 days)** before production access.
