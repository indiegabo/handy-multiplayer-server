import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type TwoFactorInputPattern = 'numeric' | 'alpha' | 'hexadecimal' | 'custom';

@Component({
  selector: 'handy-two-factor-input',
  standalone: false,
  templateUrl: './handy-two-factor-input.component.html',
  styleUrls: ['./handy-two-factor-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HandyTwoFactorInputComponent),
      multi: true
    }
  ]
})
export class HandyTwoFactorInputComponent implements ControlValueAccessor {
  @Input() codeLength: number = 6;
  @Input() loading: boolean = false;
  @Input() patternType: TwoFactorInputPattern = 'numeric';
  @Input() allowedPattern: RegExp | null = null;
  @Input() errorColor: string = '#ff4444';
  @Input() successColor: string = '#00C851';
  @Input() placeholder: string = '';
  @Input() inputType: string = 'text';
  @Input() autoFocus: boolean = true;

  @Output() codeComplete = new EventEmitter<string>();
  @Output() codeChange = new EventEmitter<string>();

  @ViewChildren('inputEl') inputElements!: QueryList<ElementRef>;

  code: string[] = [];
  isErrorState: boolean = false;
  currentFocusIndex: number = 0;
  disabled: boolean = false;

  // ControlValueAccessor callbacks
  private onChange: (value: string) => void = () => { };
  private onTouched: () => void = () => { };

  constructor() {
    this.initializeCodeArray();
  }

  // Initialize with empty values
  private initializeCodeArray(): void {
    this.code = Array(this.codeLength).fill('');
  }

  // Handle input events
  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    const pattern = this.getValidationPattern();

    if (!pattern.test(value)) {
      this.handleInvalidInput(input, index);
      return;
    }

    if (value.length > 1) {
      value = this.handleMultipleCharacters(value, input);
    }

    this.updateCodeValue(value, index);

    if (value && index < this.codeLength - 1) {
      this.moveToNextInput(index);
    }

    if (this.isCodeComplete()) {
      this.handleCodeComplete();
    }
  }

  // Handle keydown events
  onKeyDown(event: KeyboardEvent, index: number): void {
    switch (event.key) {
      case 'Backspace':
        this.handleBackspace(index);
        break;
      case 'ArrowLeft':
        this.moveToPreviousInput(index, event);
        break;
      case 'ArrowRight':
        this.moveToNextInput(index, event);
        break;
      case 'Tab':
        // Allow default tab behavior
        break;
      default:
        // Prevent non-character keys
        if (event.key.length > 1 && !['Delete', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
        }
    }
  }

  // Handle paste events
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData?.getData('text').trim() || '';

    if (this.isValidPaste(clipboardData)) {
      this.fillCodeFromString(clipboardData);
      this.handleCodeComplete();
    } else {
      this.isErrorState = true;
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    if (value && typeof value === 'string' && value.length === this.codeLength) {
      this.fillCodeFromString(value);
    } else if (!value) {
      this.clear();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Helper methods
  private handleInvalidInput(input: HTMLInputElement, index: number): void {
    this.isErrorState = true;
    input.value = '';
    this.code[index] = '';
    this.onChange(this.getFullCode());
    this.onTouched();
  }

  private handleMultipleCharacters(value: string, input: HTMLInputElement): string {
    const lastChar = value.charAt(value.length - 1);
    input.value = lastChar;
    return lastChar;
  }

  private updateCodeValue(value: string, index: number): void {
    this.code[index] = value;
    this.isErrorState = false;
    const fullCode = this.getFullCode();
    this.codeChange.emit(fullCode);
    this.onChange(fullCode);
    this.onTouched();
  }

  private moveToNextInput(currentIndex: number, event?: Event): void {
    if (currentIndex < this.codeLength - 1) {
      this.currentFocusIndex = currentIndex + 1;
      this.focusInput(this.currentFocusIndex);
      event?.preventDefault();
    }
  }

  private moveToPreviousInput(currentIndex: number, event?: Event): void {
    if (currentIndex > 0) {
      this.currentFocusIndex = currentIndex - 1;
      this.focusInput(this.currentFocusIndex);
      event?.preventDefault();
    }
  }

  private handleBackspace(index: number): void {
    if (!this.code[index] && index > 0) {
      this.currentFocusIndex = index - 1;
      this.focusInput(this.currentFocusIndex);
    }
  }

  private isValidPaste(data: string): boolean {
    return data.length === this.codeLength &&
      this.getValidationPattern().test(data);
  }

  private getValidationPattern(): RegExp {
    if (this.patternType === 'custom' && this.allowedPattern) {
      return this.allowedPattern;
    }

    switch (this.patternType) {
      case 'alpha':
        return /^[a-zA-Z]*$/;
      case 'hexadecimal':
        return /^[a-fA-F0-9]*$/;
      case 'numeric':
      default:
        return /^[0-9]*$/;
    }
  }

  private focusInput(index: number): void {
    if (this.inputElements?.toArray()[index] && this.autoFocus) {
      setTimeout(() => {
        this.inputElements.toArray()[index].nativeElement.focus();
      }, 0);
    }
  }

  private fillCodeFromString(codeString: string): void {
    // Split the string into individual characters
    const chars = codeString.split('').slice(0, this.codeLength);

    // Update the code array
    this.code = [...chars, ...Array(this.codeLength - chars.length).fill('')];

    // Update the input values
    this.inputElements?.forEach((inputEl, index) => {
      inputEl.nativeElement.value = this.code[index] || '';
    });

    // Emit events
    const fullCode = this.getFullCode();
    this.codeChange.emit(fullCode);
    this.onChange(fullCode);
    this.onTouched();

    // Reset error state
    this.isErrorState = false;

    // Focus the last input
    this.currentFocusIndex = Math.min(chars.length, this.codeLength - 1);
    this.focusInput(this.currentFocusIndex);
  }

  // Public methods
  isCodeComplete(): boolean {
    return this.code.every(digit => digit !== '') &&
      this.code.length === this.codeLength;
  }

  getFullCode(): string {
    return this.code.join('');
  }

  getBorderColor(): string {
    if (this.isErrorState) return this.errorColor;
    if (this.isCodeComplete()) return this.successColor;
    return '';
  }

  clear(): void {
    this.initializeCodeArray();
    this.isErrorState = false;
    this.currentFocusIndex = 0;
    this.codeChange.emit('');
    this.onChange('');
    this.onTouched();

    this.inputElements?.forEach(inputEl => {
      inputEl.nativeElement.value = '';
    });

    if (this.autoFocus) {
      this.focusInput(0);
    }
  }

  private handleCodeComplete(): void {
    if (this.isCodeComplete()) {
      this.codeComplete.emit(this.getFullCode());
    }
  }

  // Helper to get input type based on pattern
  getInputType(): string {
    if (this.inputType) return this.inputType;

    switch (this.patternType) {
      case 'numeric':
        return 'tel'; // Better for numeric input on mobile
      default:
        return 'text';
    }
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
