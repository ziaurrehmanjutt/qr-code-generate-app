import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Share } from '@capacitor/share';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { QrStorageService } from '../services/qr-storage.service';
import { AppSettings, SettingsService, ThemeMode } from '../services/settings.service';
import { Lang, TranslateService } from '../i18n/translate.service';
import { SharedModule } from '../shared/shared.module';

const APP_ID = 'io.zia.qrtest';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, SharedModule],
})
export class SettingsPage {
  constructor(
    private settings: SettingsService,
    private storage: QrStorageService,
    private alerts: AlertController,
    private toasts: ToastController,
    private i18n: TranslateService,
  ) {}

  get current(): AppSettings {
    return this.settings.settings;
  }

  setTheme(value: unknown): void {
    this.settings.update({ theme: value as ThemeMode });
  }

  setLanguage(value: unknown): void {
    this.settings.update({ language: value as Lang });
  }

  setFormat(value: unknown): void {
    this.settings.update({ defaultFormat: value as AppSettings['defaultFormat'] });
  }

  toggle(key: 'haptics' | 'saveHistory', checked: boolean): void {
    this.settings.update({ [key]: checked });
  }

  clearHistory(): Promise<void> {
    return this.confirm('Clear scan history?', 'Favorite scans are cleared too.', () => this.storage.clearScans(), 'Scan history cleared');
  }

  clearSaved(): Promise<void> {
    return this.confirm('Delete all saved codes?', 'This cannot be undone.', () => this.storage.clearSaved(), 'Saved codes deleted');
  }

  async shareApp(): Promise<void> {
    try {
      await Share.share({ title: 'QR House', text: this.i18n.t('Create, style and scan QR codes with QR House.'), url: `https://play.google.com/store/apps/details?id=${APP_ID}` });
    } catch {
      // The share sheet was dismissed.
    }
  }

  rateApp(): void {
    window.open(`market://details?id=${APP_ID}`, '_blank');
  }

  private async confirm(header: string, message: string, action: () => Promise<void>, done: string): Promise<void> {
    const t = (key: string) => this.i18n.t(key);
    const alert = await this.alerts.create({
      header: t(header),
      message: t(message),
      buttons: [
        { text: t('Cancel'), role: 'cancel' },
        {
          text: t('Delete'),
          role: 'destructive',
          handler: async () => {
            await action();
            (await this.toasts.create({ message: t(done), duration: 1800 })).present();
          },
        },
      ],
    });
    await alert.present();
  }
}
