import { Injectable } from '@angular/core';
import QRCodeStyling from 'qr-code-styling';

/**
 * Supported QR content types shown in the segment control.
 * Each type knows how to format its raw value into a scannable QR payload.
 */
export type QrContentType = 'text' | 'url' | 'email' | 'mobile' | 'whatsapp';

/**
 * The full set of configurable options for the QR code.
 * Mirrors the qr-code-styling Options API plus a few UI helpers.
 */
export interface QrConfig {
  // Content
  contentType: QrContentType;
  data: string;

  // Size / shape
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
  dotsRoundSize: boolean;

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

  // Image / Logo
  imageUrl: string;
  imageSize: number;
  imageMargin: number;
  imageHideDots: boolean;

  // Download
  extension: 'svg' | 'png' | 'jpeg' | 'webp';
  fileName: string;
}

/** Default, sensible starting configuration. */
export const DEFAULT_CONFIG: QrConfig = {
  contentType: 'text',
  data: 'Hello World!',
  width: 300,
  height: 300,
  margin: 10,
  shape: 'square',
  errorCorrectionLevel: 'Q',
  dotsColor: '#000000',
  dotsType: 'rounded',
  dotsGradientType: 'none',
  dotsGradientColor1: '#8688B2',
  dotsGradientColor2: '#77779C',
  dotsGradientRotation: 0,
  dotsRoundSize: false,
  bgColor: '#ffffff',
  bgGradientType: 'none',
  bgGradientColor1: '#ededff',
  bgGradientColor2: '#e6e7ff',
  bgGradientRotation: 0,
  bgRound: 0,
  cornersSquareColor: '#000000',
  cornersSquareType: 'extra-rounded',
  cornersSquareGradientType: 'none',
  cornersSquareGradientColor1: '#25456e',
  cornersSquareGradientColor2: '#4267b2',
  cornersSquareGradientRotation: 180,
  cornersDotColor: '#000000',
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
  fileName: 'qr-code',
};

/**
 * Lists of options exposed to the UI. Kept in one place so the templates
 * stay clean and the supported values are discoverable.
 */
export const SUPPORTED_OPTIONS = {
  contentTypes: [
    { id: 'text' as QrContentType, label: 'Text', icon: 'text-outline' },
    { id: 'url' as QrContentType, label: 'URL', icon: 'link-outline' },
    { id: 'email' as QrContentType, label: 'Email', icon: 'mail-outline' },
    { id: 'mobile' as QrContentType, label: 'Mobile', icon: 'call-outline' },
    { id: 'whatsapp' as QrContentType, label: 'WhatsApp', icon: 'logo-whatsapp' },
  ],
  dotTypes: ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'],
  cornerSquareTypes: ['dot', 'square', 'extra-rounded', 'rounded', 'dots', 'classy', 'classy-rounded'],
  cornerDotTypes: ['dot', 'square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'],
  shapes: ['square', 'circle'],
  errorLevels: ['L', 'M', 'Q', 'H'],
  gradientTypes: ['none', 'linear', 'radial'],
  extensions: ['svg', 'png', 'jpeg', 'webp'],
  dotStyles: [
    { value: 'square', label: 'Square', image: 'assets/qr/square-qr.png' },
    { value: 'rounded', label: 'Rounded', image: 'assets/qr/rounded-qr.png' },
    { value: 'dots', label: 'Dots', image: 'assets/qr/dots-qr.png' },
    { value: 'classy', label: 'Classy', image: 'assets/qr/classy-qr.png' },
    { value: 'classy-rounded', label: 'Classy rounded', image: 'assets/qr/classy-rounded-qr.png' },
    { value: 'extra-rounded', label: 'Extra rounded', image: 'assets/qr/extra-rounded-qr.png' },
  ],
  cornerStyles: [
    { value: 'square', label: 'Square' },
    { value: 'dot', label: 'Dot' },
    { value: 'extra-rounded', label: 'Extra rounded' },
    { value: 'rounded', label: 'Rounded' },
  ],
};

@Injectable({ providedIn: 'root' })
export class QrService {
  config: QrConfig = { ...DEFAULT_CONFIG };

  setContentType(contentType: QrContentType): void {
    this.config.contentType = contentType;
  }

  setData(data: string): void {
    this.config.data = data;
  }

