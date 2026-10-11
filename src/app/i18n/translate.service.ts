import { ApplicationRef, Injectable, NgZone } from '@angular/core';
import { AR } from './ar';
import { ES } from './es';
import { FR } from './fr';
import { HI } from './hi';
import { UR } from './ur';
import { ID } from './id'; 

export type Lang = 'en' | 'ar' | 'es' | 'fr' | 'hi' | 'ur' | 'id';

/** Every language the app offers. `name` is written in that language itself. */
export const LANGUAGES: { code: Lang; name: string; hint: string }[] = [
  { code: 'en', name: 'English', hint: 'Continue in English' },
  { code: 'ar', name: 'العربية', hint: 'المتابعة بالعربية' },
  { code: 'es', name: 'Español', hint: 'Continuar en español' },
  { code: 'fr', name: 'Français', hint: 'Continuer en français' },
  { code: 'hi', name: 'हिन्दी', hint: 'हिन्दी में जारी रखें' },
  { code: 'ur', name: 'اردو', hint: 'اردو میں جاری رکھیں' },
  { code: 'id', name: 'Indonesia', hint: 'Lanjutkan dalam Bahasa Indonesia' },
];

const DICTIONARIES: Partial<Record<Lang, Record<string, string>>> = { ar: AR, es: ES, fr: FR, hi: HI, ur: UR, id: ID };
const RTL: Lang[] = ['ar', 'ur'];

/**
 * Minimal translation service. The English text is the key, so templates stay readable
 * and any text without a translation simply shows in English.
 */
@Injectable({ providedIn: 'root' })
export class TranslateService {
  lang: Lang = 'en';

  constructor(private zone: NgZone, private app: ApplicationRef) {}

  /** Device language on first run: the phone's language when the app has it, English otherwise. */
  static detect(): Lang {
    const code = (navigator.language || 'en').toLowerCase().split('-')[0];
    // Android may still report the old code "in" for Indonesian.
    const normalized = code === 'in' ? 'id' : code;
    return LANGUAGES.some(l => l.code === normalized) ? (normalized as Lang) : 'en';
  }

  setLang(lang: Lang): void {
    this.lang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.includes(lang) ? 'rtl' : 'ltr';
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
    let text = DICTIONARIES[this.lang]?.[key] || key;
    if (params) {
      for (const [name, value] of Object.entries(params)) text = text.split(`{${name}}`).join(String(value));
    }
    return text;
  }
}
