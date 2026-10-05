import { TestBed } from '@angular/core/testing';
import { adsConfig } from '../../environments/ads.config';
import { AdService } from './ad.service';

describe('AdService', () => {
  it('is a safe no-op in the browser', async () => {
    const ads = TestBed.inject(AdService);
    await ads.init();
    await ads.showBanner();
    await ads.recordAction();
    await ads.hideBanner();
    expect(ads.bannerVisible).toBeFalse();
  });

  it('uses Google test ad ids while test ads are on', () => {
    expect(adsConfig.useTestAds).toBeTrue();
    expect(adsConfig.banner).toContain('ca-app-pub-3940256099942544');
    expect(adsConfig.interstitial).toContain('ca-app-pub-3940256099942544');
  });
});
