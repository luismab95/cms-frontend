import { LowerCasePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    inject,
} from '@angular/core';
import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import {
    ElementCMSI,
    ElementDataI,
} from 'app/shared/interfaces/element.interface';
import { ElementService } from 'app/shared/services/element.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import * as _ from 'lodash';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Subject, takeUntil } from 'rxjs';
import { ImagesManagerComponent } from '../../images-manager/images-manager.component';
import { LangugesTextComponent } from '../../languages-text/languages-text.component';
import { PermissionComponent } from '../../permission/permission.component';

@Component({
    selector: 'grid-settings',
    templateUrl: './settings.component.html',
    styles: [
        `
            formly-field-mat-input,
            formly-field-mat-select {
                width: 100% !important;
            }
        `,
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        MatTabsModule,
        MonacoEditorModule,
        ReactiveFormsModule,
        FormsModule,
        LowerCasePipe,
        LangugesTextComponent,
        FormlyModule,
        PermissionComponent,
    ],
})
export class GridSettingsComponent implements OnInit, OnDestroy {
    title: string;
    text: { [key: string]: string };
    isElement: boolean = false;
    dataText: ElementDataI[] = [];
    options = {
        theme: 'vs-dark',
        language: 'css',
        minimap: { enabled: false },
    };
    config: { [key: string]: any };
    cssControl: FormControl;
    urlStatics: string;
    form = new FormGroup({});
    fields: FormlyFieldConfig[] = [];
    elements: ElementCMSI[] = [];
    permission = PermissionCode;

    private _parameterService = inject(ParameterService);
    private readonly _matDialog = inject(MAT_DIALOG_DATA);
    private readonly _dialog = inject(MatDialog);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        public _matDialogRef: MatDialogRef<GridSettingsComponent>,
        private _elementService: ElementService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this._parameterService.parameter$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((parameters: ParameterI[]) => {
                this.urlStatics = findParameter(
                    'APP_STATICS_URL',
                    parameters
                ).value;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this._elementService.elements$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((elements) => {
                // Update the elements
                this.elements = elements.records;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.title = this._matDialog.title;
        this.isElement = this._matDialog.isElement;
        this.text = this._matDialog.text;
        this.dataText = this._matDialog.dataText || [];

        // Load form type
        this.isElement && (this.fields = this.getElementType() || []);

        // Load css
        this.cssControl = new FormControl(this._matDialog.css);

        // Load config
        this.config = _.cloneDeep(this._matDialog.config);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get element type
     */
    getElementType() {
        return this.elements.find((element) => element.name === this.title)
            .type as unknown as FormlyFieldConfig[];
    }

    /**
     * Open modal images manager
     */
    openImagesManager() {
        const dialogRef = this._dialog.open(ImagesManagerComponent, {
            height: '80%',
            disableClose: true,
            hasBackdrop: true,
            autoFocus: false,
            panelClass: 'images-manager-dialog-panel',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.updateImage(result);
            }
        });
    }

    /**
     * Save
     */
    save() {
        this._matDialogRef.close({
            config: this.config,
            css: this.cssControl.value,
            dataText: this.dataText,
        });
    }

    /**
     * Update image
     */
    updateImage(url: string) {
        if (this.isElement) {
            this.config.image = url;
        } else {
            this.config.backgroundImage = url;
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Set data text
     * @param dataText
     */
    setDataText(dataText: ElementDataI[]) {
        this.dataText = dataText;
    }

    /**
     * Get logo
     * @returns
     */
    getLogo() {
        if (this.isElement) {
            return `${this.urlStatics}/${this.config.image}`;
        } else {
            return `${this.urlStatics}/${this.config.backgroundImage}`;
        }
    }

    /**
     * Has valid image propertie
     * @returns
     */
    validImagePropertie() {
        if ('image' in this.config) {
            return true;
        }
        return false;
    }

    /**
     * Valid render permission
     */
    validPermission(code: string) {
        return validAction(code);
    }
}
