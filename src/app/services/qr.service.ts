import { Injectable } from '@angular/core';
import QRCodeStyling from 'qr-code-styling';

/**
 * Supported QR content types shown in the segment control.
 * Each type knows how to format its raw value into a scannable QR payload.
 */
export type QrContentType = 'text' | 'url' | 'email' | 'mobile' | 'sms' | 'whatsapp' | 'wifi' | 'vcard' | 'location' | 'event';

/** One input of a structured (multi-field) content type. */
export interface QrField {
  key: string;
  label: string;
  placeholder?: string;
  inputType?: 'text' | 'email' | 'tel' | 'url' | 'password' | 'number' | 'datetime-local' | 'textarea' | 'select' | 'toggle';
  options?: { value: string; label: string }[];
}

/**
 * The full set of configurable options for the QR code.
 * Mirrors the qr-code-styling Options API plus a few UI helpers.
 */
export interface QrConfig {
  // Content
  contentType: QrContentType;
  data: string;
  /** Values of the structured form for email, sms, wifi, vcard and location. */
  fields: Record<string, string>;

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
  fields: {},
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
    { id: 'mobile' as QrContentType, label: 'Phone', icon: 'call-outline' },
    { id: 'sms' as QrContentType, label: 'SMS', icon: 'chatbubble-outline' },
    { id: 'whatsapp' as QrContentType, label: 'WhatsApp', icon: 'logo-whatsapp' },
    { id: 'wifi' as QrContentType, label: 'Wi-Fi', icon: 'wifi-outline' },
    { id: 'vcard' as QrContentType, label: 'Contact', icon: 'person-circle-outline' },
    { id: 'location' as QrContentType, label: 'Location', icon: 'location-outline' },
    { id: 'event' as QrContentType, label: 'Event', icon: 'calendar-outline' },
  ],
  /** Form layouts of the structured content types. */
  forms: {
    email: [
      { key: 'to', label: 'To', placeholder: 'name@example.com', inputType: 'email' },
      { key: 'subject', label: 'Subject', placeholder: 'Subject' },
      { key: 'body', label: 'Message', placeholder: 'Message', inputType: 'textarea' },
    ],
    sms: [
      { key: 'number', label: 'Phone number', placeholder: '+1 234 567 890', inputType: 'tel' },
      { key: 'message', label: 'Message', placeholder: 'Message', inputType: 'textarea' },
    ],
    wifi: [
      { key: 'ssid', label: 'Network name (SSID)', placeholder: 'My Wi-Fi' },
      { key: 'password', label: 'Password', placeholder: 'Password', inputType: 'password' },
      {
        key: 'security', label: 'Security', inputType: 'select',
        options: [{ value: 'WPA', label: 'WPA / WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'None' }],
      },
      { key: 'hidden', label: 'Hidden network', inputType: 'toggle' },
    ],
    vcard: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe' },
      { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890', inputType: 'tel' },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', inputType: 'email' },
      { key: 'company', label: 'Company', placeholder: 'Company' },
      { key: 'website', label: 'Website', placeholder: 'example.com', inputType: 'url' },
      { key: 'address', label: 'Address', placeholder: 'Street, City, Country' },
    ],
    event: [
      { key: 'title', label: 'Title', placeholder: 'Team meeting' },
      { key: 'start', label: 'Starts', inputType: 'datetime-local' },
      { key: 'end', label: 'Ends', inputType: 'datetime-local' },
      { key: 'place', label: 'Place', placeholder: 'Office, Riyadh' },
      { key: 'details', label: 'Notes', placeholder: 'Details', inputType: 'textarea' },
    ],
    location: [
      { key: 'lat', label: 'Latitude', placeholder: '24.7136', inputType: 'number' },
      { key: 'lng', label: 'Longitude', placeholder: '46.6753', inputType: 'number' },
    ],
  } as Partial<Record<QrContentType, QrField[]>>,
  presets: [
    { id: 'classic', label: 'Classic', color: '#000000', patch: { dotsColor: '#000000', dotsType: 'square', dotsGradientType: 'none', bgColor: '#ffffff', bgGradientType: 'none', cornersSquareColor: '#000000', cornersSquareType: 'square', cornersSquareGradientType: 'none', cornersDotColor: '#000000', cornersDotType: 'square', cornersDotGradientType: 'none' } },
    { id: 'ocean', label: 'Ocean', color: '#147d72', patch: { dotsColor: '#147d72', dotsType: 'rounded', dotsGradientType: 'linear', dotsGradientColor1: '#0163aa', dotsGradientColor2: '#147d72', dotsGradientRotation: 45, bgColor: '#ffffff', bgGradientType: 'none', cornersSquareColor: '#0163aa', cornersSquareType: 'extra-rounded', cornersSquareGradientType: 'none', cornersDotColor: '#147d72', cornersDotType: 'dot', cornersDotGradientType: 'none' } },
    { id: 'sunset', label: 'Sunset', color: '#e9785c', patch: { dotsColor: '#e9785c', dotsType: 'dots', dotsGradientType: 'linear', dotsGradientColor1: '#e9785c', dotsGradientColor2: '#b5179e', dotsGradientRotation: 90, bgColor: '#fff7f3', bgGradientType: 'none', cornersSquareColor: '#b5179e', cornersSquareType: 'extra-rounded', cornersSquareGradientType: 'none', cornersDotColor: '#e9785c', cornersDotType: 'dot', cornersDotGradientType: 'none' } },
    { id: 'neon', label: 'Neon', color: '#39ff88', patch: { dotsColor: '#39ff88', dotsType: 'classy-rounded', dotsGradientType: 'none', bgColor: '#101820', bgGradientType: 'none', cornersSquareColor: '#00e5ff', cornersSquareType: 'extra-rounded', cornersSquareGradientType: 'none', cornersDotColor: '#00e5ff', cornersDotType: 'dot', cornersDotGradientType: 'none' } },
    { id: 'minimal', label: 'Minimal', color: '#17252b', patch: { dotsColor: '#17252b', dotsType: 'dots', dotsGradientType: 'none', bgColor: '#fbfcf8', bgGradientType: 'none', cornersSquareColor: '#17252b', cornersSquareType: 'dot', cornersSquareGradientType: 'none', cornersDotColor: '#17252b', cornersDotType: 'dot', cornersDotGradientType: 'none' } },
  ] as { id: string; label: string; color: string; patch: Partial<QrConfig> }[],
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
  config: QrConfig = { ...DEFAULT_CONFIG, fields: {} };

  setContentType(contentType: QrContentType): void {
    this.config.contentType = contentType;
  }

  /** Replaces the working config (used to re-edit a saved code). */
  loadConfig(config: QrConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config, fields: { ...(config.fields || {}) } };
  }

  /** True for content types that are filled through a multi-field form. */
  isFormType(type: QrContentType = this.config.contentType): boolean {
    return !!SUPPORTED_OPTIONS.forms[type];
  }

  setField(key: string, value: string): void {
    this.config.fields = { ...this.config.fields, [key]: value };
  }

  /** Builds the scannable payload of a structured content type from its fields. */
  buildPayload(type: QrContentType = this.config.contentType): string {
    const f = this.config.fields;
    const v = (key: string) => (f[key] || '').trim();
    const esc = (value: string) => value.replace(/([\\;,:"])/g, '\\$1');
    switch (type) {
      case 'email': {
        if (!v('to')) return '';
        const params = [v('subject') && `subject=${encodeURIComponent(v('subject'))}`, v('body') && `body=${encodeURIComponent(v('body'))}`].filter(Boolean);
        return `mailto:${v('to')}${params.length ? '?' + params.join('&') : ''}`;
      }
      case 'sms': {
        const number = v('number').replace(/[\s\-()]/g, '');
        return number ? `SMSTO:${number}:${v('message')}` : '';
      }
      case 'wifi': {
        if (!v('ssid')) return '';
        const security = v('security') || 'WPA';
        const password = security === 'nopass' ? '' : `P:${esc(v('password'))};`;
        return `WIFI:T:${security};S:${esc(v('ssid'))};${password}${f['hidden'] === 'true' ? 'H:true;' : ''};`;
      }
      case 'vcard': {
        if (!v('name')) return '';
        const site = v('website');
        const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${v('name')}`, `N:;${v('name')};;;`];
        if (v('phone')) lines.push(`TEL:${v('phone')}`);
        if (v('email')) lines.push(`EMAIL:${v('email')}`);
        if (v('company')) lines.push(`ORG:${v('company')}`);
        if (site) lines.push(`URL:${/^[a-z]+:\/\//i.test(site) ? site : 'https://' + site}`);
        if (v('address')) lines.push(`ADR:;;${v('address')};;;;`);
        lines.push('END:VCARD');
        return lines.join('\n');
      }
      case 'location':
        return v('lat') && v('lng') ? `geo:${v('lat')},${v('lng')}` : '';
      case 'event': {
        if (!v('title') || !v('start')) return '';
        const stamp = (value: string) => value.replace(/[-:]/g, '').padEnd(15, '0').slice(0, 15);
        const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `SUMMARY:${v('title')}`, `DTSTART:${stamp(v('start'))}`, `DTEND:${stamp(v('end') || v('start'))}`];
        if (v('place')) lines.push(`LOCATION:${v('place')}`);
        if (v('details')) lines.push(`DESCRIPTION:${v('details').replace(/\n/g, '\\n')}`);
        lines.push('END:VEVENT', 'END:VCALENDAR');
        return lines.join('\n');
      }
      default:
        return '';
    }
  }

  /** Human-readable hints that help the user keep the code scannable. */
  getWarnings(): string[] {
    const c = this.config;
    const warnings: string[] = [];
    if (c.bgGradientType === 'none' && c.dotsGradientType === 'none') {
      if (this.contrastRatio(c.dotsColor, c.bgColor) < 3) {
        warnings.push('Low contrast between the dots and the background. The code may be hard to scan.');
      } else if (this.luminance(c.dotsColor) > this.luminance(c.bgColor)) {
        warnings.push('Light dots on a dark background are not read by every scanner.');
      }
    }
    if (c.imageUrl.trim() && (c.errorCorrectionLevel === 'L' || c.errorCorrectionLevel === 'M')) {
      warnings.push('A logo hides part of the code. Use error correction Q or H for a reliable scan.');
    }
    return warnings;
  }

  private luminance(hex: string): number {
    const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return 1;
    const [r, g, b] = [0, 2, 4].map((i) => {
      const channel = parseInt(m[1].slice(i, i + 2), 16) / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private contrastRatio(a: string, b: string): number {
    const [hi, lo] = [this.luminance(a), this.luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
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
      case 'email':
      case 'sms':
      case 'wifi':
      case 'vcard':
      case 'location':
      case 'event':
        return this.buildPayload();
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
    this.config = { ...DEFAULT_CONFIG, fields: {} };
  }
}
