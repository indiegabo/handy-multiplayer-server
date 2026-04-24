import { Component, ViewEncapsulation } from '@angular/core';
import { DARK_THEME, Theme, ThemeService } from 'src/app/core/services/theme.service';

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-menu.component.html',
  styleUrl: './settings-menu.component.scss',
  standalone: false,
  encapsulation: ViewEncapsulation.None
})
export class SettingsMenuComponent {

  public activeTheme!: Theme;
  public darkThemeOn!: boolean;

  readonly DARK_THEME = DARK_THEME;
  constructor(
    private themeService: ThemeService,
  ) {
    this.activeTheme = this.themeService.activeTheme;
    this.setDarkTheme();
    this.themeService.$toggled.subscribe(theme => this.activeTheme = theme);
  }

  public toggleDarkMode(): void {
    this.themeService.toggle();
  }

  private setDarkTheme(): void {
    if (this.activeTheme === DARK_THEME) {
      this.darkThemeOn = true;
    } else {
      this.darkThemeOn = false;
    }
  }
}
