import { Injectable } from '@angular/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

export interface SavedQrCode {
  id: string;
  name: string;
  format: string;
  data: string;
  uri: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class QrStorageService {
  private readonly indexPath = 'saved-qr-codes.json';

  async saveToApp(fileName: string, format: string, data: string): Promise<SavedQrCode> {
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
    };
    const records = await this.list();
    await Filesystem.writeFile({
      path: this.indexPath,
      data: JSON.stringify([record, ...records]),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    return record;
  }

  async list(): Promise<SavedQrCode[]> {
    try {
      const file = await Filesystem.readFile({ path: this.indexPath, directory: Directory.Data, encoding: Encoding.UTF8 });
      return JSON.parse(file.data as string) as SavedQrCode[];
    } catch {
      return [];
    }
  }
}