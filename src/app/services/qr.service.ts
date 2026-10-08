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

/** One color of a gradient. `offset` runs from 0 (start) to 1 (end). */
export interface GradientStop {
  offset: number;
  color: string;
}

/** A solid color ('none') or a linear / radial gradient with any number of color stops. */
export interface GradientConfig {
  type: 'none' | 'linear' | 'radial';
  /** Direction of a linear gradient in degrees, clockwise, 0 = left to right. */
  rotation: number;
  stops: GradientStop[];
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
  dotsGradient: GradientConfig;
  dotsRoundSize: boolean;

  // Background options
  bgColor: string;
  bgGradient: GradientConfig;
  bgRound: number;

  // Corner squares
  cornersSquareColor: string;
  cornersSquareType: 'dot' | 'square' | 'extra-rounded' | 'rounded' | 'dots' | 'classy' | 'classy-rounded';
  cornersSquareGradient: GradientConfig;

  // Corner dots
  cornersDotColor: string;
  cornersDotType: 'dot' | 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
  cornersDotGradient: GradientConfig;

  // Image / Logo
  imageUrl: string;
  imageSize: number;
  imageMargin: number;
  imageHideDots: boolean;

  // Download
  extension: 'svg' | 'png' | 'jpeg' | 'webp';
  fileName: string;
}

/** CSS for previewing a color or gradient (the same direction rules as the QR code). */
export function gradientCss(solid: string, g: GradientConfig): string {
  if (g.type === 'none') return solid;
  const list = [...g.stops].sort((x, y) => x.offset - y.offset).map((stop) => `${stop.color} ${Math.round(stop.offset * 100)}%`).join(', ');
  // The library draws rotation 0 from left to right; CSS angle 90deg is the same direction.
  return g.type === 'linear' ? `linear-gradient(${90 + g.rotation}deg, ${list})` : `radial-gradient(circle, ${list})`;
}

