import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

const DEFAULT_ON_ERROR_SRC = 'assets/images/avatar-placeholder.jpg';
const DEFAULT_COLOR = '#CCCCCC';
type ImageAlignment = 'left' | 'center' | 'right';
type Size = {
  width: number;
  height: number;
};

@Component({
  selector: 'app-round-avatar',
  templateUrl: './round-avatar.component.html',
  styleUrl: './round-avatar.component.scss',
  standalone: false,
})
export class RoundAvatarComponent {

  @Input() src?: string | SafeUrl;
  @Input() size: Size = { width: 36, height: 36 };
  @Input() borderWidth: number = 1;
  @Input() borderColor = '#fff';
  @Input() borderStyle = 'solid';
  @Input() tooltip = '';
  @Input() clickable?: boolean;
  @Input() alignment: ImageAlignment = 'center';
  @Input() onErrorSrc: string = DEFAULT_ON_ERROR_SRC;
  @Input() userName?: string;
  @Output() onClick$ = new EventEmitter();

  ALIGN_CENTER = 'center';
  ALIGN_LEFT = 'left';
  ALIGN_RIGHT = 'right';

  alignmentString = "center center";
  fallbackText = '';
  inlineStyle: any;
  fallbackStyle: any;

  constructor() { }

  onClick() {
    this.onClick$.emit();
  }

  ngOnInit() {
    switch (this.alignment) {
      case this.ALIGN_CENTER:
        this.alignmentString = "center center";
        break;
      case this.ALIGN_LEFT:
        this.alignmentString = "start center";
        break;
      case this.ALIGN_RIGHT:
        this.alignmentString = "end center";
        break;
    }

    this.inlineStyle = {
      'width': this.size.width + 'px',
      'height': this.size.height + 'px',
      'border-width': this.borderWidth + 'px',
      'border-color': this.borderColor,
      'border-style': this.borderStyle,
      'border-radius': '50%'
    };

    const randomColor = this.getRandomColor();
    this.fallbackStyle = {
      'width': this.size.width + 'px',
      'height': this.size.height + 'px',
      'border-width': this.borderWidth + 'px',
      'border-color': this.borderColor,
      'border-style': this.borderStyle,
      'border-radius': '50%',
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'background-color': randomColor,
      'color': this.getTextColor(randomColor),
      'font-weight': 'bold',
      'font-size': (this.size.width / 2) + 'px'
    };

    this.fallbackText = this.userName ? this.userName.charAt(0).toUpperCase() : '?';
  }

  private getRandomColor(): string {
    if (!this.userName || this.userName.length === 0) {
      return DEFAULT_COLOR;
    }
    const firstChar = this.userName.charAt(0).toUpperCase();
    const letterColors: { [key: string]: string } = {
      'A': '#FF5733', 'B': '#33FF57', 'C': '#3357FF', 'D': '#F033FF', 'E': '#FF33A8',
      'F': '#33FFF5', 'G': '#FF8C33', 'H': '#8C33FF', 'I': '#33FFBD', 'J': '#FF5733',
      'K': '#57FF33', 'L': '#3375FF', 'M': '#F033A1', 'N': '#A833FF', 'O': '#33FF75',
      'P': '#FF338C', 'Q': '#33A8FF', 'R': '#FF33F0', 'S': '#33FF33', 'T': '#F57F33',
      'U': '#5733FF', 'V': '#FF33A1', 'W': '#33FFA8', 'X': '#A133FF', 'Y': '#FFD733',
      'Z': '#33D7FF',
    };

    // Garante que a cor seja válida
    let color = letterColors[firstChar] || DEFAULT_COLOR;
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      color = DEFAULT_COLOR;
    }

    const luminance = this.getLuminance(color);
    if (luminance > 0.8) {
      color = this.darkenColor(color, 0.3);
    }

    return color;
  }

  private darkenColor(color: string, amount: number): string {
    // Implementação correta para escurecer uma cor
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);

    const r = Math.max(0, Math.round(((num >> 16) & 255) * (1 - amount)));
    const g = Math.max(0, Math.round(((num >> 8) & 255) * (1 - amount)));
    const b = Math.max(0, Math.round((num & 255) * (1 - amount)));

    // Garante que cada componente tenha 2 dígitos
    const rr = r.toString(16).padStart(2, '0');
    const gg = g.toString(16).padStart(2, '0');
    const bb = b.toString(16).padStart(2, '0');

    return `#${rr}${gg}${bb}`;
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.onErrorSrc;
  }

  private getTextColor(bgColor: string): string {
    // Se não conseguir determinar a cor de fundo, retorne preto
    if (!bgColor || bgColor === DEFAULT_COLOR) return '#000000';

    const luminance = this.getLuminance(bgColor);
    // Use branco para fundos escuros e preto para fundos claros
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  private getLuminance(color: string): number {
    // Converte hex para RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Fórmula de luminância relativa
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance;
  }
}
