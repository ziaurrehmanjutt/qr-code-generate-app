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

  it('uses ad ids that match the selected mode', () => {
    const publisher = adsConfig.useTestAds ? 'ca-app-pub-3940256099942544' : 'ca-app-pub-9813075579951410';
    expect(adsConfig.banner).toContain(publisher);
    expect(adsConfig.interstitial).toContain(publisher);
  });
});
