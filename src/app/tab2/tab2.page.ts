import { Component, ElementRef, ViewChild, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Device } from '@capacitor/device';
import QRCodeStyling from "qr-code-styling";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLDivElement>;
  qrCode: any = null;
  qrData: string = 'https://www.example.com';
  constructor() {}


  ionViewWillEnter(){
      this.generateQrCode();
  }

  generateQrCode(){
    if (this.canvas?.nativeElement) {
      this.canvas.nativeElement.innerHTML = '';
    }

    console.log( this.canvas.nativeElement);
    this.qrCode = new QRCodeStyling({data: this.qrData});
    if (this.canvas?.nativeElement) {
      this.qrCode.append(this.canvas.nativeElement);
    }
  }



  async isBrowser(): Promise<boolean> {
    const info = await Device.getInfo();
    return info.platform == "web";
  }

  async download() {
    const fileName = 'qr-code';
    const ext = this.downloadFormat;

    if (await this.isBrowser()) {
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
          text: `QR Code: ${this.qrData}`,
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


  ///////
  isDownlaodSheetOpen = false;
  downloadFormat = 'png';
}
