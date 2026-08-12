import { Component } from '@angular/core';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {

  constructor() {}

  scanBarcode() {
    CapacitorBarcodeScanner.scanBarcode({hint: CapacitorBarcodeScannerTypeHint.QR_CODE}).then(result => {
      console.log(result);
    }).catch(error => {
      console.error(error);
    });
  }

  ionViewWillEnter(){

    this.scanBarcode();
  }

}
