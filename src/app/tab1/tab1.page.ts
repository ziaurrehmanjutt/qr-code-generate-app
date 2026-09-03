import { Component } from '@angular/core';
import { SavedQrCode, QrStorageService } from '../services/qr-storage.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  savedCodes: SavedQrCode[] = [];
  isLoading = true;

  constructor(private qrStorage: QrStorageService) {}

  async ionViewWillEnter(): Promise<void> {
    this.isLoading = true;
    this.savedCodes = await this.qrStorage.list();
    this.isLoading = false;
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(date));
  }
}
