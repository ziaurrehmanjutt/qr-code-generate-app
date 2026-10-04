import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
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
  index = 0;
  slides = [
    { icon: 'color-wand-outline', title: 'Create beautiful codes', text: 'Links, Wi-Fi, contacts, events and more. Pick a style, colors and a logo.' },
    { icon: 'scan-outline', title: 'Scan and act fast', text: 'Scan with the camera or from a picture, then open, call, connect or save in one tap.' },
    { icon: 'bookmark-outline', title: 'Keep everything', text: 'Your codes and scans stay on your phone, ready to edit, share or save to the gallery.' },
  ];

  constructor(private settings: SettingsService, private router: Router) {}

  get last(): boolean {
    return this.index === this.slides.length - 1;
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
