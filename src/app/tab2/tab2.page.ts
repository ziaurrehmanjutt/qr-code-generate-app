import { Component, ElementRef, ViewChild } from '@angular/core';
import { Device } from '@capacitor/device';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';
import { Media } from '@capacitor-community/media';
import {
  QrService,
  QrConfig,
  QrContentType,
  QrField,
  SUPPORTED_OPTIONS,
} from '../services/qr.service';
import { AdService } from '../services/ad.service';
import { QrStorageService } from '../services/qr-storage.service';
import { SettingsService } from '../services/settings.service';
import { TranslateService } from '../i18n/translate.service';

type Panel = 'style' | 'colors' | 'logo' | 'more';
type ExportAction = 'share' | 'open' | 'gallery' | 'app';
type ColorTarget = { prefix: 'dots' | 'bg' | 'cornersSquare' | 'cornersDot'; label: string };

const GALLERY_ALBUM = 'DiyaQR';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLDivElement>;

  qrCode: any = null;

  supported = SUPPORTED_OPTIONS;
  config = this.qrService.config;

  /** Raw value typed by the user (kept separate from the formatted QR data). */
  rawValue = 'Hello World!';

  panels: { id: Panel; label: string; icon: string }[] = [
    { id: 'style', label: 'Style', icon: 'shapes-outline' },
    { id: 'colors', label: 'Colors', icon: 'color-palette-outline' },
    { id: 'logo', label: 'Logo', icon: 'image-outline' },
    { id: 'more', label: 'More', icon: 'options-outline' },
  ];
  panel: Panel = 'style';

  colorTargets: ColorTarget[] = [
    { prefix: 'dots', label: 'Dots' },
    { prefix: 'bg', label: 'Background' },
    { prefix: 'cornersSquare', label: 'Corner frame' },
    { prefix: 'cornersDot', label: 'Corner dot' },
  ];
  /** Color rows whose gradient options are expanded. */
  openGradients = new Set<string>();

  // Export sheet
  isDownloadSheetOpen = false;
  downloadFormat: 'png' | 'jpeg' | 'svg' | 'webp' = 'png';
  exportAction: ExportAction = 'share';
  isLocating = false;
  isFullOpen = false;
  notice = '';

  constructor(
    private qrService: QrService,
    private qrStorage: QrStorageService,
    private settings: SettingsService,
    private i18n: TranslateService,
    private ads: AdService,
  ) {}

  ionViewWillEnter() {
    // The config may have been replaced elsewhere (edit a saved code, create similar).
    this.config = this.qrService.config;
    this.rawValue = this.config.data;
    this.downloadFormat = this.config.extension === 'png' ? this.settings.settings.defaultFormat : this.config.extension;
    this.generateQrCode();
  }

  // ---------------- Content ----------------

  get contentType(): QrContentType {
    return this.config.contentType;
  }

  setContentType(type: unknown) {
    if (!type || type === this.config.contentType) return;
    const wasForm = this.qrService.isFormType();
    this.qrService.setContentType(type as QrContentType);
    if (this.qrService.isFormType()) this.rawValue = this.qrService.buildPayload();
    else if (wasForm) this.rawValue = '';
    this.qrService.setData(this.rawValue);
    this.generateQrCode();
  }

  /** Form layout of the selected content type, empty for single-input types. */
  get formFields(): QrField[] {
    return this.supported.forms[this.config.contentType] ?? [];
  }

  fieldValue(key: string): string {
    return this.config.fields[key] ?? '';
  }

  onFieldChange(key: string, value: unknown): void {
    this.qrService.setField(key, String(value ?? ''));
    this.rawValue = this.qrService.buildPayload();
    this.qrService.setData(this.rawValue);
    this.updateQrCode();
  }

  onDataInput(event: any) {
    this.rawValue = event.detail?.value ?? '';
    this.qrService.setData(this.rawValue);
    this.generateQrCode();
  }

  /** Placeholder text that adapts to the selected type. */
  get placeholder(): string {
    switch (this.config.contentType) {
      case 'url': return 'example.com';
      case 'mobile': return '+1 234 567 890';
      case 'whatsapp': return 'Number | Message (e.g. +1 234 567 890 | Hi there)';
      default: return 'Type or paste your text';
    }
  }

  get formattedPreview(): string {
    return this.qrService.formatValue(this.rawValue);
  }

  /** True while there is nothing to encode, so no code is drawn. */
  get isEmpty(): boolean {
    return !this.formattedPreview;
  }

  get warnings(): string[] {
    return this.qrService.getWarnings();
  }

  /** Fills the latitude and longitude fields from the device position. */
  async useMyLocation(): Promise<void> {
    this.isLocating = true;
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      this.qrService.setField('lat', position.coords.latitude.toFixed(6));
      this.onFieldChange('lng', position.coords.longitude.toFixed(6));
    } catch {
      this.flash('Location is not available. Check the permission and GPS.');
    } finally {
      this.isLocating = false;
    }
  }

  // ---------------- Style panels ----------------

  setPanel(value: unknown): void {
    this.panel = value as Panel;
  }

  /** Rebuilds the code. update() merges options, so a removed gradient would otherwise stay. */
  generateQrCode() {
    if (this.canvas?.nativeElement) this.canvas.nativeElement.innerHTML = '';
    if (this.isEmpty) {
      this.qrCode = null;
      return;
    }
    this.qrCode = this.qrService.createQrCode();
    if (this.canvas?.nativeElement) this.qrCode.append(this.canvas.nativeElement);
  }

  /** Opens the code at full size, so a logo or the edges can be checked. */
  openFull(open: boolean): void {
    this.isFullOpen = open && !this.isEmpty;
  }

  renderFull(): void {
    const target = document.getElementById('full-qr');
    if (!target) return;
    target.innerHTML = '';
    // Render at the screen's pixel width so the enlarged code stays sharp.
    const size = Math.min(1600, Math.round(Math.max(window.innerWidth, 320) * (window.devicePixelRatio || 1)));
    this.qrService.createQrCode(size).append(target);
  }

  updateQrCode() {
    this.generateQrCode();
  }

  applyPreset(preset: { patch: Partial<QrConfig> }): void {
    Object.assign(this.config, preset.patch);
    this.updateQrCode();
  }

  updateStyle(option: 'dotsType' | 'cornersSquareType', value: string): void {
    this.setOption(option, value);
  }

  setOption(option: string, value: unknown): void {
    this.qrService.updateOption(option as keyof QrConfig, value as never);
    this.updateQrCode();
  }

  onSelectChange(event: any, prop: string) {
    this.setOption(prop, event.detail?.value);
  }

  onRangeChange(event: any, prop: string) {
    this.setOption(prop, Number(event.detail?.value));
  }

  onToggleChange(event: any, prop: string) {
    this.setOption(prop, event.detail?.checked);
  }

  // Color rows are addressed by prefix, for example dots -> dotsColor, dotsGradientType...
  color(target: ColorTarget, suffix: 'Color' | 'GradientColor1' | 'GradientColor2'): string {
    return (this.config as any)[target.prefix + suffix];
  }

  gradient(target: ColorTarget): string {
    return (this.config as any)[target.prefix + 'GradientType'];
  }

  rotation(target: ColorTarget): number {
    return (this.config as any)[target.prefix + 'GradientRotation'];
  }

  onColorInput(event: any, target: ColorTarget, suffix: string): void {
    this.setOption(target.prefix + suffix, event.target?.value);
  }

  setGradient(target: ColorTarget, type: unknown): void {
    this.setOption(target.prefix + 'GradientType', type);
  }

  setRotation(event: any, target: ColorTarget): void {
    this.setOption(target.prefix + 'GradientRotation', Number(event.detail?.value));
  }

  toggleGradient(target: ColorTarget): void {
    if (this.openGradients.has(target.prefix)) this.openGradients.delete(target.prefix);
    else this.openGradients.add(target.prefix);
  }

  /** Lets the user pick a logo from the device gallery. */
  onLogoPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.setOption('imageUrl', reader.result as string);
      if (this.config.errorCorrectionLevel === 'L' || this.config.errorCorrectionLevel === 'M') this.setOption('errorCorrectionLevel', 'Q');
    };
    reader.readAsDataURL(file);
  }

  onImageUrlInput(event: any) {
    this.setOption('imageUrl', event.detail?.value ?? '');
  }

  onFileNameInput(event: any) {
    this.qrService.updateOption('fileName', event.detail?.value?.trim() || 'qr-code');
  }

  resetToDefaults() {
    this.qrService.resetToDefaults();
    this.config = this.qrService.config;
    this.rawValue = this.config.data;
    this.generateQrCode();
  }

  // ---------------- Export ----------------

  setDownloadModalOpen(isOpen: boolean) {
    this.isDownloadSheetOpen = isOpen;
  }

  selectFormat(format: 'png' | 'jpeg' | 'svg' | 'webp'): void {
    this.downloadFormat = format;
    this.qrService.updateOption('extension', format);
  }

  async runExportAction(): Promise<void> {
    if (!this.qrCode) {
      this.flash('Nothing to export yet. Add some content first.');
      return;
    }
    switch (this.exportAction) {
      case 'open': await this.open(); break;
      case 'gallery': await this.saveToGallery(); break;
      case 'app': await this.saveInApp(); break;
      default: await this.download();
    }
    // Save in app already counts itself.
    if (this.exportAction !== 'app') this.ads.recordAction();
  }

  private get mimeMap(): Record<string, string> {
    return { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };
  }

  private async isBrowser(): Promise<boolean> {
    return (await Device.getInfo()).platform === 'web';
  }

  private async rawBase64(ext: string): Promise<string> {
    const blob: Blob = await this.qrCode.getRawData(ext);
    const dataUrl = await this.blobToBase64(blob);
    return dataUrl.includes('base64,') ? dataUrl.split('base64,')[1] : dataUrl;
  }

  private async writeToCache(fileName: string, ext: string): Promise<string> {
    const file = await Filesystem.writeFile({ path: `${fileName}.${ext}`, data: await this.rawBase64(ext), directory: Directory.Cache, recursive: true });
    return file.uri;
  }

  async download() {
    const fileName = this.config.fileName || 'qr-code';
    const ext = this.downloadFormat;
    if (await this.isBrowser()) {
      this.qrCode?.download({ name: fileName, extension: ext });
      return;
    }
    try {
      const uri = await this.writeToCache(fileName, ext);
      await Share.share({ title: fileName, text: `QR Code: ${this.formattedPreview}`, url: uri, dialogTitle: 'Save or Share QR Code' });
      this.isDownloadSheetOpen = false;
    } catch (error) {
      console.error('Share failed:', error);
    }
  }

  async open() {
    const fileName = this.config.fileName || 'qr-code';
    const ext = this.downloadFormat;
    if (await this.isBrowser()) {
      this.qrCode?.download({ name: fileName, extension: ext });
      return;
    }
    try {
      const uri = await this.writeToCache(fileName, ext);
      await FileOpener.open({ filePath: uri, contentType: this.mimeMap[ext], openWithDefault: true });
      this.isDownloadSheetOpen = false;
    } catch (error) {
      console.error('Open failed:', error);
      this.flash('Could not open the file with another app.');
    }
  }

  /** Saves the code as a picture into the "DiyaQR" album of the gallery. */
  async saveToGallery(): Promise<void> {
    const fileName = this.config.fileName || 'qr-code';
    if (await this.isBrowser()) {
      this.qrCode?.download({ name: fileName, extension: this.downloadFormat });
      return;
    }
    try {
      // The gallery stores pictures only, so SVG is saved as PNG.
      const ext = this.downloadFormat === 'svg' ? 'png' : this.downloadFormat;
      const blob: Blob = await this.qrCode.getRawData(ext);
      const dataUrl = await this.blobToBase64(blob);
      let album = (await Media.getAlbums()).albums.find((a) => a.name === GALLERY_ALBUM);
      if (!album) {
        await Media.createAlbum({ name: GALLERY_ALBUM });
        album = (await Media.getAlbums()).albums.find((a) => a.name === GALLERY_ALBUM);
      }
      await Media.savePhoto({ path: dataUrl, albumIdentifier: album?.identifier, fileName });
      this.isDownloadSheetOpen = false;
      this.flash('Saved to the DiyaQR gallery album.');
    } catch (error) {
      console.error('Gallery save failed:', error);
      this.flash('Could not save to the gallery.');
    }
  }

  async saveInApp(): Promise<void> {
    if (!this.qrCode) {
      this.flash('Nothing to export yet. Add some content first.');
      return;
    }
    const fileName = this.config.fileName || 'qr-code';
    const ext = this.downloadFormat;
    await this.qrStorage.saveToApp(fileName, ext, await this.rawBase64(ext), this.config);
    this.isDownloadSheetOpen = false;
    this.flash('Saved to your library.');
    this.ads.recordAction();
  }

  private flash(message: string): void {
    this.notice = this.i18n.t(message);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
