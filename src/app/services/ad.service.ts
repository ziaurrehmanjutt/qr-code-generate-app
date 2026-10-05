import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
} from '@capacitor-community/admob';
import { adsConfig } from '../../environments/ads.config';

/**
 * Banner and interstitial ads (Android only). Everything is a no-op in the browser, and every
 * call is wrapped so an ad failure never affects the app.
 */
@Injectable({ providedIn: 'root' })
export class AdService {
  /** True while a banner is on screen, so pages can keep their content above it. */
  bannerVisible = false;

  private ready = false;
  private starting: Promise<void> | null = null;
  private actions = 0;
  private lastInterstitial = 0;
  private interstitialLoaded = false;

  private get native(): boolean {
    return Capacitor.isNativePlatform();
  }

  /** Asks for consent where required (EEA/UK), then starts the ad SDK. */
  init(): Promise<void> {
    this.starting ??= this.start();
    return this.starting;
  }

  private async start(): Promise<void> {
    if (!this.native) return;
    try {
      const consent = await AdMob.requestConsentInfo();
      if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
        await AdMob.showConsentForm();
      }
      await AdMob.initialize({ initializeForTesting: adsConfig.useTestAds });
      AdMob.addListener(BannerAdPluginEvents.Loaded, () => (this.bannerVisible = true));
      AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => (this.bannerVisible = false));
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => this.loadInterstitial());
      this.ready = true;
      this.loadInterstitial();
    } catch (error) {
      console.warn('Ads are not available:', error);
    }
  }

  async showBanner(): Promise<void> {
    await this.init();
    if (!this.ready) return;
    try {
      await AdMob.showBanner({
        adId: adsConfig.banner,
        isTesting: adsConfig.useTestAds,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: adsConfig.bannerBottomMargin,
      });
    } catch (error) {
      console.warn('Banner failed:', error);
    }
  }

  async hideBanner(): Promise<void> {
    this.bannerVisible = false;
    if (!this.ready) return;
    try {
      await AdMob.removeBanner();
    } catch {
      // Nothing to remove.
    }
  }

  /** Call after a completed user action. Shows an interstitial every Nth action, at most once per cooldown. */
  async recordAction(): Promise<void> {
    if (!this.ready) return;
    this.actions++;
    const cooledDown = Date.now() - this.lastInterstitial >= adsConfig.interstitialCooldownMs;
    if (this.actions % adsConfig.interstitialEvery !== 0 || !cooledDown || !this.interstitialLoaded) return;
    try {
      this.interstitialLoaded = false;
      this.lastInterstitial = Date.now();
      await AdMob.showInterstitial();
    } catch (error) {
      console.warn('Interstitial failed:', error);
    }
  }

  private async loadInterstitial(): Promise<void> {
    try {
      await AdMob.prepareInterstitial({ adId: adsConfig.interstitial, isTesting: adsConfig.useTestAds });
      this.interstitialLoaded = true;
    } catch {
      this.interstitialLoaded = false;
    }
  }
}
