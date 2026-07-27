import { Component, ElementRef, ViewChild, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import QRCodeStyling from "qr-code-styling";
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface QrConfig {
  data: string;
  width: number;
  height: number;
  margin: number;
  shape: 'square' | 'circle';
  // QR options
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  // Dots options
  dotsColor: string;
  dotsType: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
  dotsGradientType: 'none' | 'linear' | 'radial';
  dotsGradientColor1: string;
  dotsGradientColor2: string;
  dotsGradientRotation: number;
  // Background options
  bgColor: string;
  bgGradientType: 'none' | 'linear' | 'radial';
  bgGradientColor1: string;
  bgGradientColor2: string;
  bgGradientRotation: number;
  bgRound: number;
  // Corner squares
  cornersSquareColor: string;
  cornersSquareType: 'dot' | 'square' | 'extra-rounded' | 'rounded' | 'dots' | 'classy' | 'classy-rounded';
  cornersSquareGradientType: 'none' | 'linear' | 'radial';
  cornersSquareGradientColor1: string;
  cornersSquareGradientColor2: string;
  cornersSquareGradientRotation: number;
  // Corner dots
  cornersDotColor: string;
  cornersDotType: 'dot' | 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
  cornersDotGradientType: 'none' | 'linear' | 'radial';
  cornersDotGradientColor1: string;
  cornersDotGradientColor2: string;
  cornersDotGradientRotation: number;
  // Image options
  imageUrl: string;
  imageSize: number;
  imageMargin: number;
  imageHideDots: boolean;
  // Download
  extension: 'svg' | 'png' | 'jpeg' | 'webp';
  fileName: string;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLDivElement>;

  qrCode: any = null;
  panelOpen = false;
  activeSection: string = 'data';

  config: QrConfig = {
    data: 'https://github.com',
    width: 300,
    height: 300,
    margin: 10,
    shape: 'square',
    errorCorrectionLevel: 'Q',
    dotsColor: '#BD022D',
    dotsType: 'rounded',
    dotsGradientType: 'none',
    dotsGradientColor1: '#8688B2',
    dotsGradientColor2: '#77779C',
    dotsGradientRotation: 0,
    bgColor: '#e9ebee',
    bgGradientType: 'none',
    bgGradientColor1: '#ededff',
    bgGradientColor2: '#e6e7ff',
    bgGradientRotation: 0,
    bgRound: 0,
    cornersSquareColor: '#BD022D',
    cornersSquareType: 'extra-rounded',
    cornersSquareGradientType: 'none',
    cornersSquareGradientColor1: '#25456e',
    cornersSquareGradientColor2: '#4267b2',
    cornersSquareGradientRotation: 180,
    cornersDotColor: '#BD022D',
    cornersDotType: 'dot',
    cornersDotGradientType: 'none',
    cornersDotGradientColor1: '#00266e',
    cornersDotGradientColor2: '#4060b3',
    cornersDotGradientRotation: 180,
    imageUrl: '',
    imageSize: 0.4,
    imageMargin: 20,
    imageHideDots: true,
    extension: 'png',
    fileName: 'my-qr-code',
  };

  dotTypes = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
  cornerSquareTypes = ['dot', 'square', 'extra-rounded', 'rounded', 'dots', 'classy', 'classy-rounded'];
  cornerDotTypes = ['dot', 'square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
  errorLevels = ['L', 'M', 'Q', 'H'];
  extensions = ['svg', 'png', 'jpeg', 'webp'];
  shapes = ['square', 'circle'];

  constructor(
    private ngzone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ionViewWillEnter() {
    this.generateQRCode();
  }

  togglePanel() {
    this.panelOpen = !this.panelOpen;
  }

  setActiveSection(section: string) {
    this.activeSection = section;
  }

  buildOptions(): any {
    const opts: any = {
      width: this.config.width,
      height: this.config.height,
      data: this.config.data,
      margin: this.config.margin,
      shape: this.config.shape,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: this.config.errorCorrectionLevel,
      },
      dotsOptions: {
        color: this.config.dotsColor,
        type: this.config.dotsType,
      },
      backgroundOptions: {
        color: this.config.bgColor,
        round: this.config.bgRound,
      },
      cornersSquareOptions: {
        color: this.config.cornersSquareColor,
        type: this.config.cornersSquareType,
      },
      cornersDotOptions: {
        color: this.config.cornersDotColor,
        type: this.config.cornersDotType,
      },
      imageOptions: {
        hideBackgroundDots: this.config.imageHideDots,
        imageSize: this.config.imageSize,
        margin: this.config.imageMargin,
        crossOrigin: 'anonymous',
      },
    };

    // Add gradients
    if (this.config.dotsGradientType !== 'none') {
      opts.dotsOptions.gradient = {
        type: this.config.dotsGradientType,
        rotation: this.config.dotsGradientRotation,
        colorStops: [
          { offset: 0, color: this.config.dotsGradientColor1 },
          { offset: 1, color: this.config.dotsGradientColor2 },
        ],
      };
    }
    if (this.config.bgGradientType !== 'none') {
      opts.backgroundOptions.gradient = {
        type: this.config.bgGradientType,
        rotation: this.config.bgGradientRotation,
        colorStops: [
          { offset: 0, color: this.config.bgGradientColor1 },
          { offset: 1, color: this.config.bgGradientColor2 },
        ],
      };
    }
    if (this.config.cornersSquareGradientType !== 'none') {
      opts.cornersSquareOptions.gradient = {
        type: this.config.cornersSquareGradientType,
        rotation: this.config.cornersSquareGradientRotation,
        colorStops: [
          { offset: 0, color: this.config.cornersSquareGradientColor1 },
          { offset: 1, color: this.config.cornersSquareGradientColor2 },
        ],
      };
    }
    if (this.config.cornersDotGradientType !== 'none') {
      opts.cornersDotOptions.gradient = {
        type: this.config.cornersDotGradientType,
        rotation: this.config.cornersDotGradientRotation,
        colorStops: [
          { offset: 0, color: this.config.cornersDotGradientColor1 },
          { offset: 1, color: this.config.cornersDotGradientColor2 },
        ],
      };
    }

    // Add image if URL provided
    if (this.config.imageUrl && this.config.imageUrl.trim()) {
      opts.image = this.config.imageUrl.trim();
    }

    return opts;
  }

  generateQRCode() {
    // Clear previous
    if (this.canvas?.nativeElement) {
      this.canvas.nativeElement.innerHTML = '';
    }
    this.qrCode = new QRCodeStyling(this.buildOptions());
    if (this.canvas?.nativeElement) {
      this.qrCode.append(this.canvas.nativeElement);
    }
  }

  updateQRCode() {
    if (this.qrCode) {
      this.ngzone.run(() => {
        this.qrCode.update(this.buildOptions());
      });
    } else {
      this.generateQRCode();
    }
  }

  onDataInput(event: any) {
    this.config.data = event.detail?.value || '';
    this.updateQRCode();
  }

  onImageUrlInput(event: any) {
    this.config.imageUrl = event.detail?.value || '';
    this.updateQRCode();
  }

  onRangeChange(event: any, prop: keyof QrConfig) {
    (this.config as any)[prop] = parseFloat(event.target.value);
    this.updateQRCode();
  }

  onColorChange(event: any, prop: keyof QrConfig) {
    (this.config as any)[prop] = event.target.value;
    this.updateQRCode();
  }

  onSelectChange(event: any, prop: keyof QrConfig) {
    (this.config as any)[prop] = event.target.value;
    this.updateQRCode();
  }

  onGradientTypeChange(event: any, target: 'dots' | 'bg' | 'cornersSquare' | 'cornersDot') {
    const val = event.target.value;
    switch (target) {
      case 'dots': this.config.dotsGradientType = val; break;
      case 'bg': this.config.bgGradientType = val; break;
      case 'cornersSquare': this.config.cornersSquareGradientType = val; break;
      case 'cornersDot': this.config.cornersDotGradientType = val; break;
    }
    this.updateQRCode();
  }

  async download() {
    const fileName = this.config.fileName || 'qr-code';
    const ext = this.config.extension;

    if (isPlatformBrowser(this.platformId)) {
      // Browser: use native download
      this.qrCode?.download({
        name: fileName,
        extension: ext,
      });
    } else {
      // Mobile (Capacitor native): use Filesystem + Share
      try {
        // Get raw data as base64 blob
        const blob: Blob = await this.qrCode.getRawData(ext);

        // Convert blob to base64
        const base64 = await this.blobToBase64(blob);

        // Determine MIME type
        const mimeMap: Record<string, string> = {
          png: 'image/png',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
          svg: 'image/svg+xml',
        };
        const mimeType = mimeMap[ext] || 'image/png';

        // Strip data-URL prefix if present
        const base64Data = base64.includes('base64,')
          ? base64.split('base64,')[1]
          : base64;

        const savedFile = await Filesystem.writeFile({
          path: `${fileName}.${ext}`,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        // Share/save the file using Share plugin
        await Share.share({
          title: fileName,
          text: `QR Code: ${this.config.data}`,
          url: savedFile.uri,
          dialogTitle: 'Save or Share QR Code',
        });
      } catch (error: any) {
        console.error('Download failed:', error);
        // Fallback: try browser download
        try {
          this.qrCode?.download({
            name: fileName,
            extension: ext,
          });
        } catch (fallbackError) {
          console.error('Fallback download also failed:', fallbackError);
        }
      }
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  resetToDefaults() {
    this.config = {
      data: 'https://github.com',
      width: 300,
      height: 300,
      margin: 10,
      shape: 'square',
      errorCorrectionLevel: 'Q',
      dotsColor: '#BD022D',
      dotsType: 'rounded',
      dotsGradientType: 'none',
      dotsGradientColor1: '#8688B2',
      dotsGradientColor2: '#77779C',
      dotsGradientRotation: 0,
      bgColor: '#e9ebee',
      bgGradientType: 'none',
      bgGradientColor1: '#ededff',
      bgGradientColor2: '#e6e7ff',
      bgGradientRotation: 0,
      bgRound: 0,
      cornersSquareColor: '#BD022D',
      cornersSquareType: 'extra-rounded',
      cornersSquareGradientType: 'none',
      cornersSquareGradientColor1: '#25456e',
      cornersSquareGradientColor2: '#4267b2',
      cornersSquareGradientRotation: 180,
      cornersDotColor: '#BD022D',
      cornersDotType: 'dot',
      cornersDotGradientType: 'none',
      cornersDotGradientColor1: '#00266e',
      cornersDotGradientColor2: '#4060b3',
      cornersDotGradientRotation: 180,
      imageUrl: '',
      imageSize: 0.4,
      imageMargin: 20,
      imageHideDots: true,
      extension: 'png',
      fileName: 'my-qr-code',
    };
    this.generateQRCode();
  }
}
