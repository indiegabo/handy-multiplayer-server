import { Component, Input } from '@angular/core';

type TextLoaderSize = 'default' | 'small' | 'tiny';

@Component({
  selector: 'app-text-loader',
  templateUrl: './text-loader.component.html',
  styleUrl: './text-loader.component.scss',
  standalone: false,
})
export class TextLoaderComponent {

  @Input() size: TextLoaderSize = 'default';

}
