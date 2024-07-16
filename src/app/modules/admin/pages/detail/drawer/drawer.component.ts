import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
    selector: 'pages-drawer',
    templateUrl: './drawer.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        NgClass,
        RouterLink,
        MatTooltipModule,
    ],
})
export class PagesDrawerComponent implements OnInit {
    @Input() page: any;
    @Input() micrositie: any;
    @Input() template: any;
    @Output() fullscreemToggle: EventEmitter<boolean> =
        new EventEmitter<boolean>();
    preview: string;
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
    ngOnInit(): void {}

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

    toggleFullscreen() {
        this.fullscreemToggle.emit(true);
    }

    /**
     * Ir atras
     *
     */
    goToBack() {
        if (this.micrositie) {
            this._router.navigateByUrl('/admin/modules/microsities/detail', {
                state: { micrositie: this.micrositie },
            });
        } else {
            this._router.navigateByUrl('/admin/modules/pages');
        }
    }
}
