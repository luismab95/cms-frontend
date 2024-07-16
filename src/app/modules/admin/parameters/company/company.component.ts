import { TextFieldModule } from '@angular/cdk/text-field';
import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ViewEncapsulation,
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
import { MatSelectModule } from '@angular/material/select';
import { FuseConfig } from '@fuse/services/config';
import { Subject } from 'rxjs';

@Component({
    selector: 'parameters-company',
    templateUrl: './company.component.html',
    encapsulation: ViewEncapsulation.None,
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
    ],
})
export class ParametersCompanyComponent implements OnInit {
    companyForm: UntypedFormGroup;
    config: FuseConfig;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(private _formBuilder: UntypedFormBuilder) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.companyForm = this._formBuilder.group({
            name: ['Mi compañia', Validators.required],
            description: [
                'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Magnam in iste iure obcaecati impedit modi sed, ipsa, cupiditate temporibus esse, maiores dolores nobis. Commodi assumenda, quibusdam laudantium atque ab consequatur!',
                Validators.required,
            ],
            website: ['micompanie.com', Validators.required],
            urlStatics: ['http://www/micompanie.com/file', Validators.required],
            email: [
                'hola@micompanie.com',
                [Validators.required, Validators.email],
            ],
            phone: ['0987878787', Validators.required],
            country: ['ecuador', Validators.required],
            terms: [
                'http://www/micompanie.com/file/terms.pdf',
                Validators.required,
            ],
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
}
