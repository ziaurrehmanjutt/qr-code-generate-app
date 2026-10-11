import { ApplicationRef, Injectable, NgZone } from '@angular/core';
import { AR } from './ar';
import { ES } from './es';
import { FR } from './fr';
import { HI } from './hi';
import { UR } from './ur';
import { ID } from './id';
import { PT } from './pt';
import { TR } from './tr';
import { BN } from './bn';
import { FIL } from './fil';
import { FA } from './fa';

export type Lang = 'en' | 'ar' | 'es' | 'fr' | 'hi' | 'ur' | 'id' | 'pt' | 'tr' | 'bn' | 'fil' | 'fa';

/** Every language the app offers. `name` is written in that language itself. */
export const LANGUAGES: { code: Lang; name: string; hint: string }[] = [
  { code: 'en', name: 'English', hint: 'Continue in English' },
  { code: 'ar', name: 'العربية', hint: 'المتابعة بالعربية' },
  { code: 'es', name: 'Español', hint: 'Continuar en español' },
  { code: 'fr', name: 'Français', hint: 'Continuer en français' },
  { code: 'hi', name: 'हिन्दी', hint: 'हिन्दी में जारी रखें' },
  { code: 'ur', name: 'اردو', hint: 'اردو میں جاری رکھیں' },
  { code: 'id', name: 'Indonesia', hint: 'Lanjutkan dalam Bahasa Indonesia' },
  { code: 'pt', name: 'Português', hint: 'Continuar em português' },
  { code: 'tr', name: 'Türkçe', hint: 'Türkçe devam et' },
  { code: 'bn', name: 'বাংলা', hint: 'বাংলায় চালিয়ে যান' },
  { code: 'fil', name: 'Filipino', hint: 'Magpatuloy sa Filipino' },
  { code: 'fa', name: 'فارسی', hint: 'ادامه به فارسی' },
];

const DICTIONARIES: Partial<Record<Lang, Record<string, string>>> = { ar: AR, es: ES, fr: FR, hi: HI, ur: UR, id: ID, pt: PT, tr: TR, bn: BN, fil: FIL, fa: FA };
const RTL: Lang[] = ['ar', 'ur', 'fa'];

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
    // Android may report old codes: "in" for Indonesian, "tl" for Tagalog (Filipino).
    const aliases: Record<string, string> = { in: 'id', tl: 'fil' };
    const normalized = aliases[code] || code;
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
