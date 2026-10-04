import { QrDecodeService } from './qr-decode.service';
import { QrService } from './qr.service';

describe('QR payloads', () => {
  const qr = new QrService();
  const decoder = new QrDecodeService();

  const build = (type: 'email' | 'sms' | 'wifi' | 'vcard' | 'location', fields: Record<string, string>) => {
    qr.resetToDefaults();
    qr.setContentType(type);
    Object.entries(fields).forEach(([key, value]) => qr.setField(key, value));
    return qr.formatValue('');
  };

  it('round-trips Wi-Fi with escaped characters', () => {
    const payload = build('wifi', { ssid: 'My;Net', password: 'p:ss', security: 'WPA' });
    const result = decoder.decode(payload);
    expect(result.type).toBe('wifi');
    expect(result.details.find((d) => d.label === 'Network')?.value).toBe('My;Net');
    expect(result.actionCopy).toBe('p:ss');
  });

  it('round-trips SMS, email, location and contact', () => {
    expect(decoder.decode(build('sms', { number: '+1 234', message: 'Hi' })).type).toBe('sms');
    expect(decoder.decode(build('email', { to: 'a@b.co', subject: 'S' })).type).toBe('email');
    expect(decoder.decode(build('location', { lat: '24.7', lng: '46.6' })).type).toBe('location');
    const card = decoder.decode(build('vcard', { name: 'Jane', phone: '123' }));
    expect(card.type).toBe('vcard');
    expect(card.actionVcard).toBeTruthy();
  });

  it('returns an empty payload until required fields are filled', () => {
    expect(build('wifi', {})).toBe('');
  });

  it('flags shortened links', () => {
    expect(decoder.decode('https://bit.ly/abc').warning).toBeTruthy();
  });
});