  updateOption<K extends keyof QrConfig>(option: K, value: QrConfig[K]): void {
    this.config[option] = value;
  }

  /**
   * Formats the raw user value for the currently selected content type so
   * the scanned result opens the right app / action on a phone.
   * Examples: url -> https://..., email -> mailto:..., mobile -> tel:...,
   * whatsapp -> https://wa.me/<number>?text=...
   */
  formatValue(rawValue: string): string {
    const value = (rawValue || '').trim();
    switch (this.config.contentType) {
      case 'url': {
        if (!value) return '';
        // Prepend https:// if no scheme is present
        return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value) ? value : `https://${value}`;
      }
      case 'email': {
        return value ? `mailto:${value}` : '';
      }
      case 'mobile': {
        // Normalize: strip spaces, dashes, parentheses and leading +
        const digits = value.replace(/[\s\-()]/g, '').replace(/^\+/, '');
        return digits ? `tel:${digits}` : '';
      }
      case 'whatsapp': {
        // WhatsApp deep link: https://wa.me/<number>?text=<message>
        const [number, ...rest] = value.split('|');
        const cleanNumber = (number || '').replace(/[\s\-()]/g, '').replace(/^\+/, '');
        if (!cleanNumber) return '';
        const message = rest.join('|').trim();
        let link = `https://wa.me/${cleanNumber}`;
        if (message) {
          link += `?text=${encodeURIComponent(message)}`;
        }
        return link;
      }
      case 'text':
      default:
        return value;
    }
  }

  /**
   * Builds the full options object consumed by QRCodeStyling.
   */
  buildOptions(): any {
    const c = this.config;
    const opts: any = {
      width: c.width,
      height: c.height,
      data: this.formatValue(c.data),
      margin: c.margin,
      shape: c.shape,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: c.errorCorrectionLevel,
      },
      dotsOptions: {
        color: c.dotsColor,
        type: c.dotsType,
        roundSize: c.dotsRoundSize,
      },
      backgroundOptions: {
        color: c.bgColor,
        round: c.bgRound,
      },
      cornersSquareOptions: {
        color: c.cornersSquareColor,
        type: c.cornersSquareType,
      },
      cornersDotOptions: {
        color: c.cornersDotColor,
        type: c.cornersDotType,
      },
      imageOptions: {
        hideBackgroundDots: c.imageHideDots,
        imageSize: c.imageSize,
        margin: c.imageMargin,
        crossOrigin: 'anonymous',
      },
    };

    // Gradients
    if (c.dotsGradientType !== 'none') {
      opts.dotsOptions.gradient = {
        type: c.dotsGradientType,
        rotation: c.dotsGradientRotation,
        colorStops: [
          { offset: 0, color: c.dotsGradientColor1 },
          { offset: 1, color: c.dotsGradientColor2 },
        ],
      };
    }
    if (c.bgGradientType !== 'none') {
      opts.backgroundOptions.gradient = {
        type: c.bgGradientType,
        rotation: c.bgGradientRotation,
        colorStops: [
          { offset: 0, color: c.bgGradientColor1 },
          { offset: 1, color: c.bgGradientColor2 },
        ],
      };
    }
    if (c.cornersSquareGradientType !== 'none') {
      opts.cornersSquareOptions.gradient = {
        type: c.cornersSquareGradientType,
        rotation: c.cornersSquareGradientRotation,
        colorStops: [
          { offset: 0, color: c.cornersSquareGradientColor1 },
          { offset: 1, color: c.cornersSquareGradientColor2 },
        ],
      };
    }
    if (c.cornersDotGradientType !== 'none') {
      opts.cornersDotOptions.gradient = {
        type: c.cornersDotGradientType,
        rotation: c.cornersDotGradientRotation,
        colorStops: [
          { offset: 0, color: c.cornersDotGradientColor1 },
          { offset: 1, color: c.cornersDotGradientColor2 },
        ],
      };
    }

    // Image / Logo
    if (c.imageUrl && c.imageUrl.trim()) {
      opts.image = c.imageUrl.trim();
    }

    return opts;
  }

  /**
   * Creates a fresh QRCodeStyling instance from the current config.
   */
  createQrCode(): any {
    return new QRCodeStyling(this.buildOptions());
  }

  /**
   * Resets every option back to the defaults.
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
  }
}
