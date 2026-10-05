import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { CapacitorWifi } from '@capgo/capacitor-wifi';
import jsQR from 'jsqr';
import { FileOpener } from '@capacitor-community/file-opener';
import { AdService } from '../services/ad.service';
import { DecodedQrResult, QrDecodeService, QuickAction } from '../services/qr-decode.service';
import { QrStorageService, ScanRecord } from '../services/qr-storage.service';
import { QrService } from '../services/qr.service';
import { SettingsService } from '../services/settings.service';
import { TranslateService } from '../i18n/translate.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  decodedResult: DecodedQrResult | null = null;
  savedScan: ScanRecord | null = null;
  isScanning = false;
  scanError = '';
  notice = '';

  constructor(
    private qrDecodeService: QrDecodeService,
    private qrStorage: QrStorageService,
    private qrService: QrService,
    private router: Router,
    private settings: SettingsService,
    private i18n: TranslateService,
    public ads: AdService,
  ) {}

  ionViewDidEnter(): void {
    this.ads.showBanner();
  }

  ionViewWillLeave(): void {
    this.ads.hideBanner();
  }

  async scanBarcode(): Promise<void> {
    this.isScanning = true;
    this.scanError = '';
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({ hint: CapacitorBarcodeScannerTypeHint.ALL });
      const raw = result.ScanResult?.trim();
      if (raw) await this.showResult(raw);
    } catch (error) {
      console.error(error);
      this.scanError = this.i18n.t('The scan was cancelled or the camera could not be opened.');
    } finally {
      this.isScanning = false;
    }
  }

  /** Decodes a value, shows it, and records it in the scan history. */
  async showResult(raw: string): Promise<void> {
    this.decodedResult = this.qrDecodeService.decode(raw);
    this.savedScan = null;
    if (this.settings.settings.saveHistory) {
      this.savedScan = await this.qrStorage.addScan({
        type: this.decodedResult.type,
        icon: this.decodedResult.icon,
        title: this.decodedResult.title,
        raw,
      });
    }
    this.ads.recordAction();
    if (this.settings.settings.haptics) Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
  }

  /** Reads a QR code from a picture chosen in the gallery. */
  async scanFromImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.scanError = '';
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext('2d', { willReadFrequently: true })!;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
      if (code?.data) await this.showResult(code.data);
      else this.scanError = this.i18n.t('No QR code was found in that image.');
    } catch (error) {
      console.error(error);
      this.scanError = this.i18n.t('That image could not be read.');
    }
  }

  async runMainAction(): Promise<void> {
    const result = this.decodedResult;
    if (!result) return;
    if (result.actionWifi) await this.connectWifi(result.actionWifi);
    else if (result.actionIcs) await this.openFile('scanned-event.ics', result.actionIcs, 'text/calendar');
    else if (result.actionVcard) await this.openFile('scanned-contact.vcf', result.actionVcard, 'text/x-vcard');
    else if (result.actionUrl) this.openUrl(result.actionUrl);
    else await this.copy(result.actionCopy || result.raw);
  }

  async runAction(action: QuickAction): Promise<void> {
    if (action.url) this.openUrl(action.url);
    else if (action.copy !== undefined) await this.copy(action.copy);
  }

  async copyResult(): Promise<void> {
    if (this.decodedResult) await this.copy(this.decodedResult.raw);
  }

  async shareResult(): Promise<void> {
    if (!this.decodedResult) return;
    try {
      await Share.share({ title: this.decodedResult.title, text: this.decodedResult.raw });
    } catch {
      await this.copy(this.decodedResult.raw);
    }
  }

  async toggleFavorite(): Promise<void> {
    if (!this.savedScan) return;
    await this.qrStorage.toggleScanFavorite(this.savedScan.id);
    this.savedScan = { ...this.savedScan, favorite: !this.savedScan.favorite };
  }

  /** Opens the Create tab with the scanned value, keeping the current style. */
  createSimilar(): void {
    if (!this.decodedResult) return;
    this.qrService.loadConfig({ ...this.qrService.config, contentType: 'text', data: this.decodedResult.raw, fields: {} });
    this.router.navigateByUrl('/tabs/tab2');
  }

  clearResult(): void {
    this.decodedResult = null;
    this.savedScan = null;
  }

  private openUrl(url: string): void {
    // The Android webview hands non-app URLs (https, tel, mailto, geo) to the matching app.
    window.open(url, '_blank');
  }

  private async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.flash('Copied to clipboard');
    } catch {
      this.flash('Copy is not available on this device');
    }
  }

  /** Writes text to a cache file and hands it to the matching app (contacts, calendar). */
  private async openFile(path: string, text: string, contentType: string): Promise<void> {
    try {
      const file = await Filesystem.writeFile({ path, data: btoa(String.fromCharCode(...new TextEncoder().encode(text))), directory: Directory.Cache });
      await FileOpener.open({ filePath: file.uri, contentType, openWithDefault: true });
    } catch {
      await this.copy(text);
    }
  }

  /** Asks Android to join the scanned Wi-Fi network. */
  private async connectWifi(wifi: { ssid: string; password: string; hidden: boolean }): Promise<void> {
    try {
      await CapacitorWifi.requestPermissions();
      await CapacitorWifi.addNetwork({ ssid: wifi.ssid, password: wifi.password || undefined, isHiddenSsid: wifi.hidden });
      this.flash('Network added. Confirm in the system prompt if asked.');
    } catch {
      if (wifi.password) await this.copy(wifi.password);
      this.flash('Could not connect here. Password copied instead.');
    }
  }

  private flash(message: string): void {
    this.notice = this.i18n.t(message);
    setTimeout(() => (this.notice = ''), 1800);
  }
}
