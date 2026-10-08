import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Share } from '@capacitor/share';
import { QrService } from '../services/qr.service';
import { TranslateService } from '../i18n/translate.service';
import { QrStorageService, SavedQrCode, ScanRecord } from '../services/qr-storage.service';

type LibraryTab = 'saved' | 'scanned' | 'favorites';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  savedCodes: SavedQrCode[] = [];
  scans: ScanRecord[] = [];
  isLoading = true;
  tab: LibraryTab = 'saved';
  query = '';
  weekBars: { label: string; count: number; height: number }[] = [];
  weekCount = 0;
  notice = '';

  constructor(
    private qrStorage: QrStorageService,
    private qrService: QrService,
    private router: Router,
    private i18n: TranslateService,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.isLoading = true;
    [this.savedCodes, this.scans] = await Promise.all([this.qrStorage.list(), this.qrStorage.scans()]);
    this.buildWeek();
    this.isLoading = false;
  }

  // ---------------- Stats ----------------

  get favoriteCodes(): SavedQrCode[] {
    return this.savedCodes.filter((c) => c.favorite);
  }

  get favoriteScans(): ScanRecord[] {
    return this.scans.filter((s) => s.favorite);
  }

  get favoriteCount(): number {
    return this.favoriteCodes.length + this.favoriteScans.length;
  }

  /** Activity (created + scanned) for the last 7 days, oldest first. */
  private buildWeek(): void {
    const day = 24 * 60 * 60 * 1000;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() - (6 - i) * day));
    const counts = days.map((d) => {
      const from = d.getTime();
      const within = (iso: string) => { const t = new Date(iso).getTime(); return t >= from && t < from + day; };
      return this.savedCodes.filter((c) => within(c.createdAt)).length + this.scans.filter((s) => within(s.scannedAt)).length;
    });
    const max = Math.max(1, ...counts);
    this.weekCount = counts.reduce((a, b) => a + b, 0);
    this.weekBars = days.map((d, i) => ({
      label: new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(d),
      count: counts[i],
      height: counts[i] ? Math.max(12, Math.round((counts[i] / max) * 100)) : 4,
    }));
  }

  // ---------------- Lists ----------------

  get visibleCodes(): SavedQrCode[] {
    const q = this.query.trim().toLowerCase();
    const source = this.tab === 'favorites' ? this.favoriteCodes : this.savedCodes;
    return q ? source.filter((c) => `${c.name} ${c.config?.data ?? ''}`.toLowerCase().includes(q)) : source;
  }

  get visibleScans(): ScanRecord[] {
    const q = this.query.trim().toLowerCase();
    const source = this.tab === 'favorites' ? this.favoriteScans : this.scans;
    return q ? source.filter((s) => `${s.title} ${s.raw}`.toLowerCase().includes(q)) : source;
  }

  setTab(value: unknown): void {
    this.tab = value as LibraryTab;
  }

  setQuery(value: unknown): void {
    this.query = String(value ?? '');
  }

  thumb(code: SavedQrCode): string {
    const mime = code.format === 'svg' ? 'image/svg+xml' : `image/${code.format}`;
    return `data:${mime};base64,${code.data}`;
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(date));
  }

  // ---------------- Actions ----------------

  go(path: string): void {
    this.router.navigateByUrl(path);
  }

  /** Opens a saved code in the Create tab with its original settings. */
  edit(code: SavedQrCode): void {
    if (!code.config) {
      this.flash('This code was saved before editing was supported.');
      return;
    }
    this.qrService.loadConfig(code.config);
    this.go('/tabs/tab2');
  }

  async share(code: SavedQrCode): Promise<void> {
    try {
      await Share.share({ title: code.name, url: code.uri, dialogTitle: 'Share QR Code' });
    } catch {
      this.flash('Sharing is not available here.');
    }
  }

  async toggleFavorite(code: SavedQrCode): Promise<void> {
    await this.qrStorage.toggleFavorite(code.id);
    code.favorite = !code.favorite;
  }

  async remove(code: SavedQrCode): Promise<void> {
    await this.qrStorage.remove(code.id);
    this.savedCodes = this.savedCodes.filter((c) => c.id !== code.id);
    this.buildWeek();
  }

  async toggleScanFavorite(scan: ScanRecord): Promise<void> {
    await this.qrStorage.toggleScanFavorite(scan.id);
    scan.favorite = !scan.favorite;
  }

  async removeScan(scan: ScanRecord): Promise<void> {
    await this.qrStorage.removeScan(scan.id);
    this.scans = this.scans.filter((s) => s.id !== scan.id);
    this.buildWeek();
  }

  /** Re-opens a scanned value in the Create tab as plain text. */
  createFromScan(scan: ScanRecord): void {
    this.qrService.loadConfig({ ...this.qrService.config, contentType: 'text', data: scan.raw, fields: {} });
    this.go('/tabs/tab2');
  }

  async copyScan(scan: ScanRecord): Promise<void> {
    try {
      await navigator.clipboard.writeText(scan.raw);
      this.flash('Copied to clipboard');
    } catch {
      this.flash('Copy is not available on this device');
    }
  }

  private flash(message: string): void {
    this.notice = this.i18n.t(message);
  }
}
