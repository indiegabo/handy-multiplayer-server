import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { Event, NavigationEnd, NavigationExtras, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Project } from 'src/app/shared/models/project';

type PendingNavigationData = {
  commands: any[];
  extras?: NavigationExtras;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  public currentUrl = new BehaviorSubject<string>('');
  private history: string[] = [];
  private pendingNavigationData?: PendingNavigationData;

  constructor(
    private router: Router,
    private location: Location
  ) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.next(event.urlAfterRedirects);
        this.history.push(event.urlAfterRedirects);
      }
    });
  }

  /**
   * Navigates to the login page.
   * If the current URL is '/', it sets the 'r' query parameter to '/dashboard'.
   * Otherwise, it sets the 'r' query parameter to the current URL.
   */
  toLogin(): void {
    const loginUrl = '/auth/login';
    this.router.navigate([loginUrl]);
  }

  /**
   * Go back to the previous page in the browser history.
   */
  back(): void {
    // Remove the last entry from the history stack
    this.history.pop();

    // If there are still entries in the history stack
    if (this.history.length > 0) {
      // Go back to the previous page
      this.location.back();
    } else {
      // If the history stack is empty, navigate to the home page
      this.router.navigateByUrl('/');
    }
  }

  toDashboard() {
    this.navigate(['app', 'dashboard']);
  }

  toNotFound() {
    this.navigate(['errors', 'not-found']);
  }

  navigate(commands: any[], extras?: NavigationExtras | undefined): Promise<boolean> {
    return this.router.navigate(commands, extras);
  }

  toProject(project: Project): void {
    this.router.navigate(['app', project.owner.username, project.tag]);
  }

  toPendingIfAny(): void {
    if (!this.pendingNavigationData) return;

    const data = this.pendingNavigationData;
    delete this.pendingNavigationData;
    this.navigate(data.commands, data.extras);
  }

  setPendingNavigationData(commands: any[], extras?: NavigationExtras | undefined): void {
    this.pendingNavigationData = { commands, extras };
  }
}
