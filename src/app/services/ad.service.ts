import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
} from '@capacitor-community/admob';
import { adsConfig, isConfigured } from '../../environments/ads.config';

/**
 * Banner and interstitial ads (Android only). Everything is a no-op in the browser, and every
 * call is wrapped so an ad failure never affects the app.
 */
@Injectable({ providedIn: 'root' })
export class AdService {
  /** True while a banner is on screen. Pages reserve its space through the --ad-height CSS variable. */
  bannerVisible = false;

  /** True when the user must be able to change their ad privacy choices (shown in Settings). */
  privacyOptionsRequired = false;

  private ready = false;
  private starting: Promise<void> | null = null;
  private actions = 0;
  private lastInterstitial = 0;
  private interstitialLoaded = false;
  private bannerState: 'none' | 'shown' | 'hidden' = 'none';
  private bannerHeight = 0;

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
      this.privacyOptionsRequired = String(consent.privacyOptionsRequirementStatus) === 'REQUIRED';
      await AdMob.initialize({ initializeForTesting: adsConfig.useTestAds });
      AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
        // A size of 0 is reported while the banner loads or is removed; keep the last real height.
        if (size.height <= 0) return;
        this.bannerHeight = size.height;
        if (this.bannerState === 'shown') this.reserveSpace(size.height);
      });
      AdMob.addListener(BannerAdPluginEvents.Loaded, () => (this.bannerVisible = true));
      AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
        this.bannerVisible = false;
        this.reserveSpace(0);
      });
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => this.loadInterstitial());
      this.ready = true;
      this.loadInterstitial();
    } catch (error) {
      console.warn('Ads are not available:', error);
    }
  }

  /**
   * Keeps one banner for the whole tab area: it is shown when the user is inside the tabs and hidden
   * on every other page (Settings, intro), so it never covers content and never reloads when
   * switching tabs.
   */
  watchRoutes(router: Router): void {
    const sync = (url: string) => (url.startsWith('/tabs') ? this.showBanner() : this.hideBanner());
    router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => sync(event.urlAfterRedirects));
  }

  async showBanner(): Promise<void> {
    await this.init();
    if (!this.ready || !isConfigured(adsConfig.banner) || this.bannerState === 'shown') return;
    const previous = this.bannerState;
    // Marked as shown before the call: the size event can arrive before the call returns.
    this.bannerState = 'shown';
    this.reserveSpace(this.bannerHeight || adsConfig.bannerHeightFallback);
    try {
      if (previous === 'hidden') {
        await AdMob.resumeBanner();
      } else {
        await AdMob.showBanner({
          adId: adsConfig.banner,
          isTesting: adsConfig.useTestAds,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: adsConfig.bannerBottomMargin,
        });
      }
    } catch (error) {
      console.warn('Banner failed:', error);
      this.bannerState = previous;
      this.reserveSpace(0);
    }
  }

  async hideBanner(): Promise<void> {
    if (!this.ready || this.bannerState !== 'shown') return;
    this.bannerState = 'hidden';
    this.reserveSpace(0);
    try {
      await AdMob.hideBanner();
    } catch {
      // Nothing to hide.
    }
  }

  /** Publishes the banner height so page content keeps clear of it. */
  private reserveSpace(height: number): void {
    document.documentElement.style.setProperty('--ad-height', `${height}px`);
  }

  /** Call after a completed user action. Shows an interstitial every Nth action, at most once per cooldown. */
  async recordAction(): Promise<void> {
    if (!this.ready || !isConfigured(adsConfig.interstitial)) return;
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

  /** Opens Google's privacy choices form (consent withdrawal / ad personalisation). */
  async showPrivacyOptions(): Promise<void> {
    try {
      await AdMob.showPrivacyOptionsForm();
    } catch (error) {
      console.warn('Privacy options failed:', error);
    }
  }

  private async loadInterstitial(): Promise<void> {
    if (!isConfigured(adsConfig.interstitial)) return;
    try {
      await AdMob.prepareInterstitial({ adId: adsConfig.interstitial, isTesting: adsConfig.useTestAds });
      this.interstitialLoaded = true;
    } catch {
      this.interstitialLoaded = false;
    }
  }
}
