import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Subject } from 'rxjs';

@Component({
    selector: 'images-manager',
    templateUrl: './images-manager.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [
        `
            .images-manager-dialog-panel {
                width: 100%;
                @screen md {
                    @apply w-3/5;
                }

                .mat-mdc-dialog-container {
                    .mat-mdc-dialog-surface {
                        padding: 0 !important;
                    }
                }
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        MatTabsModule,
        MonacoEditorModule,
        MatFormFieldModule,
        MatInputModule,
    ],
})
export class ImagesManagerComponent implements OnInit, OnDestroy {
    files: any[] = [];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor() {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Set files
        this.files = [
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
            },
            {
                name: 'image1',
                type: 'image/jpeg',
                size: '2MB',
                url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuViN7efAwB5dbdgcONdw73Omzm1fDYqFK9g&s',
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
}
