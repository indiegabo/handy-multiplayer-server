import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Subscription, tap } from 'rxjs';
import { Language, LanguagesService } from 'src/app/core/services/languages.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { AuthService } from 'src/app/core/services/hms/auth.service';
import { AppSettingsService, HttpTarget } from 'src/app/core/services/app-settings.service';
import { AppTopBarService } from '../app-top-bar.service';
import { AdminUserAuthInfoDto } from '@hms/shared-types';

export type HttpTargetItem = {
  id: HttpTarget;
  name: string;
}

@Component({
  selector: 'app-top-bar',
  templateUrl: './app-top-bar.component.html',
  styleUrls: ['./app-top-bar.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None
})
export class AppTopBarComponent implements OnInit, OnDestroy {

  user?: AdminUserAuthInfoDto;
  title?: string;
  activeLanguage: Language;
  languages: Language[];
  loggingOut = false;

  selectedHttpTarget: HttpTarget = 'localhost';

  httpTargets: HttpTargetItem[] = [
    { id: 'localhost' as HttpTarget, name: 'Localhost' },
    { id: 'production' as HttpTarget, name: 'Production' }
  ];

  private languagesSub: Subscription;
  private titleSub: Subscription;
  private userSub?: Subscription; // Nova subscription para o usuário

  constructor(
    private router: Router,
    private authService: AuthService,
    private navigationService: NavigationService,
    private languagesService: LanguagesService,
    private appBarService: AppTopBarService,
    private appSettingsService: AppSettingsService,
  ) {
    this.activeLanguage = this.languagesService.getCurrentLanguage();
    this.languages = this.languagesService.availableLanguages;
    this.languagesSub = this.languagesService.languageChanged$.subscribe(language => this.activeLanguage = language);
    this.titleSub = this.appBarService.titleChanged$.subscribe(title => this.title = title);
  }

  ngOnInit(): void {
    if (this.appBarService.title) {
      this.title = this.appBarService.title;
    }

    this.appSettingsService.httpTarget$.subscribe(httpTarget => {
      this.selectedHttpTarget = httpTarget;
    });

    // Nova subscription para o usuário logado
    this.userSub = this.authService.getCurrentUser().subscribe(user => {
      this.user = user || undefined;
    });
  }

  ngOnDestroy(): void {
    this.languagesSub.unsubscribe();
    this.titleSub.unsubscribe();
    this.userSub?.unsubscribe();
  }


  public setActiveLanguage(language: Language): void {
    this.languagesService.defineLanguage(language);
  }

  public goToDashboard(): void {
    this.router.navigate(['/admin']);
  }

  public goToLogin(): void {
    this.navigationService.toLogin();
  }

  public logout(): void {
    this.loggingOut = true;
    this.authService.logout().pipe(
      finalize(() => this.loggingOut = false)
    ).subscribe(() => this.goToLogin());
  }

  setHttpTarget(item: HttpTargetItem): void {
    this.appSettingsService.httpTarget = item.id;
    setTimeout(() => window.location.reload(), 200);
  }

}
