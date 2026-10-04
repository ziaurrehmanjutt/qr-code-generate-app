import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '../i18n/translate.service';

/** `{{ 'Create' | t }}` or `{{ '{{n}} this week' | t: { n: 3 } }}`. Impure so it follows language changes. */
@Pipe({ name: 't', pure: false, standalone: false })
export class TPipe implements PipeTransform {
  constructor(private i18n: TranslateService) {}

  transform(key: string | null | undefined, params?: Record<string, string | number>): string {
    return key ? this.i18n.t(key, params) : '';
  }
}
