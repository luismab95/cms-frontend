import { TextFieldModule } from '@angular/cdk/text-field';
import { NgClass, TitleCasePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    ViewEncapsulation,
    inject,
} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfig, FuseConfigService, Scheme } from '@fuse/services/config';
import { UserService } from 'app/core/user/user.service';
import { RoleI, UserI } from 'app/core/user/user.types';
import { CookieService } from 'ngx-cookie-service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'settings-account',
    templateUrl: './account.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        TextFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatButtonModule,
        NgClass,
        TitleCasePipe,
        MatProgressSpinnerModule,
    ],
})
export class SettingsAccountComponent implements OnInit {
    @Input() user: UserI;
    accountForm: UntypedFormGroup;
    config: FuseConfig;
    roles: RoleI[];
    currentSchema: Scheme;

    private _cookieService = inject(CookieService);
    private _userService = inject(UserService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfigService: FuseConfigService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _toastrService: ToastrService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Set schema
        this.currentSchema = this._cookieService.get('scheme') as Scheme;

        // Subscribe to role changes
        this._userService.role$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((role: RoleI) => {
                this.roles = [role];

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Create the form
        this.accountForm = this._formBuilder.group({
            firstname: ['', Validators.required],
            lastname: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            roleId: ['', Validators.required],
        });

        this.accountForm.patchValue({ ...this.user, roleId: this.roles[0].id });

        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                // Store the config
                this.config = config;
                this.config.scheme = this._cookieService.get(
                    'scheme'
                ) as Scheme;
            });
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
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Set the scheme on the config
     *
     * @param scheme
     */
    setScheme(scheme: Scheme): void {
        this._cookieService.set('scheme', scheme);
        this._fuseConfigService.config = { scheme };
    }

    /**
     * Save action
     */
    save() {
        // Return if the form is invalid
        if (this.accountForm.invalid) {
            return;
        }

        // Disable the form
        this.accountForm.disable();

        this._userService
            .update(this.user.id, this.accountForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.accountForm.enable();
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );
                },
                error: (response) => {
                    // Re-enable the form
                    this.accountForm.enable();
                    // Reset the form
                    this.accountForm.reset();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Cancel action
     */
    cancel() {
        this.setScheme(this.currentSchema);
        this.accountForm.reset();
        this.accountForm.patchValue({ ...this.user, roleId: this.roles[0].id });
    }
}
