import { Injectable } from '@angular/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { QrConfig } from './qr.service';
import { DecodedQrType } from './qr-decode.service';

export interface SavedQrCode {
  id: string;
  name: string;
  format: string;
  data: string;
  uri: string;
  createdAt: string;
  /** Config used to create the code, so it can be edited again. */
  config?: QrConfig;
  favorite?: boolean;
}

export interface ScanRecord {
  id: string;
  type: DecodedQrType;
  icon: string;
  title: string;
  raw: string;
  scannedAt: string;
  favorite?: boolean;
}

const MAX_SCANS = 100;

@Injectable({ providedIn: 'root' })
export class QrStorageService {
  private readonly indexPath = 'saved-qr-codes.json';
  private readonly scansPath = 'scan-history.json';

  // ---------------- Created codes ----------------

  async saveToApp(fileName: string, format: string, data: string, config?: QrConfig): Promise<SavedQrCode> {
    const id = `${Date.now()}-${fileName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
    const path = `saved-qr/${id}.${format}`;
    const file = await Filesystem.writeFile({ path, data, directory: Directory.Data, recursive: true });
    const record: SavedQrCode = {
      id,
      name: fileName,
      format,
      data,
      uri: file.uri,
      createdAt: new Date().toISOString(),
      config: config ? { ...config, fields: { ...config.fields } } : undefined,
    };
    await this.writeJson(this.indexPath, [record, ...(await this.list())]);
    return record;
  }

  list(): Promise<SavedQrCode[]> {
    return this.readJson<SavedQrCode>(this.indexPath);
  }

  async toggleFavorite(id: string): Promise<void> {
    const records = await this.list();
    const record = records.find((r) => r.id === id);
    if (!record) return;
    record.favorite = !record.favorite;
    await this.writeJson(this.indexPath, records);
  }

  async remove(id: string): Promise<void> {
    const records = await this.list();
    const record = records.find((r) => r.id === id);
    if (!record) return;
    await Filesystem.deleteFile({ path: `saved-qr/${id}.${record.format}`, directory: Directory.Data }).catch(() => undefined);
    await this.writeJson(this.indexPath, records.filter((r) => r.id !== id));
  }

  // ---------------- Scan history ----------------

  async addScan(scan: Omit<ScanRecord, 'id' | 'scannedAt'>): Promise<ScanRecord> {
    const record: ScanRecord = { ...scan, id: `${Date.now()}`, scannedAt: new Date().toISOString() };
    const previous = (await this.scans()).filter((s) => s.raw !== scan.raw);
    const keep = previous.filter((s) => s.favorite || previous.indexOf(s) < MAX_SCANS - 1);
    await this.writeJson(this.scansPath, [record, ...keep]);
    return record;
  }

  scans(): Promise<ScanRecord[]> {
    return this.readJson<ScanRecord>(this.scansPath);
  }

  async toggleScanFavorite(id: string): Promise<void> {
    const scans = await this.scans();
    const scan = scans.find((s) => s.id === id);
    if (!scan) return;
    scan.favorite = !scan.favorite;
    await this.writeJson(this.scansPath, scans);
  }

  async removeScan(id: string): Promise<void> {
    await this.writeJson(this.scansPath, (await this.scans()).filter((s) => s.id !== id));
  }

  // ---------------- Helpers ----------------

  private async readJson<T>(path: string): Promise<T[]> {
    try {
      const file = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 });
      return JSON.parse(file.data as string) as T[];
    } catch {
      return [];
    }
  }

  private writeJson(path: string, value: unknown): Promise<unknown> {
    return Filesystem.writeFile({
      path,
      data: JSON.stringify(value),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  }
}
