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
    FormGroup,
    ReactiveFormsModule,
    UntypedFormBuilder,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
    MatDialog,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';

@Component({
    selector: 'modal-review',
    templateUrl: './modal-review.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        MatDialogModule,
        MatButtonModule,
        MatTooltipModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        ReactiveFormsModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalReviewComponent implements OnInit, OnDestroy {
    form = new FormGroup({});
    actions: { value: string; name: string }[] = [
        { value: 'approved', name: 'Aprobar' },
        { value: 'rejected', name: 'Rechazar' },
    ];

    private readonly _dialog = inject(MatDialog);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        public _matDialogRef: MatDialogRef<ModalReviewComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the user form
        this.form = this._formBuilder.group({
            status: ['', [Validators.required]],
            comment: ['', [Validators.required, Validators.maxLength(500)]],
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
     * Save
     */
    save() {
        this._matDialogRef.close(this.form.value);
    }
}
