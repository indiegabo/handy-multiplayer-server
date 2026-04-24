import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import loader from '@monaco-editor/loader';
import type * as Monaco from 'monaco-editor';

let monacoLoaderConfigured = false;
let darkThemeConfigured = false;

@Component({
    selector: 'app-json-editor',
    templateUrl: './json-editor.component.html',
    styleUrls: ['./json-editor.component.scss'],
    standalone: false,
})
export class JsonEditorComponent
    implements OnInit, OnChanges, AfterViewInit, OnDestroy {

    /**
     * Form control bound to the editor value.
     */
    @Input() formControl?: FormControl<unknown>;

    /**
     * Preferred input name when used in templates to avoid collision with
     * Angular's `FormControlDirective` selector (`[formControl]`).
     */
    @Input() control?: FormControl<unknown>;

    /**
     * Forces read-only mode in the editor.
     */
    @Input() readOnly = false;

    /**
     * Optional disabled state controlled externally.
     */
    @Input() disabled = false;

    /**
     * Helper text shown while the editor is editable.
     */
    @Input() helperText = 'Edit JSON using the Monaco editor above';

    /**
     * Helper text shown while the editor is read-only.
     */
    @Input() readOnlyHelperText = 'Read-only mode: JSON cannot be edited';

    @ViewChild('jsonEditorContainer', { static: false })
    jsonEditorContainer?: ElementRef<HTMLDivElement>;

    private editor?: Monaco.editor.IStandaloneCodeEditor;
    private model?: Monaco.editor.ITextModel;
    private monaco?: typeof Monaco;
    private destroyed = false;

    private isApplyingControlValue = false;
    private isApplyingEditorValue = false;

    private controlChangesSub?: Subscription;
    private readonly monacoDisposables: Monaco.IDisposable[] = [];

    private readonly modelUri =
        `inmemory://model/json-editor-${Math.random().toString(36).slice(2)}.json`;

    ngOnInit(): void {
        this.bindControl();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['formControl'] || changes['control']) {
            this.bindControl();
        }

        if (changes['readOnly'] || changes['disabled']) {
            this.updateEditorReadOnly();
        }
    }

    async ngAfterViewInit(): Promise<void> {
        await this.initializeEditor();
        this.bindControl();
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        this.controlChangesSub?.unsubscribe();
        this.monacoDisposables.forEach((disposable) => disposable.dispose());
        this.editor?.dispose();
        this.model?.dispose();
    }

    /**
     * Exposes read-only state to the template.
     */
    isInReadOnlyMode(): boolean {
        return this.isEditorReadOnly();
    }

    private bindControl(): void {
        this.controlChangesSub?.unsubscribe();

        const activeControl = this.getActiveControl();

        if (!activeControl) {
            this.updateEditorReadOnly();
            return;
        }

        this.controlChangesSub = activeControl.valueChanges.subscribe((value) => {
            if (this.isApplyingEditorValue) {
                return;
            }

            this.applyControlValueToEditor(value);
        });

        this.applyControlValueToEditor(activeControl.value);
        this.updateEditorReadOnly();
    }

    private async initializeEditor(): Promise<void> {
        if (!this.jsonEditorContainer) {
            return;
        }

        if (!monacoLoaderConfigured) {
            loader.config({
                paths: {
                    vs: '/assets/monaco/vs',
                },
            });
            monacoLoaderConfigured = true;
        }

        const monaco = await loader.init();
        if (this.destroyed || !this.jsonEditorContainer) {
            return;
        }

        this.monaco = monaco;

        if (!darkThemeConfigured) {
            monaco.editor.defineTheme('sg-json-editor-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': '#0f1720',
                    'editorGutter.background': '#0f1720',
                    'editorLineNumber.foreground': '#64748b',
                    'editorLineNumber.activeForeground': '#cbd5e1',
                },
            });
            darkThemeConfigured = true;
        }

        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            allowComments: false,
            enableSchemaRequest: false,
            schemas: [],
        });

        this.model = monaco.editor.createModel(
            this.stringifyJson(this.getActiveControl()?.value),
            'json',
            monaco.Uri.parse(this.modelUri),
        );

        const editor = monaco.editor.create(this.jsonEditorContainer.nativeElement, {
            model: this.model,
            theme: 'sg-json-editor-dark',
            automaticLayout: true,
            minimap: {
                enabled: false,
            },
            scrollBeyondLastLine: false,
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            readOnly: this.isEditorReadOnly(),
        });

        this.editor = editor;

        this.monacoDisposables.push(
            editor.onDidChangeModelContent(() => {
                if (this.isApplyingControlValue) {
                    return;
                }

                this.processEditorContent(true);
            }),
        );

        this.monacoDisposables.push(
            editor.onDidBlurEditorWidget(() => {
                this.getActiveControl()?.markAsTouched();
            }),
        );

        this.monacoDisposables.push(
            monaco.editor.onDidChangeMarkers((uris: readonly Monaco.Uri[]) => {
                if (!this.model) {
                    return;
                }

                const currentUri = this.model.uri.toString();
                const changedCurrentModel = uris.some(
                    (uri: Monaco.Uri) => uri.toString() === currentUri,
                );

                if (changedCurrentModel) {
                    this.processEditorContent(false);
                }
            }),
        );

        this.processEditorContent(false);
    }

    private applyControlValueToEditor(value: unknown): void {
        if (!this.model) {
            return;
        }

        const nextSerializedValue = this.stringifyJson(value);
        if (this.model.getValue() === nextSerializedValue) {
            return;
        }

        this.isApplyingControlValue = true;
        this.model.setValue(nextSerializedValue);
        this.isApplyingControlValue = false;

        this.processEditorContent(false);
    }

    private processEditorContent(emitToControl: boolean): void {
        if (!this.monaco || !this.model) {
            return;
        }

        const markers = this.monaco.editor.getModelMarkers({
            resource: this.model.uri,
        });

        const hasErrorMarker = markers.some(
            (marker) => marker.severity === this.monaco?.MarkerSeverity.Error,
        );

        if (hasErrorMarker) {
            this.setInvalidJsonError(true);
            return;
        }

        try {
            const parsedJson = JSON.parse(this.model.getValue()) as unknown;
            this.setInvalidJsonError(false);

            const activeControl = this.getActiveControl();
            if (emitToControl && activeControl) {
                this.isApplyingEditorValue = true;
                activeControl.setValue(parsedJson);
                activeControl.markAsDirty();
                this.isApplyingEditorValue = false;
            }
        } catch {
            this.setInvalidJsonError(true);
        }
    }

    private setInvalidJsonError(hasInvalidJson: boolean): void {
        const activeControl = this.getActiveControl();
        if (!activeControl) {
            return;
        }

        const currentErrors = activeControl.errors || {};

        if (hasInvalidJson) {
            if (!currentErrors['invalidJson']) {
                activeControl.setErrors({
                    ...currentErrors,
                    invalidJson: true,
                });
            }
            return;
        }

        if (!currentErrors['invalidJson']) {
            return;
        }

        const { invalidJson, ...remainingErrors } = currentErrors;
        activeControl.setErrors(
            Object.keys(remainingErrors).length > 0 ? remainingErrors : null,
        );
    }

    private stringifyJson(value: unknown): string {
        if (value === undefined) {
            return '{}';
        }

        try {
            return JSON.stringify(value, null, 2) || '{}';
        } catch {
            return '{}';
        }
    }

    private isEditorReadOnly(): boolean {
        return this.readOnly || this.disabled || !!this.getActiveControl()?.disabled;
    }

    private updateEditorReadOnly(): void {
        this.editor?.updateOptions({
            readOnly: this.isEditorReadOnly(),
        });
    }

    private getActiveControl(): FormControl<unknown> | undefined {
        return this.control || this.formControl;
    }
}
