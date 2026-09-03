import { Component, ElementRef, ViewChild } from '@angular/core';
import { Device } from '@capacitor/device';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener, FileOpenerOptions } from '@capacitor-community/file-opener';
import {
  QrService,
  QrContentType,
  SUPPORTED_OPTIONS,
} from '../services/qr.service';
import { QrStorageService } from '../services/qr-storage.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLDivElement>;

  qrCode: any = null;

  // Pull supported options + config from the shared service
  supported = SUPPORTED_OPTIONS;
  config = this.qrService.config;

  // Raw value typed by the user (kept separate from the formatted QR data)
  rawValue: string = 'Hello World!';

  // Expandable option sections
  optionSections: { id: string; label: string; icon: string; open: boolean }[] = [
    { id: 'style', label: 'Style Selection', icon: 'color-wand-outline', open: true },
    { id: 'colors', label: 'Colors', icon: 'color-palette-outline', open: false },
    { id: 'image', label: 'Image / Logo', icon: 'image-outline', open: false },
    { id: 'extra', label: 'Extra Options', icon: 'options-outline', open: false },
  ];

  // Download sheet
  isDownloadSheetOpen = false;
  downloadFormat: 'png' | 'jpeg' | 'svg' | 'webp' = 'png';
  exportAction: 'share' | 'open' | 'gallery' | 'app' = 'share';
  exportMessage = '';

  constructor(private qrService: QrService, private qrStorage: QrStorageService) {}

  ionViewWillEnter() {
    this.generateQrCode();
  }

  // ---------------- Data / Segment ----------------

  get contentType(): QrContentType {
    return this.config.contentType;
  }

  setContentType(type: any) {
    this.qrService.setContentType(type as QrContentType);
    this.generateQrCode();
  }

  onDataInput($event: any) {
    this.rawValue = $event.detail?.value ?? '';
    this.qrService.setData(this.rawValue);
    this.generateQrCode();
  }

  /** Placeholder text that adapts to the selected segment. */
  get placeholder(): string {
    switch (this.config.contentType) {
      case 'url':
        return 'Enter website URL (e.g. example.com)';
      case 'email':
        return 'Enter email address';
      case 'mobile':
        return 'Enter mobile number (e.g. +1 234 567 890)';
      case 'whatsapp':
        return 'Number | Message (e.g. +1 234 567 890 | Hi there)';
      default:
        return 'Enter text to generate QR code';
    }
  }

  get formattedPreview(): string {
    return this.qrService.formatValue(this.rawValue);
  }

  // ---------------- Options / Accordion ----------------

  toggleSection(section: { open: boolean }) {
    section.open = !section.open;
  }

  isSectionOpen(id: string): boolean {
    return this.optionSections.find((s) => s.id === id)?.open ?? false;
  }

  // ---------------- QR generation ----------------

  generateQrCode() {
    if (this.canvas?.nativeElement) {
      this.canvas.nativeElement.innerHTML = '';
    }
    this.qrCode = this.qrService.createQrCode();
    if (this.canvas?.nativeElement) {
      this.qrCode.append(this.canvas.nativeElement);
    }
  }

  updateQrCode() {
    if (this.qrCode) {
      this.qrCode.update(this.qrService.buildOptions());
    } else {
      this.generateQrCode();
    }
  }

  onColorChange($event: any, prop: string) {
    this.updateOption(prop, $event.target?.value);
    this.updateQrCode();
  }

  onSelectChange($event: any, prop: string) {
    this.updateOption(prop, $event.detail?.value);
    this.updateQrCode();
  }

  updateStyle(option: 'dotsType' | 'cornersSquareType', value: string): void {
    this.updateOption(option, value);
    this.updateQrCode();
  }

  selectFormat(format: string): void {
    if (format === 'svg' || format === 'png' || format === 'jpeg' || format === 'webp') {
      this.downloadFormat = format;
      this.qrService.updateOption('extension', format);
    }
  }

  onRangeChange($event: any, prop: string) {
    this.updateOption(prop, Number($event.detail?.value));
    this.updateQrCode();
  }

  onToggleChange($event: any, prop: string) {
    this.updateOption(prop, $event.detail?.checked);
    this.updateQrCode();
  }

  onImageUrlInput($event: any) {
    this.updateOption('imageUrl', $event.detail?.value ?? '');
    this.updateQrCode();
  }

  onFileNameInput($event: any) {
    this.updateOption('fileName', $event.detail?.value?.trim() || 'qr-code');
  }

  resetToDefaults() {
    this.qrService.resetToDefaults();
    this.config = this.qrService.config;
    this.rawValue = this.config.data;
    this.generateQrCode();
  }
  setDownloadModalOpen(isOpen: boolean) {
    this.isDownloadSheetOpen = isOpen;
    if (isOpen) this.exportMessage = '';
  }

  selectExportAction(action: 'share' | 'open' | 'gallery' | 'app'): void {
    this.exportAction = action;
  }

  async runExportAction(): Promise<void> {
    switch (this.exportAction) {
      case 'open':
        await this.open();
        break;
      case 'gallery':
        this.exportMessage = 'Gallery saving needs a native gallery plugin and permission setup. It is not enabled yet.';
        break;
      case 'app':
        await this.saveInApp();
        break;
      default:
        await this.download();
    }
  }

  private updateOption(option: string, value: unknown): void {
    this.qrService.updateOption(option as keyof typeof this.config, value as never);
  }

  // ---------------- Download / Open ----------------

  async isBrowser(): Promise<boolean> {
    const info = await Device.getInfo();
    return info.platform === 'web';
  }

  private get mimeMap(): Record<string, string> {
    return {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
  }

  private async writeToCache(fileName: string, ext: string): Promise<string> {
    const blob: Blob = await this.qrCode.getRawData(ext);
    const base64 = await this.blobToBase64(blob);
    const base64Data = base64.includes('base64,')
      ? base64.split('base64,')[1]
      : base64;
    const savedFile = await Filesystem.writeFile({
      path: `${fileName}.${ext}`,
      data: base64Data,
      directory: Directory.Cache,
      recursive: true,
    });
    return savedFile.uri;
  }

  async download() {
    const fileName = this.config.fileName || 'qr-code';
    const ext = this.downloadFormat;
    this.qrService.updateOption('extension', ext);

    if (await this.isBrowser()) {
      this.qrCode?.download({ name: fileName, extension: ext });
      return;
    }

    try {
      const uri = await this.writeToCache(fileName, ext);
      await Share.share({
        title: fileName,
        text: `QR Code: ${this.formattedPreview}`,
        url: uri,
        dialogTitle: 'Save or Share QR Code',
      });
      this.isDownloadSheetOpen = false;
    } catch (error: any) {
      console.error('Download failed:', error);
      this.qrCode?.download({ name: fileName, extension: ext });
    }
  }

  async open() {
    const fileName = this.config.fileName || 'qr-code';
    const ext = this.downloadFormat;
    this.qrService.updateOption('extension', ext);

    if (await this.isBrowser()) {
      this.qrCode?.download({ name: fileName, extension: ext });
      return;
    }

    try {
      const uri = await this.writeToCache(fileName, ext);
      const fileOpenerOptions: FileOpenerOptions = {
        filePath: uri,
        contentType: this.mimeMap[ext] || 'image/png',
        openWithDefault: true,
      };
      await FileOpener.open(fileOpenerOptions);
      this.isDownloadSheetOpen = false;
    } catch (error: any) {
      console.error('Open failed:', error);
      alert('Failed to open the file. Please check if the file type is supported on your device.');
      this.qrCode?.download({ name: fileName, extension: ext });
    }
  }

  async saveInApp(): Promise<void> {
    const fileName = this.config.fileName || 'qr-code';
    const ext = this.downloadFormat;
    const blob: Blob = await this.qrCode.getRawData(ext);
    const base64 = await this.blobToBase64(blob);
    const base64Data = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
    await this.qrStorage.saveToApp(fileName, ext, base64Data);
    this.exportMessage = 'Saved to your app library.';
    this.isDownloadSheetOpen = false;
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
