import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormControlOptions, FormGroup } from '@angular/forms';
import { finalize, Observable, Subscription } from 'rxjs';

export type StyleOptions = {
  bordered?: boolean;
  rounded?: boolean;
  inputMinHeight?: number;
}

const CLICK_TIMEOUT_MS = 200;

@Component({
  selector: 'handy-single-field-input',
  standalone: false,
  templateUrl: './handy-single-field-input.component.html',
  styleUrl: './handy-single-field-input.component.scss'
})
export class HandySingleFieldInputComponent implements OnInit, OnDestroy {
  private _inputField?: ElementRef<HTMLInputElement>;
  private _value: any;

  @ViewChild('fieldInput')
  set fieldInput(element: ElementRef<HTMLInputElement>) {
    // As the input is rendered dynamically, we need this method in order to
    // be able to focus the input when it becomes part of the DOM upon entering
    // edit mode.
    this._inputField = element;
    if (element) {
      setTimeout(() => element.nativeElement.focus(), 0);
    }
  }

  @Input({ required: true }) fieldName!: string;
  @Input()
  set fieldValue(value: any) {
    this._value = value;
  }

  @Input({ required: true }) updater!: (fieldName: string, value: any) => Observable<any>;
  @Input() inputType: 'input' | 'textarea' = 'input';
  @Input() inputMode: string = 'text';
  @Input() label: string = '';
  @Input() controlOpts: FormControlOptions = {};
  @Input() styleOpts: StyleOptions = {};

  @Output() busy$ = new EventEmitter<boolean>();
  @Output() updateSuccess$ = new EventEmitter<any>();
  @Output() updateError$ = new EventEmitter<Error>();

  get field(): AbstractControl { return this.form.get('field')!; }
  get value(): any { return this._value; }

  isEditing = false;
  form = new FormGroup({
    field: new FormControl(undefined, this.controlOpts),
  });

  isLoading = false;

  private saveSubscription?: Subscription;
  private saveButtonClickedAt: number = 0;

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.saveSubscription?.unsubscribe();
  }

  onInputBlur() {
    const now = Date.now();
    const isRecentClick = (now - this.saveButtonClickedAt) < CLICK_TIMEOUT_MS;

    if (!isRecentClick && !this.isLoading) {
      this.closeEditing();
    }
  }

  onEnterKey(event: Event) {
    event.preventDefault();
    this.saveChanges();
  }

  startEditing() {
    this.isEditing = true;
    this.field.setValue(this._value);
  }

  closeEditing() {
    this.isEditing = false;
  }

  cancelEditing() {
    this.field.setValue(this._value);
    this.closeEditing();
  }

  saveChanges() {
    this.saveButtonClickedAt = Date.now();
    if (this.form.invalid) {
      return;
    }

    if (this.field.value === this._value) {
      this.closeEditing();
      return;
    }

    this._value = this.field.value;
    this.isLoading = true;
    this.busy$.emit(true);
    this.saveSubscription?.unsubscribe();
    this.saveSubscription = this.updater(this.fieldName, this._value)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.busy$.emit(false);
        })
      ).subscribe({
        next: (updatedData) => {
          this.updateSuccess$.emit(updatedData);
          this.closeEditing();
        },
        error: (err) => {
          this.updateError$.emit(err);
        }
      });
  }
}
