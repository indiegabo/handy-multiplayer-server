import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Prepare2FAAccountCreationResponseDto } from '@hms/shared-types/hms';
import { Subscription } from 'rxjs';
import { AlertsService } from 'src/app/core/services/alerts.service';
import { SetupService } from 'src/app/core/services/hms/setup.service';

type StartProcessFormGroup = {
  email: FormControl<string>;
};

@Component({
  selector: 'app-start-owner-creation-form',
  standalone: false,
  templateUrl: './start-owner-creation-form.component.html',
  styleUrl: './start-owner-creation-form.component.scss'
})
export class StartOwnerCreationFormComponent {

  @Output() done$ = new EventEmitter<Prepare2FAAccountCreationResponseDto>();
  loading = false;
  private subscriptions: Subscription[] = [];

  form = new FormGroup<StartProcessFormGroup>({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
  });

  get email() { return this.form.get('email')!; }

  constructor(
    private setupService: SetupService,
    private alertsService: AlertsService,
  ) {

  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  startProcess(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const payload = this.form.getRawValue();
    const sub = this.setupService.startOwnerCreation(payload).subscribe({
      next: (response) => {
        this.done$.emit(response);
        this.loading = false;
      },
      error: (error) => {
        this.alertsService.alertErrorResponse(error);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }
}
