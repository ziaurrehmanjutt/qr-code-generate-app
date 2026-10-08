import { Component } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {

  constructor(private settings: SettingsService) {}

  /** A light tick when switching tabs (follows the "Vibrate" setting). */
  onTabChange(): void {
    if (this.settings.settings.haptics) Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
  }

}