/** Two-stop gradient used for the defaults and the "solid" state (the stops are kept for later). */
const stops = (from: string, to: string, type: GradientConfig['type'] = 'none', rotation = 0): GradientConfig => ({
  type,
  rotation,
  stops: [{ offset: 0, color: from }, { offset: 1, color: to }],
});

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
  dotsGradient: stops('#0b6b60', '#1fb39e'),
  dotsRoundSize: false,
  bgColor: '#ffffff',
  bgGradient: stops('#ffffff', '#e6f4f1'),
  bgRound: 0,
  cornersSquareColor: '#000000',
  cornersSquareType: 'extra-rounded',
  cornersSquareGradient: stops('#0b6b60', '#1fb39e'),
  cornersDotColor: '#000000',
  cornersDotType: 'dot',
  cornersDotGradient: stops('#0b6b60', '#1fb39e'),
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
    { id: 'classic', label: 'Classic', color: '#000000', patch: { dotsColor: '#000000', dotsType: 'square', dotsGradient: stops('#000000', '#444444'), bgColor: '#ffffff', bgGradient: stops('#ffffff', '#eeeeee'), cornersSquareColor: '#000000', cornersSquareType: 'square', cornersSquareGradient: stops('#000000', '#444444'), cornersDotColor: '#000000', cornersDotType: 'square', cornersDotGradient: stops('#000000', '#444444') } },
    { id: 'ocean', label: 'Ocean', color: '#147d72', patch: { dotsColor: '#147d72', dotsType: 'rounded', dotsGradient: stops('#0163aa', '#147d72', 'linear', 45), bgColor: '#ffffff', bgGradient: stops('#ffffff', '#e6f4f1'), cornersSquareColor: '#0163aa', cornersSquareType: 'extra-rounded', cornersSquareGradient: stops('#0163aa', '#147d72'), cornersDotColor: '#147d72', cornersDotType: 'dot', cornersDotGradient: stops('#0163aa', '#147d72') } },
    { id: 'sunset', label: 'Sunset', color: '#e9785c', patch: { dotsColor: '#e9785c', dotsType: 'dots', dotsGradient: stops('#e9785c', '#b5179e', 'linear', 90), bgColor: '#fff7f3', bgGradient: stops('#fff7f3', '#ffe3d6'), cornersSquareColor: '#b5179e', cornersSquareType: 'extra-rounded', cornersSquareGradient: stops('#e9785c', '#b5179e'), cornersDotColor: '#e9785c', cornersDotType: 'dot', cornersDotGradient: stops('#e9785c', '#b5179e') } },
    { id: 'neon', label: 'Neon', color: '#39ff88', patch: { dotsColor: '#39ff88', dotsType: 'classy-rounded', dotsGradient: stops('#39ff88', '#00e5ff'), bgColor: '#101820', bgGradient: stops('#101820', '#1c2b36'), cornersSquareColor: '#00e5ff', cornersSquareType: 'extra-rounded', cornersSquareGradient: stops('#00e5ff', '#39ff88'), cornersDotColor: '#00e5ff', cornersDotType: 'dot', cornersDotGradient: stops('#00e5ff', '#39ff88') } },
    { id: 'minimal', label: 'Minimal', color: '#17252b', patch: { dotsColor: '#17252b', dotsType: 'dots', dotsGradient: stops('#17252b', '#4b5f66'), bgColor: '#fbfcf8', bgGradient: stops('#fbfcf8', '#eef1ea'), cornersSquareColor: '#17252b', cornersSquareType: 'dot', cornersSquareGradient: stops('#17252b', '#4b5f66'), cornersDotColor: '#17252b', cornersDotType: 'dot', cornersDotGradient: stops('#17252b', '#4b5f66') } },
  ] as { id: string; label: string; color: string; patch: Partial<QrConfig> }[],
  /** Ready-made gradients offered in the gradient editor. */
  gradientPresets: [
    { id: 'ocean', label: 'Ocean', stops: ['#0163aa', '#147d72'] },
    { id: 'sunset', label: 'Sunset', stops: ['#e9785c', '#b5179e'] },
    { id: 'forest', label: 'Forest', stops: ['#0b6b60', '#7bd389'] },
    { id: 'berry', label: 'Berry', stops: ['#6a11cb', '#e83e8c'] },
    { id: 'gold', label: 'Gold', stops: ['#f7971e', '#ffd200'] },
    { id: 'rainbow', label: 'Rainbow', stops: ['#e83e3e', '#f7b500', '#2dd55b', '#0163aa', '#6a11cb'] },
  ],
  dotTypes: ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'],
  cornerSquareTypes: ['dot', 'square', 'extra-rounded', 'rounded', 'dots', 'classy', 'classy-rounded'],
  cornerDotTypes: ['dot', 'square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'],
  shapes: ['square', 'circle'],
  errorLevels: ['L', 'M', 'Q', 'H'],
  gradientTypes: ['none', 'linear', 'radial'],
  extensions: ['svg', 'png', 'jpeg', 'webp'],
  dotStyles: [
    { value: 'square', label: 'Square', image: 'assets/qr/thumb-dots-square.png' },
    { value: 'rounded', label: 'Rounded', image: 'assets/qr/thumb-dots-rounded.png' },
    { value: 'dots', label: 'Dots', image: 'assets/qr/thumb-dots-dots.png' },
    { value: 'classy', label: 'Classy', image: 'assets/qr/thumb-dots-classy.png' },
    { value: 'classy-rounded', label: 'Classy rounded', image: 'assets/qr/thumb-dots-classy-rounded.png' },
    { value: 'extra-rounded', label: 'Extra rounded', image: 'assets/qr/thumb-dots-extra-rounded.png' },
  ],
  /** Outer square of the three corner markers. */
  cornerStyles: [
    { value: 'square', label: 'Square', image: 'assets/qr/thumb-frame-square.png' },
    { value: 'rounded', label: 'Rounded', image: 'assets/qr/thumb-frame-rounded.png' },
    { value: 'extra-rounded', label: 'Extra rounded', image: 'assets/qr/thumb-frame-extra-rounded.png' },
    { value: 'dot', label: 'Dot', image: 'assets/qr/thumb-frame-dot.png' },
    { value: 'dots', label: 'Dots', image: 'assets/qr/thumb-frame-dots.png' },
    { value: 'classy', label: 'Classy', image: 'assets/qr/thumb-frame-classy.png' },
    { value: 'classy-rounded', label: 'Classy rounded', image: 'assets/qr/thumb-frame-classy-rounded.png' },
  ],
  /** The inner (big) dot of the three corner markers. */
  cornerDotStyles: [
    { value: 'square', label: 'Square', image: 'assets/qr/thumb-eye-square.png' },
    { value: 'dot', label: 'Dot', image: 'assets/qr/thumb-eye-dot.png' },
    { value: 'rounded', label: 'Rounded', image: 'assets/qr/thumb-eye-rounded.png' },
    { value: 'extra-rounded', label: 'Extra rounded', image: 'assets/qr/thumb-eye-extra-rounded.png' },
    { value: 'dots', label: 'Dots', image: 'assets/qr/thumb-eye-dots.png' },
    { value: 'classy', label: 'Classy', image: 'assets/qr/thumb-eye-classy.png' },
    { value: 'classy-rounded', label: 'Classy rounded', image: 'assets/qr/thumb-eye-classy-rounded.png' },
  ],
  /** Plain-language explanation of the four error correction levels. */
  errorLevelInfo: [
    { id: 'L', name: 'Low', percent: 7, icon: 'flash-outline', summary: 'Simplest code', detail: 'Repairs about 7% damage. The pattern stays small and clean. Best for short text on a clear screen.' },
    { id: 'M', name: 'Medium', percent: 15, icon: 'checkmark-circle-outline', summary: 'Good everyday choice', detail: 'Repairs about 15% damage. A balanced choice for most codes.' },
    { id: 'Q', name: 'Quartile', percent: 25, icon: 'shield-half-outline', summary: 'Printed codes and small logos', detail: 'Repairs about 25% damage. Good for printed codes that may get dirty, and for a small logo.' },
    { id: 'H', name: 'High', percent: 30, icon: 'shield-checkmark-outline', summary: 'Big logos and rough surfaces', detail: 'Repairs about 30% damage. The most reliable, but the pattern is denser. Best with a large logo or on stickers.' },
  ],
};

