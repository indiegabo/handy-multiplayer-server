import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
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
    Validators,
} from '@angular/forms';
import {
    debounceTime,
    distinctUntilChanged,
    finalize,
    filter,
    switchMap,
    takeUntil,
    tap,
    Subject,
    map,
    of,
} from 'rxjs';

import { UserBackofficeViewDto } from '@hms/shared-types/hms';
import { UsersService } from
    'src/app/core/services/hms/users.service';

export type UserValueField = 'id' | 'username';

type FormData = {
    term: FormControl<string>;
};

@Component({
    selector: 'hms-user-field',
    standalone: false,
    templateUrl: './user-field.component.html',
    styleUrls: ['./user-field.component.scss'],
})
export class UserFieldComponent
    implements OnInit, OnDestroy, OnChanges {

    /**
     * Optional external FormControl to integrate with reactive forms.
     * When a user is selected, this control will receive either the user id
     * or username depending on the `valueField` input.
     */
    @Input() control?: FormControl<string | null>;

    /**
     * Controls which value is written to the external control.
     * Defaults to 'id'.
     */
    @Input() valueField: UserValueField = 'id';

    /**
     * Placeholder for the search input.
     */
    @Input() placeholder = 'Search for a user';

    /**
     * Minimum characters to trigger search.
     */
    @Input() minSearchLength = 3;

    /**
     * Preselected user DTO. If provided, component starts selected.
     */
    @Input() initialUser?: UserBackofficeViewDto | null;

    /**
     * Initial scalar value to resolve user (id or username).
     * Used only if `initialUser` is not provided.
     */
    @Input() initialValue?: string | null;

    /**
     * Which field `initialValue` refers to. Defaults to 'id'.
     */
    @Input() initialValueField: UserValueField = 'id';

    /**
     * If true, emits `userSelected` when initialized from inputs.
     * Defaults to false (no emission on init).
     */
    @Input() emitOnInit = false;

    /**
     * Emits the selected user (full dto) when an item is chosen.
     */
    @Output() userSelected = new EventEmitter<UserBackofficeViewDto>();

    /**
     * Emits when the field is cleared (after a selection had been made).
     */
    @Output() cleared = new EventEmitter<void>();

    loading = false;
    opened = false;

    form = new FormGroup<FormData>({
        term: new FormControl<string>(
            '',
            {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(1),
                ],
            },
        ),
    });

    users: UserBackofficeViewDto[] = [];
    selectedUser: UserBackofficeViewDto | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private readonly usersService: UsersService,
        private readonly hostRef: ElementRef<HTMLElement>,
    ) { }

    // #region Lifecycle

    ngOnInit(): void {
        this.initializeFromInputsOrControl();
        this.wireSearch();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialUser'] ||
            changes['initialValue'] ||
            changes['initialValueField']) {
            this.initializeFromInputsOrControl();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // #endregion

    // #region Getters

    get term(): AbstractControl<string> {
        return this.form.get('term')!;
    }

    // #endregion

    // #region Initialization helpers

    /**
     * Initializes selection using, in order:
     * 1) initialUser
     * 2) control.value (resolved by valueField)
     * 3) initialValue (resolved by initialValueField)
     */
    private initializeFromInputsOrControl(): void {
        // 1) If a full DTO is provided, use it directly.
        if (this.initialUser) {
            this.applySelection(this.initialUser, this.emitOnInit, false);
            return;
        }

        // 2) If control has a value, try to resolve from it.
        const controlValue = this.control?.value;
        if (controlValue) {
            this.resolveAndSelect(controlValue, this.valueField, this.emitOnInit);
            return;
        }

        // 3) If an initialValue is provided, resolve accordingly.
        if (this.initialValue) {
            this.resolveAndSelect(
                this.initialValue,
                this.initialValueField,
                this.emitOnInit,
            );
        }
    }

    /**
     * Resolves a user by value + field, then selects it if found.
     */
    private resolveAndSelect(
        value: string,
        by: UserValueField,
        shouldEmit: boolean,
    ): void {
        const obs = by === 'id'
            ? this.usersService.getEndUserById(value)
            : this.usersService.getEndUserByUsername(value);

        obs.pipe(takeUntil(this.destroy$)).subscribe({
            next: user => {
                if (user) {
                    this.applySelection(user, shouldEmit, true);
                }
            },
            error: () => {
                // Fail silently; remain unselected.
            },
        });
    }

    /**
     * Applies the selected user, optionally writing to control and emitting.
     */
    private applySelection(
        user: UserBackofficeViewDto,
        shouldEmit: boolean,
        shouldWriteControl: boolean,
    ): void {
        this.selectedUser = user;
        this.opened = false;
        this.users = [];
        this.form.reset({ term: '' });

        if (shouldWriteControl && this.control) {
            const value = this.valueField === 'id'
                ? user.id
                : user.username;

            this.control.setValue(value ?? null, {
                emitEvent: true,
                onlySelf: false,
            });
            this.control.markAsDirty();
            this.control.markAsTouched();
        }

        if (shouldEmit) {
            this.userSelected.emit(user);
        }
    }

    // #endregion

    // #region Search pipeline

    private wireSearch(): void {
        this.term.valueChanges.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            tap(value => {
                this.opened = !!value && value.length >= this.minSearchLength;
                if (!value || value.length < this.minSearchLength) {
                    this.clearResultsOnly();
                }
            }),
            filter(value => !!value && value.length >= this.minSearchLength),
            tap(() => {
                this.loading = true;
                this.users = [];
            }),
            switchMap(value => this.usersService.listEndUsers({
                term: value,
                page: 1,
                per_page: 10,
            }).pipe(
                map(resp => resp.items),
                finalize(() => this.loading = false),
            )),
            takeUntil(this.destroy$),
        ).subscribe({
            next: list => { this.users = list; },
            error: () => {
                this.loading = false;
                this.users = [];
            },
        });
    }

    // #endregion

    // #region UI actions

    selectUser(user: UserBackofficeViewDto, event?: Event): void {
        if (event) { event.stopPropagation(); }
        this.applySelection(user, true, true);
    }

    private clearResultsOnly(): void {
        this.users = [];
        this.loading = false;
    }

    clearSelection(event?: Event): void {
        if (event) { event.stopPropagation(); }

        this.selectedUser = null;
        this.opened = false;
        this.users = [];

        if (this.control) {
            this.control.setValue(null, {
                emitEvent: true,
                onlySelf: false,
            });
            this.control.markAsPristine();
            this.control.markAsUntouched();
        }

        this.cleared.emit();
        this.form.reset({ term: '' });
    }

    focusSearch(event?: Event): void {
        if (event) { event.stopPropagation(); }
        const value = this.term.value;
        this.opened = !!value && value.length >= this.minSearchLength;
    }

    onItemKeydown(
        user: UserBackofficeViewDto,
        event: KeyboardEvent,
    ): void {
        const key = event.key?.toLowerCase();
        if (key === 'enter' || key === ' ') {
            event.preventDefault();
            this.selectUser(user, event);
        }
    }

    // #endregion

    // #region Outside click handling

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const root = this.hostRef?.nativeElement;
        const target = event.target as Node | null;
        if (!root || !target) { return; }
        const isInside = root.contains(target);
        if (!isInside) { this.opened = false; }
    }

    // #endregion

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
