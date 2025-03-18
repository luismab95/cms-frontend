import { NgTemplateOutlet, TitleCasePipe } from '@angular/common';
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
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { UserService } from 'app/core/user/user.service';
import { RoleI, UserI } from 'app/core/user/user.types';
import { RoleService } from 'app/shared/services/role.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'users-details',
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatTooltipModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatDialogModule,
        TitleCasePipe,
        MatSlideToggleModule,
        MatProgressSpinnerModule,
        NgTemplateOutlet,
    ],
})
export class UsersDetailsComponent implements OnInit, OnDestroy {
    user: UserI;
    roles: RoleI[];
    editMode: boolean = false;
    userForm: UntypedFormGroup;
    private readonly _matDialog = inject(MAT_DIALOG_DATA);
    private _userService = inject(UserService);
    private _roleService = inject(RoleService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _toastrService: ToastrService,
        public _matDialogRef: MatDialogRef<UsersDetailsComponent>
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the user form
        this.userForm = this._formBuilder.group({
            firstname: ['', [Validators.required]],
            lastname: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            roleId: ['', Validators.required],
            bloqued: [''],
        });

        if (this._matDialog) {
            this.user = this._matDialog;
            this.userForm.patchValue(this._matDialog);
        }

        // Setup the roles
        this._roleService.roles$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((roles) => {
                // Update the roles
                this.roles = roles;
                // Mark for check
                this._changeDetectorRef.markForCheck();
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
     * Add user
     */
    newUser() {
        // Return if the form is invalid
        if (this.userForm.invalid) {
            return;
        }

        // Disable the form
        this.userForm.disable();

        delete this.userForm.value.bloqued;

        this._userService
            .create(this.userForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.userForm.enable();
                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');

                    this._matDialogRef.close(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.userForm.enable();
                    // Reset the form
                    this.userForm.reset();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Update user
     */
    updateUser() {
        // Return if the form is invalid
        if (this.userForm.invalid) {
            return;
        }

        // Disable the form
        this.userForm.disable();

        this._userService
            .update(this.user.id, this.userForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.userForm.enable();
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );

                    this._matDialogRef.close(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.userForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Delete user
     */
    deleteUser() {
        // Disable the form
        this.userForm.disable();

        this._userService
            .delete(this.user.id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.userForm.enable();
                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');

                    this._matDialogRef.close(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.userForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Find role
     * @param roleId
     */
    getRole(roleId: number) {
        const role = this.roles.find((role) => role.id === roleId);
        if (role !== undefined) {
            return role.name;
        }
        return '';
    }

    /**
     * Toggle edit mode
     *
     * @param editMode
     */
    toggleEditMode(editMode: boolean | null = null): void {
        if (editMode === null) {
            this.editMode = !this.editMode;
        } else {
            this.editMode = editMode;
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Toggle the user
     */
    toggleUser(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: `${this.user.status ? 'Inactivar' : 'Activar'} usuario`,
            message: `¿Estás seguro de que deseas ${this.user.status ? 'inactivar' : 'activar'} este usuario?.`,
            actions: {
                confirm: {
                    label: 'Aceptar',
                    color: 'primary',
                },
                cancel: {
                    label: 'Cancelar',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                this.deleteUser();
            }
        });
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
