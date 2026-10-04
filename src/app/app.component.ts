import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private settings: SettingsService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.settings.init();
    if (!this.settings.settings.onboarded) this.router.navigateByUrl('/onboarding', { replaceUrl: true });
  }
}
