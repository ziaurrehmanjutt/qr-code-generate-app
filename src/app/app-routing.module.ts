import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'settings', loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage) },
  { path: 'onboarding', loadComponent: () => import('./onboarding/onboarding.page').then(m => m.OnboardingPage) },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
