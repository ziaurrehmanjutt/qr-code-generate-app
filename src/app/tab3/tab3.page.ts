import { Component } from '@angular/core';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { DecodedQrResult, QrDecodeService } from '../services/qr-decode.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  decodedResult: DecodedQrResult | null = null;
  isScanning = false;
  scanError = '';
  copied = false;

  constructor(private qrDecodeService: QrDecodeService) {}

  async scanBarcode(): Promise<void> {
    this.isScanning = true;
    this.scanError = '';
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({ hint: CapacitorBarcodeScannerTypeHint.QR_CODE });
      const raw = result.ScanResult?.trim();
      if (raw) this.decodedResult = this.qrDecodeService.decode(raw);
    } catch (error) {
      console.error(error);
      this.scanError = 'The scan was cancelled or the camera could not be opened.';
    } finally {
      this.isScanning = false;
    }
  }

  async copyResult(): Promise<void> {
    if (!this.decodedResult) return;
    await navigator.clipboard?.writeText(this.decodedResult.raw);
    this.copied = true;
    setTimeout(() => this.copied = false, 1800);
  }

  openResult(): void {
    if (!this.decodedResult) return;
    if (this.decodedResult.actionUrl) window.open(this.decodedResult.actionUrl, '_blank', 'noopener');
    else this.copyResult();
  }

  shareResult(): void {
    if (!this.decodedResult) return;
    if (navigator.share) {
      navigator.share({ title: this.decodedResult.title, text: this.decodedResult.raw }).catch(() => undefined);
    } else {
      this.copyResult();
    }
  }

  ionViewWillEnter(){

    this.scanBarcode();
  }

}
