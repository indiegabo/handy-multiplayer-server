import { AfterViewInit } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { IconSize } from '../../models/icon';

@Component({
  selector: 'app-flag-icon',
  templateUrl: './flag-icon.component.html',
  styleUrls: ['./flag-icon.component.scss'],
  standalone: false,
})
export class FlagIconComponent implements OnInit, AfterViewInit {

  @Input() public name?: string;
  @Input() public size?: IconSize;
  public ready = false;

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {

  }

  ngOnInit(): void {
    if (this.name) {
      this.matIconRegistry.addSvgIcon(
        this.name,
        this.domSanitizer.bypassSecurityTrustResourceUrl(`./assets/icons/flags/${this.name}.svg`)
      );
    }
    this.ready = true;
  }

  ngAfterViewInit(): void {
  }

}
