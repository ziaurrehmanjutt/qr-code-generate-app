import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Lang, TranslateService } from '../i18n/translate.service';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  language: Lang;
  haptics: boolean;
  saveHistory: boolean;
  defaultFormat: 'png' | 'jpeg' | 'svg' | 'webp';
  onboarded: boolean;
}

const DEFAULTS: AppSettings = { theme: 'system', language: 'en', haptics: true, saveHistory: true, defaultFormat: 'png', onboarded: false };
const KEY = 'app-settings';
const BAR_COLORS = { light: '#f4f7f6', dark: '#0c1316' };

@Injectable({ providedIn: 'root' })
export class SettingsService {
  settings: AppSettings = { ...DEFAULTS };
  private media = window.matchMedia?.('(prefers-color-scheme: dark)');

  constructor(private i18n: TranslateService) {}

  /** Loads the saved settings and applies theme and language. Call once on app start. */
  async init(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: KEY });
      this.settings = { ...DEFAULTS, language: TranslateService.detect(), ...(value ? JSON.parse(value) : {}) };
    } catch {
      this.settings = { ...DEFAULTS, language: TranslateService.detect() };
    }
    this.media?.addEventListener?.('change', () => this.applyTheme());
    this.i18n.setLang(this.settings.language);
    this.applyTheme();
  }

  async update(patch: Partial<AppSettings>): Promise<void> {
    this.settings = { ...this.settings, ...patch };
    if (patch.language) {
      this.i18n.setLang(patch.language);
      this.i18n.refresh();
    }
    this.applyTheme();
    await Preferences.set({ key: KEY, value: JSON.stringify(this.settings) });
  }

  /** Switches the palette and makes the system status bar match it (light text on dark and the reverse). */
  private applyTheme(): void {
    const dark = this.settings.theme === 'dark' || (this.settings.theme === 'system' && !!this.media?.matches);
    document.documentElement.classList.toggle('ion-palette-dark', dark);
    if (!Capacitor.isNativePlatform()) return;
    // Style.Dark = light icons for dark backgrounds, Style.Light = dark icons for light backgrounds.
    StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => undefined);
    StatusBar.setBackgroundColor({ color: dark ? BAR_COLORS.dark : BAR_COLORS.light }).catch(() => undefined);
  }
}
