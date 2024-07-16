import { TextFieldModule } from '@angular/cdk/text-field';
import { NgClass, TitleCasePipe, UpperCasePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormControl,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
    selector: 'microsities-pages',
    templateUrl: './pages.component.html',
    styles: [
        /* language=SCSS */
        `
            .pages-grid {
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
        TitleCasePipe,
        UpperCasePipe,
        MatPaginatorModule,
    ],
})
export class MicrositiesPagesComponent implements OnInit {
    @Input() micrositie: any;
    pages: any[] = [];
    isLoading: boolean = false;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(private _router: Router) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Set languages data
        this.pages = [
            {
                id: 1,
                name: 'Novedades',
                description:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                path: '/novedades',
                status: true,
            },
            {
                id: 1,
                name: 'Mitos',
                description:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                path: '/mitos',
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
     * Go to detail page
     *
     * @param page
     */
    goToDetail(page?: any) {
        this._router.navigateByUrl('admin/modules/pages/detail', {
            state: { page, micrositie: this.micrositie },
        });
    }
}
