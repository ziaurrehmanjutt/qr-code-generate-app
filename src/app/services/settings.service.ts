import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  haptics: boolean;
  saveHistory: boolean;
  defaultFormat: 'png' | 'jpeg' | 'svg' | 'webp';
  onboarded: boolean;
}

const DEFAULTS: AppSettings = { theme: 'system', haptics: true, saveHistory: true, defaultFormat: 'png', onboarded: false };
const KEY = 'app-settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  settings: AppSettings = { ...DEFAULTS };
  private media = window.matchMedia?.('(prefers-color-scheme: dark)');

  /** Loads the saved settings and applies the theme. Call once on app start. */
  async init(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: KEY });
      this.settings = { ...DEFAULTS, ...(value ? JSON.parse(value) : {}) };
    } catch {
      this.settings = { ...DEFAULTS };
    }
    this.media?.addEventListener?.('change', () => this.applyTheme());
    this.applyTheme();
  }

  async update(patch: Partial<AppSettings>): Promise<void> {
    this.settings = { ...this.settings, ...patch };
    this.applyTheme();
    await Preferences.set({ key: KEY, value: JSON.stringify(this.settings) });
  }

  private applyTheme(): void {
    const dark = this.settings.theme === 'dark' || (this.settings.theme === 'system' && !!this.media?.matches);
    document.documentElement.classList.toggle('ion-palette-dark', dark);
  }
}
