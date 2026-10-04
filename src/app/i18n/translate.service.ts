import { ApplicationRef, Injectable, NgZone } from '@angular/core';
import { AR } from './ar';

export type Lang = 'en' | 'ar';

/**
 * Minimal translation service. The English text is the key, so templates stay readable
 * and any text without a translation simply shows in English.
 */
@Injectable({ providedIn: 'root' })
export class TranslateService {
  lang: Lang = 'en';

  constructor(private zone: NgZone, private app: ApplicationRef) {}

  /** Device language on first run: Arabic when the phone is set to Arabic, English otherwise. */
  static detect(): Lang {
    return (navigator.language || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  }

  setLang(lang: Lang): void {
    this.lang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  /**
   * Re-renders every visible page. Ionic's touch gestures can emit events outside Angular's zone,
   * and then no change detection runs, so the language would not visibly change.
   */
  refresh(): void {
    this.zone.run(() => this.app.tick());
  }

  /** Translates `key`; `{name}` placeholders are replaced from `params`. */
  t(key: string, params?: Record<string, string | number>): string {
    let text = (this.lang === 'ar' && AR[key]) || key;
    if (params) {
      for (const [name, value] of Object.entries(params)) text = text.split(`{${name}}`).join(String(value));
    }
    return text;
  }
}
