import { Component, Input } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'handy-password-field',
  standalone: false,
  templateUrl: './handy-password-field.component.html',
  styleUrl: './handy-password-field.component.scss'
})
export class HandyPasswordFieldComponent {
  @Input({ required: true }) control!: FormControl;
  @Input() label: string = '';
  @Input() errorCondition: boolean | null = false;

  passwordVisible = false;

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
}
