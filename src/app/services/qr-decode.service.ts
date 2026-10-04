import { Injectable } from '@angular/core';

export type DecodedQrType = 'url' | 'email' | 'phone' | 'sms' | 'whatsapp' | 'wifi' | 'vcard' | 'location' | 'event' | 'text';

/** A one-tap action offered for a scanned code. Exactly one of url or copy is set. */
export interface QuickAction {
  label: string;
  icon: string;
  /** Opened with the matching app (browser, dialer, maps, mail...). */
  url?: string;
  /** Copied to the clipboard. */
  copy?: string;
}

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
  /** Text copied when the main action has no URL (for example the Wi-Fi password). */
  actionCopy?: string;
  /** vCard saved as a contact file when the main action is "Save contact". */
  actionVcard?: string;
  /** iCalendar text that is saved as a .ics file and opened in the calendar. */
  actionIcs?: string;
  /** Network to join when the main action is "Connect". */
  actionWifi?: { ssid: string; password: string; hidden: boolean };
  /** Secondary quick actions shown next to the main one. */
  extraActions: QuickAction[];
  /** Safety hint, for example for shortened links. */
  warning?: string;
}

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'ow.ly', 'cutt.ly', 'rebrand.ly', 'shorturl.at'];

@Injectable({ providedIn: 'root' })
export class QrDecodeService {
  decode(raw: string): DecodedQrResult {
    const value = (raw || '').trim();
    const wifi = value.match(/^WIFI:(.*)$/is);
    if (wifi) return this.decodeWifi(value, wifi[1]);

    if (/BEGIN:VCARD/i.test(value)) return this.decodeVcard(value);
    if (/BEGIN:VEVENT/i.test(value)) return this.decodeEvent(value);

    if (/^mailto:/i.test(value)) {
      const email = value.replace(/^mailto:/i, '').split('?')[0];
      return this.result('email', 'Email', 'mail-outline', email, 'Email address', 'Ready to compose', [{ label: 'To', value: email }], 'Send email', 'mail-outline', value, value, [
        { label: 'Copy address', icon: 'copy-outline', copy: email },
      ]);
    }

    const sms = value.match(/^(?:smsto|sms|mms|mmsto):([^:?]*)[:?]?(?:body=)?(.*)$/is);
    if (sms) {
      const number = sms[1];
      const message = sms[2];
      return this.result('sms', 'SMS', 'chatbubble-outline', value, number, 'Text message', [
        { label: 'Number', value: number },
        ...(message ? [{ label: 'Message', value: message }] : []),
      ], 'Send SMS', 'chatbubble-outline', `sms:${number}${message ? '?body=' + encodeURIComponent(message) : ''}`, value, [
        { label: 'Call', icon: 'call-outline', url: `tel:${number}` },
      ]);
    }

    if (/^tel:/i.test(value)) {
      const phone = value.replace(/^tel:/i, '');
      return this.result('phone', 'Phone', 'call-outline', phone, 'Phone number', 'Ready to call', [{ label: 'Number', value: phone }], 'Call number', 'call-outline', `tel:${phone}`, value, [
        { label: 'Send SMS', icon: 'chatbubble-outline', url: `sms:${phone}` },
        { label: 'Copy number', icon: 'copy-outline', copy: phone },
      ]);
    }

    const geo = value.match(/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
    if (geo) {
      const [, lat, lng] = geo;
      return this.result('location', 'Location', 'location-outline', value, `${lat}, ${lng}`, 'Map location', [
        { label: 'Latitude', value: lat },
        { label: 'Longitude', value: lng },
      ], 'Open in Maps', 'map-outline', `geo:${lat},${lng}?q=${lat},${lng}`, value, [
        { label: 'Copy coordinates', icon: 'copy-outline', copy: `${lat}, ${lng}` },
      ]);
    }

    if (/wa\.me\//i.test(value) || /whatsapp:\/\//i.test(value)) {
      return this.result('whatsapp', 'WhatsApp', 'logo-whatsapp', value, 'WhatsApp contact', 'Open this conversation in WhatsApp', [], 'Open WhatsApp', 'logo-whatsapp', value, value);
    }

    if (/^https?:\/\//i.test(value)) {
      const host = this.hostname(value);
      const result = this.result('url', 'Website', 'globe-outline', value, host, 'Web link', [], 'Open website', 'open-outline', value, value, [
        { label: 'Copy link', icon: 'copy-outline', copy: value },
      ]);
      result.warning = this.urlWarning(value, host);
      return result;
    }

    return this.result('text', 'Text', 'text-outline', value, 'Plain text', 'Decoded content', [], 'Copy text', 'copy-outline', undefined, value, [
      { label: 'Search web', icon: 'search-outline', url: `https://www.google.com/search?q=${encodeURIComponent(value)}` },
    ]);
  }

  private decodeWifi(raw: string, payload: string): DecodedQrResult {
    const fields = this.parseFields(payload);
    const security = fields.get('T') || 'nopass';
    const password = fields.get('P');
    const ssid = fields.get('S') || '';
    const result = this.result('wifi', 'Wi-Fi', 'wifi-outline', raw, ssid || 'Wi-Fi network', 'Network details', [
      { label: 'Network', value: ssid || 'Hidden network' },
      { label: 'Security', value: security.toUpperCase() },
      ...(password ? [{ label: 'Password', value: password }] : []),
    ], 'Connect', 'wifi-outline', undefined, password || ssid || raw, [
      ...(password ? [{ label: 'Copy password', icon: 'copy-outline', copy: password }] : []),
    ]);
    result.actionWifi = { ssid, password: password || '', hidden: (fields.get('H') || '').toLowerCase() === 'true' };
    return result;
  }

  private decodeEvent(raw: string): DecodedQrResult {
    const fields = new Map<string, string>();
    raw.split(/\r?\n/).forEach((line) => {
      const separator = line.indexOf(':');
      if (separator > 0) fields.set(line.slice(0, separator).split(';')[0].toUpperCase(), line.slice(separator + 1).trim());
    });
    const when = (value?: string) => {
      const m = value?.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
      if (!m) return value || '';
      const date = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
      return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', ...(m[4] ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(date);
    };
    const result = this.result('event', 'Event', 'calendar-outline', raw, fields.get('SUMMARY') || 'Calendar event', 'Event details', [
      ...(fields.get('DTSTART') ? [{ label: 'Starts', value: when(fields.get('DTSTART')) }] : []),
      ...(fields.get('DTEND') ? [{ label: 'Ends', value: when(fields.get('DTEND')) }] : []),
      ...(fields.get('LOCATION') ? [{ label: 'Place', value: fields.get('LOCATION') as string }] : []),
      ...(fields.get('DESCRIPTION') ? [{ label: 'Notes', value: fields.get('DESCRIPTION') as string }] : []),
    ], 'Add to calendar', 'calendar-outline', undefined, raw);
    result.actionIcs = /BEGIN:VCALENDAR/i.test(raw) ? raw : `BEGIN:VCALENDAR\nVERSION:2.0\n${raw}\nEND:VCALENDAR`;
    return result;
  }

  private decodeVcard(raw: string): DecodedQrResult {
    const fields = new Map<string, string>();
    raw.split(/\r?\n/).forEach((line) => {
      const separator = line.indexOf(':');
      if (separator > 0) fields.set(line.slice(0, separator).split(';')[0].toUpperCase(), line.slice(separator + 1).trim());
    });
    const name = fields.get('FN') || (fields.get('N') || '').replace(/;+/g, ' ').trim() || 'Contact card';
    const phone = fields.get('TEL');
    const email = fields.get('EMAIL');
    const result = this.result('vcard', 'Contact', 'person-circle-outline', raw, name, 'Contact details', [
      ...(phone ? [{ label: 'Phone', value: phone }] : []),
      ...(email ? [{ label: 'Email', value: email }] : []),
      ...(fields.get('ORG') ? [{ label: 'Company', value: fields.get('ORG') as string }] : []),
      ...(fields.get('URL') ? [{ label: 'Website', value: fields.get('URL') as string }] : []),
    ], 'Save contact', 'person-add-outline', undefined, raw, [
      ...(phone ? [{ label: 'Call', icon: 'call-outline', url: `tel:${phone}` }] : []),
      ...(email ? [{ label: 'Email', icon: 'mail-outline', url: `mailto:${email}` }] : []),
    ]);
    result.actionVcard = raw;
    return result;
  }

  private urlWarning(value: string, host: string): string | undefined {
    if (SHORTENERS.includes(host.replace(/^www\./, ''))) return 'This is a shortened link. Check where it leads before you open it.';
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return 'This link points to an IP address, which is unusual for a real website.';
    if (/^http:\/\//i.test(value)) return 'This link is not encrypted (http). Avoid entering personal data on it.';
    return undefined;
  }

  private parseFields(payload: string): Map<string, string> {
    return new Map(payload.split(/(?<!\\);/).filter(Boolean).map((field) => {
      const separator = field.indexOf(':');
      return [field.slice(0, separator).toUpperCase(), this.unescape(field.slice(separator + 1))] as [string, string];
    }));
  }

  private unescape(value: string): string {
    return value.replace(/\\([;,:\\"])/g, '$1').replace(/\\n/gi, '\n');
  }

  private hostname(value: string): string {
    try { return new URL(value).hostname; } catch { return 'Website link'; }
  }

  private result(type: DecodedQrType, label: string, icon: string, raw: string, title: string, subtitle: string, details: { label: string; value: string }[], actionLabel: string, actionIcon: string, actionUrl: string | undefined, actionCopy: string, extraActions: QuickAction[] = []): DecodedQrResult {
    return { type, label, icon, raw, title, subtitle, details, actionLabel, actionIcon, actionUrl, actionCopy, extraActions };
  }
}
