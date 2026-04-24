import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  HttpClient,
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FaIconLibrary, FontAwesomeModule } from
  '@fortawesome/angular-fontawesome';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { AppRoutingModule } from './app.routing.module';

import ptBr from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { AppInitService, initializeApp as initializer } from
  './core/services/app-initializer.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { JwtModule } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import { MarkdownModule } from 'ngx-markdown';

registerLocaleData(ptBr);

/** i18n HTTP loader factory. */
export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  // Return a lightweight TranslateLoader that fetches JSON files from
  // the assets folder. Avoids relying on the external http-loader
  // package API which may differ between versions.
  return {
    getTranslation: (lang: string) =>
      http.get(`./assets/i18n/${lang}.json`),
  } as TranslateLoader;
}

/** Legacy token getter for JwtModule (still OK to keep). */
export function tokenGetter() {
  return localStorage.getItem(`${environment.appPrefix}_access_token`);
}

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    TranslateModule.forRoot({
      fallbackLang: 'en-US',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    JwtModule.forRoot({
      config: {
        tokenGetter,
        allowedDomains: environment.production
          ? [environment.api.host]
          : ['localhost', '127.0.0.1', 'localhost:82', 'localhost:4200'],
        disallowedRoutes: [
          `${environment.api.baseUrl}/auth/login-ott`,
          `${environment.api.baseUrl}/auth/request-login-email`,
        ],
      },
    }),
    MarkdownModule.forRoot(),
    NgSelectModule,
  ],
  providers: [
    CookieService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializer,
      deps: [AppInitService],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, far, fab);
  }
}
