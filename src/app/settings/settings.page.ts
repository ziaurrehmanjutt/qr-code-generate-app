import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Share } from '@capacitor/share';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { QrStorageService } from '../services/qr-storage.service';
import { AppSettings, SettingsService, ThemeMode } from '../services/settings.service';

const APP_ID = 'io.zia.qrtest';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink],
})
export class SettingsPage {
  constructor(
    private settings: SettingsService,
    private storage: QrStorageService,
    private alerts: AlertController,
    private toasts: ToastController,
  ) {}

  get current(): AppSettings {
    return this.settings.settings;
  }

  setTheme(value: unknown): void {
    this.settings.update({ theme: value as ThemeMode });
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
      await Share.share({ title: 'QR House', text: 'Create, style and scan QR codes with QR House.', url: `https://play.google.com/store/apps/details?id=${APP_ID}` });
    } catch {
      // The share sheet was dismissed.
    }
  }

  rateApp(): void {
    window.open(`market://details?id=${APP_ID}`, '_blank');
  }

  private async confirm(header: string, message: string, action: () => Promise<void>, done: string): Promise<void> {
    const alert = await this.alerts.create({
      header,
      message,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await action();
            (await this.toasts.create({ message: done, duration: 1800 })).present();
          },
        },
      ],
    });
    await alert.present();
  }
}