/** A copy of the defaults that shares no objects with them. */
const freshConfig = (): QrConfig => structuredClone({ ...DEFAULT_CONFIG, fields: {} });

@Injectable({ providedIn: 'root' })
export class QrService {
  config: QrConfig = freshConfig();

  setContentType(contentType: QrContentType): void {
    this.config.contentType = contentType;
  }

  /** Replaces the working config (used to re-edit a saved code). */
  loadConfig(config: Partial<QrConfig>): void {
    const saved: any = config;
    const merged: any = { ...freshConfig(), ...saved, fields: { ...(saved.fields || {}) } };
    // Codes saved before gradients had color stops store two colors and a rotation per group.
    for (const g of ['dots', 'bg', 'cornersSquare', 'cornersDot']) {
      if (!saved[`${g}Gradient`] && saved[`${g}GradientType`] !== undefined) {
        merged[`${g}Gradient`] = {
          type: saved[`${g}GradientType`],
          rotation: saved[`${g}GradientRotation`] ?? 0,
          stops: [
            { offset: 0, color: saved[`${g}GradientColor1`] },
            { offset: 1, color: saved[`${g}GradientColor2`] },
          ],
        };
      }
      for (const key of ['Type', 'Color1', 'Color2', 'Rotation']) delete merged[`${g}Gradient${key}`];
    }
    this.config = merged as QrConfig;
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
    if (c.bgGradient.type === 'none' && c.dotsGradient.type === 'none') {
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
        // The library draws nothing in circle shape when roundSize is false.
        roundSize: c.shape === 'circle' ? true : c.dotsRoundSize,
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

    // Gradients. The library measures the rotation in radians.
    const gradient = (g: GradientConfig) => ({
      type: g.type,
      rotation: (g.rotation * Math.PI) / 180,
      colorStops: [...g.stops].sort((x, y) => x.offset - y.offset).map((stop) => ({ offset: stop.offset, color: stop.color })),
    });
    if (c.dotsGradient.type !== 'none') opts.dotsOptions.gradient = gradient(c.dotsGradient);
    if (c.bgGradient.type !== 'none') opts.backgroundOptions.gradient = gradient(c.bgGradient);
    if (c.cornersSquareGradient.type !== 'none') opts.cornersSquareOptions.gradient = gradient(c.cornersSquareGradient);
    if (c.cornersDotGradient.type !== 'none') opts.cornersDotOptions.gradient = gradient(c.cornersDotGradient);

    // Image / Logo
    if (c.imageUrl && c.imageUrl.trim()) {
      opts.image = c.imageUrl.trim();
    }

    return opts;
  }

  /**
   * Creates a fresh QRCodeStyling instance from the current config.
   */
  createQrCode(size?: number): any {
    const options = this.buildOptions();
    if (size) options.width = options.height = size;
    return new QRCodeStyling(options);
  }

  /**
   * Resets every option back to the defaults.
   */
  resetToDefaults(): void {
    this.config = freshConfig();
  }
}
