import { RendererFactory2 } from '@angular/core';
import { Injectable, Renderer2 } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';
export const LIGHT_THEME = 'light';
export const DARK_THEME = 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  readonly DARK_THEME_CSS_CLASS = 'dark-theme';
  readonly WIDGETS_THEME_CSS_CLASS = 'widgets-theme';
  readonly THEME_COOKIE_NAME = 'chosen-theme';

  private renderer: Renderer2
  private _activeTheme!: Theme;

  /**
   * Events
   */
  public $toggled: BehaviorSubject<Theme> = new BehaviorSubject<Theme>(LIGHT_THEME);

  constructor(
    private cookieService: CookieService,
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  public start(): void {
    // Commented code for possible theme toggling

    // if (this.cookieService.check(this.THEME_COOKIE_NAME)) {
    //   if (this.cookieService.get(this.THEME_COOKIE_NAME) === LIGHT_THEME) {
    //     this._activeTheme = LIGHT_THEME;
    //     this.renderer.removeClass(document.body, this.DARK_THEME_CSS_CLASS);
    //     this.$toggled = new BehaviorSubject<Theme>(LIGHT_THEME);
    //   } else if (this.cookieService.get(this.THEME_COOKIE_NAME) === DARK_THEME) {
    //     this._activeTheme = DARK_THEME;
    //     this.renderer.addClass(document.body, this.DARK_THEME_CSS_CLASS);
    //     this.$toggled = new BehaviorSubject<Theme>(DARK_THEME);
    //   }
    // } else {
    //   this._activeTheme = LIGHT_THEME;
    //   this.renderer.removeClass(document.body, this.DARK_THEME_CSS_CLASS);
    //   this.$toggled = new BehaviorSubject<Theme>(LIGHT_THEME);
    // }

    this._activeTheme = DARK_THEME;
    this.renderer.addClass(document.body, this.DARK_THEME_CSS_CLASS);
    // this.themeToggle = new BehaviorSubject<Theme>(DARK_THEME);
  }

  public toggle(): void {
    if (this._activeTheme === LIGHT_THEME) {
      this.renderer.addClass(document.body, this.DARK_THEME_CSS_CLASS);
      this.cookieService.set(this.THEME_COOKIE_NAME, DARK_THEME);
      this._activeTheme = DARK_THEME;
      this.$toggled.next(DARK_THEME);
    } else {
      this.renderer.removeClass(document.body, this.DARK_THEME_CSS_CLASS);
      this.cookieService.set(this.THEME_COOKIE_NAME, LIGHT_THEME);
      this._activeTheme = LIGHT_THEME;
      this.$toggled.next(LIGHT_THEME);
    }
  }

  public get activeTheme(): Theme {
    return this._activeTheme;
  }

  public setWidgetsTheme(): void {
    this.renderer.removeClass(document.body, this.DARK_THEME_CSS_CLASS);
    this.renderer.addClass(document.body, this.WIDGETS_THEME_CSS_CLASS);
  }

}
