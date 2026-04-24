import { Injectable } from '@angular/core';
import { NavigationService } from './navigation.service';
import { AuthService } from './hms/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExternalDispatcherService {

  dispatchers: Map<string, Function> = new Map<string, Function>();

  constructor(
    private navigationService: NavigationService,
    private auth: AuthService,
  ) {
    this.loadDispatchers();
  }

  dispatch(key: string, data: any): void {
    const dispatcher = this.dispatchers.get(key);
    if (!dispatcher) {
      this.navigationService.toNotFound();
      return;
    }
    dispatcher(data);
  }

  private loadDispatchers(): void {
    // this.dispatchers.set('invitation-acceptance', (realParams: any) => {
    //   if (!realParams.token) {
    //     this.navigationService.toNotFound();
    //     return;
    //   }

    //   // Verifica o estado de autenticação de forma reativa
    //   this.auth.getCurrentUser().pipe(
    //     first() // Pegamos apenas o primeiro valor
    //   ).subscribe(user => {
    //     if (user) {
    //       // Usuário autenticado
    //       this.navigationService.navigate(['app', 'invitations', 'acceptance'], {
    //         queryParams: { token: realParams.token }
    //       });
    //     } else {
    //       // Usuário não autenticado
    //       this.navigationService.setPendingNavigationData(
    //         ['app', 'invitations', 'acceptance'],
    //         { queryParams: { token: realParams.token } }
    //       );
    //       this.navigationService.toLogin();
    //     }
    //   });
    // });

    // this.dispatchers.set('verify-email', (realParams: any) => {
    //   this.navigationService.navigate(['auth', 'verify-email'], {
    //     queryParams: { token: realParams.token }
    //   });
    // });
  }
}
