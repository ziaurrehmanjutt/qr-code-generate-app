import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Lang } from '../i18n/translate.service';
import { SettingsService } from '../services/settings.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-onboarding',
  templateUrl: 'onboarding.page.html',
  styleUrls: ['onboarding.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, SharedModule],
})
export class OnboardingPage {
  /** Step 0 is the language choice, the following steps are the intro slides. */
  index = 0;
  slides = [
    { icon: 'color-wand-outline', title: 'Create beautiful codes', text: 'Links, Wi-Fi, contacts, events and more. Pick a style, colors and a logo.' },
    { icon: 'scan-outline', title: 'Scan and act fast', text: 'Scan with the camera or from a picture, then open, call, connect or save in one tap.' },
    { icon: 'bookmark-outline', title: 'Keep everything', text: 'Your codes and scans stay on your phone, ready to edit, share or save to the gallery.' },
  ];
  languages: { code: Lang; name: string; hint: string }[] = [
    { code: 'en', name: 'English', hint: 'Continue in English' },
    { code: 'ar', name: 'العربية', hint: 'المتابعة بالعربية' },
  ];

  constructor(private settings: SettingsService, private router: Router) {}

  get language(): Lang {
    return this.settings.settings.language;
  }

  /** Total number of steps, the language step included. */
  get steps(): number[] {
    return Array.from({ length: this.slides.length + 1 }, (_, i) => i);
  }

  get last(): boolean {
    return this.index === this.slides.length;
  }

  chooseLanguage(code: Lang): void {
    this.settings.update({ language: code });
  }

  async next(): Promise<void> {
    if (!this.last) {
      this.index++;
      return;
    }
    await this.finish();
  }

  async finish(): Promise<void> {
    await this.settings.update({ onboarded: true });
    this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
  }
}
