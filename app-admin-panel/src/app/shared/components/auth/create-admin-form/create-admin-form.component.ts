import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AdminCreationPayload, Prepare2FAAccountCreationResponseDto } from '@hms/shared-types';
import { AlertsService } from 'src/app/core/services/alerts.service';
import { PASSWORD_PATTERN } from
  'src/app/shared/constants/username-constants';

/**
 * Strongly-typed form shape for admin creation.
 */
type AdminCreationFormShape = {
  email: FormControl<string>;
  name: FormControl<string>;
  password: FormControl<string>;
  password_confirmation: FormControl<string>;
  twofa_token: FormControl<string>;
  twofa_code: FormControl<string>;
};

@Component({
  selector: 'app-create-admin-form',
  standalone: false,
  templateUrl: './create-admin-form.component.html',
  styleUrls: ['./create-admin-form.component.scss'],
})
export class CreateAdminFormComponent
  implements OnInit, OnChanges, OnDestroy {

  // ========= Inputs / Outputs ========= //

  @Input({ required: true })
  startData!: Prepare2FAAccountCreationResponseDto;

  @Input()
  loading = false;

  @Output()
  submitted$ = new EventEmitter<AdminCreationPayload>();

  // ========= Form Model ========= //

  /**
   * Reactive form instance. Built in constructor for early availability
   * in template bindings and lifecycle hooks.
   */
  form: FormGroup<AdminCreationFormShape> = this.buildForm();

  // Quick accessors (template-friendly, strongly typed).
  get email(): FormControl<string> {
    return this.form.controls.email;
  }
  get name(): FormControl<string> {
    return this.form.controls.name;
  }
  get password(): FormControl<string> {
    return this.form.controls.password;
  }
  get password_confirmation(): FormControl<string> {
    return this.form.controls.password_confirmation;
  }
  get twofa_code(): FormControl<string> {
    return this.form.controls.twofa_code;
  }
  get twofa_token(): FormControl<string> {
    return this.form.controls.twofa_token;
  }

  // ========= Lifecycle ========= //

  constructor(
    private alertsService: AlertsService,
  ) { }

  ngOnInit(): void {
    // Form-level validators that depend on multiple fields.
    this.form.addValidators(this.passwordMatchValidator);
    // Initial patch if input already arrived.
    if (this.startData) {
      this.applyStartDataToForm(this.startData);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  ngOnDestroy(): void {
  }

  // ========= Actions / Handlers ========= //

  /**
   * Emits the payload if the form is valid.
   * Marks all as touched to surface validation messages when invalid.
   */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Fail-fast if setup token is missing
    if (!this.twofa_token.value) {
      this.alertsService.error('Setup token is missing. Please retry the invite.');
      return;
    }

    const value = this.form.getRawValue() as AdminCreationPayload;
    this.submitted$.emit(value);
  }

  // ========= Private: Builders / Helpers ========= //

  /**
   * Builds the reactive form with validators.
   */
  private buildForm(): FormGroup<AdminCreationFormShape> {
    return new FormGroup<AdminCreationFormShape>({
      email: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      name: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(PASSWORD_PATTERN),
        ],
      }),
      password_confirmation: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      // Remova Validators.required e já deixe desabilitado
      twofa_token: new FormControl<string>({ value: '', disabled: true }, {
        nonNullable: true,
      }),
      twofa_code: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  /**
   * Applies invite start data to the form (locks e-mail and sets setup token).
   */
  private applyStartDataToForm(
    data: Prepare2FAAccountCreationResponseDto
  ): void {
    this.email.setValue(data.email ?? '');
    this.email.disable({ emitEvent: false });

    // Preenche o token no controle desabilitado (getRawValue ainda captura)
    this.twofa_token.setValue(data.setup_token ?? '');
  }

  // ========= Validators ========= //

  /**
   * Validates password === password_confirmation at form level.
   */
  private readonly passwordMatchValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const group = control as FormGroup<AdminCreationFormShape>;
    const pass = group.controls.password.value;
    const confirm = group.controls.password_confirmation.value;
    return pass === confirm ? null : { mismatch: true };
  };

  copyManualCode(): void {
    if (this.startData?.manual_entry_code) {
      navigator.clipboard.writeText(this.startData.manual_entry_code)
        .then(() => this.alertsService.alert('Copied to clipboard', { duration: 2 }))
        .catch(err => this.alertsService.error('Failed to copy to clipboard', err));
    }
  }
}
