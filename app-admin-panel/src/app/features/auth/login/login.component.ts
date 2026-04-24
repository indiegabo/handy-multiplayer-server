import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AlertsService } from 'src/app/core/services/alerts.service';
import {
  AuthService,
  ProcessedLoginResponse,
} from 'src/app/core/services/hms/auth.service';
import { ErrorResponse } from 'src/app/shared/models/http/http-responses';
import { environment } from 'src/environments/environment';

type LoginFormGroup = {
  email: FormControl<string>;
  password: FormControl<string>;
};

type TwoFAFormGroup = {
  code: FormControl<string>;
};

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent implements OnInit, OnDestroy {
  // Forms
  loginForm = new FormGroup<LoginFormGroup>({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  twoFAForm = new FormGroup<TwoFAFormGroup>({
    code: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6),
      Validators.maxLength(6)],
    }),
  });

  get twoFACode(): FormControl<string> {
    return this.twoFAForm.get('code')! as FormControl<string>;
  }

  // Component states
  isLoading = false;
  errorMessages: string[] = [];
  currentView: 'credentials' | 'twoFA' = 'credentials';

  // 2FA related properties
  twoFAMethod?: string;
  twoFAMessage?: string;
  twoFAToken?: string;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertsService: AlertsService,
  ) { }

  ngOnInit(): void {
    // Prefills credentials in non-production environments.
    if (!environment.production) {
      console.log('Prefilling login form with default credentials for development environment.');
      this.loginForm.setValue({
        email: 'owner@hms.com',
        password: '$P@ssw0rd#',
      });
    }
  }

  /**
   * Handles the initial login form submission.
   */
  onLoginFormSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessages = [];

    const { email, password } = this.loginForm.getRawValue();

    this.authService
      .login(email, password)
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => this.handleLoginResponse(response),
        error: (err) => this.handleLoginError(err.error),
      });
  }

  /**
   * Handles the 2FA form submission.
   */
  onTwoFASubmit(): void {
    if (this.twoFAForm.invalid || !this.twoFAToken) {
      return;
    }

    this.isLoading = true;
    this.errorMessages = [];

    const { code } = this.twoFAForm.getRawValue();

    this.authService
      .complete2FALogin(this.twoFAToken, code)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/app']);
        },
        error: (err) => this.handleTwoFAError(err.error),
      });
  }

  /**
   * Processes the login response from auth service.
   */
  private handleLoginResponse(response: ProcessedLoginResponse): void {
    this.isLoading = false;

    if (response.requires2FA) {
      this.currentView = 'twoFA';
      this.twoFAMethod = response.twofa?.method;
      this.twoFAMessage = response.twofa?.message;
      this.twoFAToken = response.twofa?.second_step_token;
    } else {
      this.router.navigate(['/app']);
    }
  }

  /**
   * Handles login errors.
   */
  private handleLoginError(error: ErrorResponse): void {
    if (error.messages) {
      this.errorMessages = error.messages;
      return;
    }
    this.errorMessages.push('Login failed. Please try again.');
  }

  /**
   * Handles 2FA verification errors.
   */
  private handleTwoFAError(error: ErrorResponse): void {
    this.twoFAForm.controls.code.reset();
    if (error.messages) {
      this.errorMessages = error.messages;
      return;
    }
    this.errorMessages.push('2FA verification failed. Please try again.');
  }

  /**
   * Returns to the credentials form.
   */
  backToCredentials(): void {
    this.currentView = 'credentials';
    this.errorMessages = [];
    this.twoFAForm.reset();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
