import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export type ConfirmationDialogData = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  requireTypedConfirmation?: boolean;
  confirmationText?: string;
  confirmationHint?: string;
  confirmationInputPlaceholder?: string;
};

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
  standalone: false,
})
export class ConfirmationDialogComponent {
  typedConfirmation = '';

  constructor(
    private dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData,
  ) {
  }

  get shouldRequireTypedConfirmation(): boolean {
    return !!this.data.requireTypedConfirmation;
  }

  get typedConfirmationTarget(): string {
    return this.data.confirmationText ?? '';
  }

  get typedConfirmationHint(): string {
    if (this.data.confirmationHint) {
      return this.data.confirmationHint;
    }

    if (!this.typedConfirmationTarget) {
      return '';
    }

    return `Type exactly: ${this.typedConfirmationTarget}`;
  }

  get canConfirm(): boolean {
    if (!this.shouldRequireTypedConfirmation) {
      return true;
    }

    if (!this.typedConfirmationTarget) {
      return false;
    }

    return this.typedConfirmation.trim() === this.typedConfirmationTarget;
  }

  onTypedConfirmationInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.typedConfirmation = input?.value ?? '';
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    if (!this.canConfirm) {
      return;
    }

    this.dialogRef.close(true);
  }
}
