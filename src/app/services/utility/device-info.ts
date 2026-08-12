import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';

@Injectable({
  providedIn: 'root',
})
export class DeviceInfo {
  constructor() {}
  
  async isBrowser(): Promise<boolean> {
    const info = await Device.getInfo();
    return info.platform == "web";
  }
}
