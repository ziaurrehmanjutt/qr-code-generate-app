import { Component, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SharedModule } from '../shared/shared.module';
import { SettingsService } from './settings.service';
import { TranslateService } from '../i18n/translate.service';
import { QrService } from './qr.service';

describe('Circle shape', () => {
  it('draws a code (roundSize must stay on in circle shape)', async () => {
    const qr = new QrService();
    qr.config.shape = 'circle';
    qr.config.dotsRoundSize = false;
    const holder = document.createElement('div');
    document.body.appendChild(holder);
    qr.createQrCode().append(holder);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const canvas = holder.querySelector('canvas') as HTMLCanvasElement;
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    expect(pixels.some((value, i) => i % 4 === 0 && value < 100 && pixels[i + 3] > 200)).toBeTrue();
    holder.remove();
  });

  it('has no data to draw when the content is empty', () => {
    const qr = new QrService();
    qr.setData('');
    expect(qr.formatValue(qr.config.data)).toBe('');
  });
});

describe('TranslateService', () => {
  it('translates to Arabic with params and falls back to English', () => {
    const i18n = TestBed.inject(TranslateService);
    i18n.setLang('ar');
    expect(i18n.t('Scan')).toBe('مسح');
    expect(i18n.t('{n} this week', { n: 3 })).toBe('3 هذا الأسبوع');
    expect(i18n.t('Unknown text')).toBe('Unknown text');
    expect(document.documentElement.dir).toBe('rtl');
    i18n.setLang('en');
    expect(i18n.t('Scan')).toBe('Scan');
    expect(document.documentElement.dir).toBe('ltr');
  });
});

describe('Language change from a touch gesture', () => {
  it('re-renders even when it happens outside the Angular zone', async () => {
    @Component({ template: `<p>{{ 'Scan' | t }}</p>`, standalone: false })
    class ProbeComponent {}
    await TestBed.configureTestingModule({ declarations: [ProbeComponent], imports: [SharedModule] }).compileComponents();
    const fixture = TestBed.createComponent(ProbeComponent);
    fixture.autoDetectChanges(true);
    const zone = TestBed.inject(NgZone);
    const settings = TestBed.inject(SettingsService);
    zone.runOutsideAngular(() => { settings.update({ language: 'ar' }); });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fixture.nativeElement.textContent).toContain('مسح');
    await settings.update({ language: 'en' });
  });
});
