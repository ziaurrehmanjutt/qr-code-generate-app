import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';
import { DecodedQrResult, QrDecodeService, QuickAction } from '../services/qr-decode.service';
import { QrStorageService, ScanRecord } from '../services/qr-storage.service';
import { QrService } from '../services/qr.service';

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
  ) {}

  async scanBarcode(): Promise<void> {
    this.isScanning = true;
    this.scanError = '';
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({ hint: CapacitorBarcodeScannerTypeHint.ALL });
      const raw = result.ScanResult?.trim();
      if (raw) await this.showResult(raw);
    } catch (error) {
      console.error(error);
      this.scanError = 'The scan was cancelled or the camera could not be opened.';
    } finally {
      this.isScanning = false;
    }
  }

  /** Decodes a value, shows it, and records it in the scan history. */
  async showResult(raw: string): Promise<void> {
    this.decodedResult = this.qrDecodeService.decode(raw);
    this.savedScan = await this.qrStorage.addScan({
      type: this.decodedResult.type,
      icon: this.decodedResult.icon,
      title: this.decodedResult.title,
      raw,
    });
    Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
  }

  async runMainAction(): Promise<void> {
    const result = this.decodedResult;
    if (!result) return;
    if (result.actionVcard) await this.saveContact(result.actionVcard);
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

  /** Saves a vCard to a file and hands it to the contacts app. */
  private async saveContact(vcard: string): Promise<void> {
    try {
      const file = await Filesystem.writeFile({ path: 'scanned-contact.vcf', data: btoa(String.fromCharCode(...new TextEncoder().encode(vcard))), directory: Directory.Cache });
      await FileOpener.open({ filePath: file.uri, contentType: 'text/x-vcard', openWithDefault: true });
    } catch {
      await this.copy(vcard);
    }
  }

  private flash(message: string): void {
    this.notice = message;
    setTimeout(() => (this.notice = ''), 1800);
  }
}
