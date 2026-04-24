/// <reference types="@angular/localize" />

import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Prevent double bootstrap in environments where scripts may run twice
// (e.g., injected content-scripts or misconfigured dev tooling).
declare global {
  interface Window {
    __hms_admin_panel_bootstrapped__?: boolean;
  }
}

if (window.__hms_admin_panel_bootstrapped__) {
  // Already bootstrapped — avoid duplicate component definitions.
  // This prevents NG0912 collisions caused by multiple runtime bootstraps.
  // eslint-disable-next-line no-console
  console.warn('Admin panel already bootstrapped; skipping second bootstrap.');
} else {
  platformBrowserDynamic()
    .bootstrapModule(AppModule, {
      applicationProviders: [provideZoneChangeDetection()],
    })
    .then(() => {
      window.__hms_admin_panel_bootstrapped__ = true;
    })
    .catch((err) => console.error(err));
}
