import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewEncapsulation,
    inject,
    signal,
} from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { FuseConfig, FuseConfigService } from '@fuse/services/config';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { ToastrService } from 'ngx-toastr';
import { Subject, finalize, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { ParameterI } from '../parameter.interface';
import { ParameterService } from '../parameter.service';

@Component({
    selector: 'parameters-web',
    templateUrl: './web.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        NgClass,
        MatTooltipModule,
        MatProgressSpinnerModule,
    ],
})
export class ParametersWebComponent implements OnInit {
    @Input() parameters: ParameterI[] = [];
    @Output() refreshParameters: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    webForm: UntypedFormGroup;
    countdown = signal<number>(3);
    config: FuseConfig;
    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: UntypedFormBuilder,
        private _toastrService: ToastrService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                // Store the config
                this.config = config;
            });

        // Create the form
        this.webForm = this._formBuilder.group({
            theme: ['', Validators.required],
            layout: ['', Validators.required],
        });

        this.webForm.patchValue({ ...this.getSecurityParameters() });
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
     * Get parameter
     * @param code
     */
    getParameter(code: string) {
        if (this.parameters.length > 0) {
            return findParameter(code, this.parameters).value;
        }
    }

    /**
     * Get parameters
     * @returns
     */
    getSecurityParameters() {
        return {
            theme: this.getParameter('APP_THEME'),
            layout: this.getParameter('APP_LAYOUT_TYPE'),
        };
    }

    /**
     * Cancel action
     */
    cancel() {
        this.webForm.reset();
        this.webForm.patchValue({ ...this.getSecurityParameters() });
    }

    /**
     * Save action
     */
    save() {
        // Return if the form is invalid
        if (this.webForm.invalid) {
            return;
        }

        // Disable the form
        this.webForm.disable();

        this._parameterService
            .updateMultiple(this.getValueWebForm())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.webForm.enable();

                    // Set the alert
                    this.countdown.set(3);
                    this._toastrService.success(
                        `${response.message} La página se va a actualizar en ${this.countdown()} segundos.`,
                        'Aviso'
                    );

                    // Emit refresh parameters
                    this.refreshParameters.emit(true);

                    // Redirect after the countdown
                    timer(1000, 1000)
                        .pipe(
                            finalize(() => {
                                location.reload();
                            }),
                            takeWhile(() => this.countdown() > 0),
                            takeUntil(this._unsubscribeAll),
                            tap(() => this.countdown.set(this.countdown() - 1))
                        )
                        .subscribe();
                },
                error: (response) => {
                    // Re-enable the form
                    this.webForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Get value of web parameters
     */
    getValueWebForm(): ParameterI[] {
        const parameters: ParameterI[] = [];
        parameters.push(this.getObjectParameter('APP_THEME', 'theme'));
        parameters.push(this.getObjectParameter('APP_LAYOUT_TYPE', 'layout'));
        return parameters;
    }

    /**
     * Return parameter
     * @param code
     * @param value
     * @returns
     */
    getObjectParameter(code: string, value: string): ParameterI {
        return {
            code,
            value: String(this.webForm.get(value).value),
        };
    }

    /**
     * Set the layout on the config
     *
     * @param layout
     */
    setLayout(layout: string): void {
        // Clear the 'layout' query param to allow layout changes
        this.webForm.get('layout').setValue(layout);
    }

    /**
     * Set the theme on the config
     *
     * @param theme
     */
    setTheme(theme: string): void {
        this.webForm.get('theme').setValue(theme);
    }
}
