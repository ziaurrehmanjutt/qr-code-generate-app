import { Injectable } from '@angular/core';

export type DecodedQrType = 'url' | 'email' | 'phone' | 'whatsapp' | 'wifi' | 'vcard' | 'text';

export interface DecodedQrResult {
  type: DecodedQrType;
  label: string;
  icon: string;
  raw: string;
  title: string;
  subtitle: string;
  details: { label: string; value: string }[];
  actionLabel: string;
  actionIcon: string;
  actionUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class QrDecodeService {
  decode(raw: string): DecodedQrResult {
    const value = (raw || '').trim();
    const wifi = value.match(/^WIFI:(.*)$/is);
    if (wifi) return this.decodeWifi(value, wifi[1]);

    const vcard = /BEGIN:VCARD/i.test(value);
    if (vcard) return this.decodeVcard(value);

    if (/^mailto:/i.test(value)) {
      const email = value.replace(/^mailto:/i, '').split('?')[0];
      return this.result('email', 'Email', 'mail-outline', email, 'Email address', 'Ready to compose', [{ label: 'To', value: email }], 'Send email', 'mail-outline', value);
    }

    if (/^(tel:|sms:)/i.test(value)) {
      const phone = value.replace(/^(tel:|sms:)/i, '');
      return this.result('phone', 'Phone', 'call-outline', phone, 'Phone number', 'Ready to call', [{ label: 'Number', value: phone }], 'Call number', 'call-outline', `tel:${phone}`);
    }

    if (/wa\.me\//i.test(value) || /whatsapp:\/\//i.test(value)) {
      return this.result('whatsapp', 'WhatsApp', 'logo-whatsapp', value, 'WhatsApp contact', 'Open this conversation in WhatsApp', [], 'Open WhatsApp', 'logo-whatsapp', value);
    }

    if (/^https?:\/\//i.test(value)) {
      return this.result('url', 'Website', 'globe-outline', value, this.hostname(value), 'Web link', [], 'Open website', 'open-outline', value);
    }

    return this.result('text', 'Text', 'text-outline', value, 'Plain text', 'Decoded content', [], 'Copy text', 'copy-outline');
  }

  private decodeWifi(raw: string, payload: string): DecodedQrResult {
    const fields = this.parseFields(payload);
    const security = fields.get('T') || 'nopass';
    return this.result('wifi', 'Wi-Fi', 'wifi-outline', raw, fields.get('S') || 'Wi-Fi network', 'Network details', [
      { label: 'Network', value: fields.get('S') || 'Hidden network' },
      { label: 'Security', value: security.toUpperCase() },
      ...(fields.get('P') ? [{ label: 'Password', value: fields.get('P') as string }] : []),
    ], 'Use network', 'wifi-outline');
  }

  private decodeVcard(raw: string): DecodedQrResult {
    const fields = new Map<string, string>();
    raw.split(/\r?\n/).forEach((line) => {
      const separator = line.indexOf(':');
      if (separator > 0) fields.set(line.slice(0, separator).toUpperCase(), line.slice(separator + 1).trim());
    });
    const name = fields.get('FN') || fields.get('N') || 'Contact card';
    return this.result('vcard', 'Contact', 'person-circle-outline', raw, name, 'Contact details', [
      ...(fields.get('TEL') ? [{ label: 'Phone', value: fields.get('TEL') as string }] : []),
      ...(fields.get('EMAIL') ? [{ label: 'Email', value: fields.get('EMAIL') as string }] : []),
      ...(fields.get('ORG') ? [{ label: 'Company', value: fields.get('ORG') as string }] : []),
    ], 'Copy contact', 'copy-outline');
  }

  private parseFields(payload: string): Map<string, string> {
    return new Map(payload.split(';').filter(Boolean).map((field) => {
      const separator = field.indexOf(':');
      return [field.slice(0, separator).toUpperCase(), this.unescape(field.slice(separator + 1))];
    }));
  }

  private unescape(value: string): string {
    return value.replace(/\\([;,:\\])/g, '$1').replace(/\\n/gi, '\n');
  }

  private hostname(value: string): string {
    try { return new URL(value).hostname; } catch { return 'Website link'; }
  }

  private result(type: DecodedQrType, label: string, icon: string, raw: string, title: string, subtitle: string, details: { label: string; value: string }[], actionLabel: string, actionIcon: string, actionUrl?: string): DecodedQrResult {
    return { type, label, icon, raw, title, subtitle, details, actionLabel, actionIcon, actionUrl };
  }
}