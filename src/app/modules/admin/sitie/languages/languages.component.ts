import { TextFieldModule } from '@angular/cdk/text-field';
import { NgClass, TitleCasePipe, UpperCasePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormControl,
    UntypedFormGroup,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { FuseConfig } from '@fuse/services/config';
import { ModalService } from 'app/shared/services/modal.service';
import { Subject } from 'rxjs';
import { SitieLanguagesDetailsComponent } from './details/details.component';

@Component({
    selector: 'sitie-languages',
    templateUrl: './languages.component.html',
    styles: [
        /* language=SCSS */
        `
            .languages-grid {
                grid-template-columns: 48px auto 40px;

                @screen sm {
                    grid-template-columns: 48px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns: 48px 112px auto 112px 72px;
                }

                @screen lg {
                    grid-template-columns: 48px 112px auto 112px 96px 96px 72px;
                }
            }
        `,
    ],
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
        MatSortModule,
        MatSlideToggleModule,
        MatPaginatorModule,
        TitleCasePipe,
        UpperCasePipe,
    ],
})
export class SitieLanguagesComponent implements OnInit {
    accountForm: UntypedFormGroup;
    config: FuseConfig;
    isLoading: boolean = false;
    languages: any[] = [];
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(private _modalSvc: ModalService) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Set languages data
        this.languages = [
            {
                id: 1,
                lang: 'ES',
                name: 'Español - Ecuador',
                icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Flag_of_Ecuador.svg',
                status: true,
            },
            {
                id: 2,
                lang: 'EN',
                name: 'Ingles - Estados Unidos',
                icon: 'https://img.freepik.com/vector-gratis/ilustracion-bandera-estados-unidos_53876-18165.jpg?size=626&ext=jpg&ga=GA1.1.2008272138.1721001600&semt=ais_user',
                status: false,
            },
        ];
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
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Open modal laguanges detail
     *
     * @param data
     */
    openDetailsModal(data?: any): void {
        this._modalSvc.openModal<SitieLanguagesDetailsComponent, any>(
            SitieLanguagesDetailsComponent,
            data
        );
    }
}
