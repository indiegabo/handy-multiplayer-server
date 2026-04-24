import {
  Component,
  OnDestroy,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { AlertsService } from 'src/app/core/services/alerts.service';
import { AuthService } from 'src/app/core/services/hms/auth.service';

type CreateAdminInviteFormGroup = {
  email: FormControl<string>;
};

/**
 * Page component for creating admin invitations.
 *
 * This initial version only provides the view shell.
 */
@Component({
  selector: 'app-create-admin-invite',
  standalone: false,
  templateUrl: './create-admin-invite.component.html',
  styleUrls: ['./create-admin-invite.component.scss'],
})
export class CreateAdminInviteComponent implements OnDestroy {
  sending = false;

  private subscriptions: Subscription[] = [];

  form = new FormGroup<CreateAdminInviteFormGroup>({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  get email(): FormControl<string> {
    return this.form.controls.email;
  }

  constructor(
    private authService: AuthService,
    private alertsService: AlertsService,
  ) { }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  submit(): void {
    if (this.form.invalid || this.sending) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending = true;

    const payload = {
      invitee_email: this.form.controls.email.value,
    };

    const sub = this.authService
      .createAdminInvite(payload)
      .pipe(finalize(() => (this.sending = false)))
      .subscribe({
        next: () => {
          this.alertsService.alert('Admin invite created successfully');
          this.form.reset({ email: '' });
        },
        error: (error) => {
          this.alertsService.alertErrorResponse(error);
        },
      });

    this.subscriptions.push(sub);
  }
}
