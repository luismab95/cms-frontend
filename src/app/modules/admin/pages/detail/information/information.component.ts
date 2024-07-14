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
import { FuseConfig, FuseConfigService, Scheme } from '@fuse/services/config';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'pages-information',
    templateUrl: './information.component.html',
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
export class PagesInformationComponent implements OnInit {
    accountForm: UntypedFormGroup;
    config: FuseConfig;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfigService: FuseConfigService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.accountForm = this._formBuilder.group({
            name: ['Brian Hughes'],
            username: ['brianh'],
            title: ['Senior Frontend Developer'],
            company: ['YXZ Software'],
            about: [
                "Hey! This is Brian; husband, father and gamer. I'm mostly passionate about bleeding edge tech and chocolate! 🍫",
            ],
            email: ['hughes.brian@mail.com', Validators.email],
            phone: ['121-490-33-12'],
            country: ['usa'],
            language: ['english'],
        });

        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                // Store the config
                this.config = config;
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

    /**
     * Set the scheme on the config
     *
     * @param scheme
     */
    setScheme(scheme: Scheme): void {
        this._fuseConfigService.config = { scheme };
    }
}
