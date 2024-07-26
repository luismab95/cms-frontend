import {
    ChangeDetectorRef,
    Component,
    OnInit,
    ViewEncapsulation,
    inject,
    signal,
} from '@angular/core';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'loader',
    templateUrl: './loader.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
})
export class LoaderComponent implements OnInit {
    parameters = signal<ParameterI[]>([]);
    show: boolean = true;

    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(private _changeDetectorRef: ChangeDetectorRef) {
        // Subscribe to user changes
        this._parameterService.parameter$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((parameters: ParameterI[]) => {
                this.parameters.set(parameters);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        setTimeout(() => {
            this.show = false;
        }, 3000);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get parameter
     * @param code
     */
    getParameter(code: string) {
        if (this.parameters().length > 0) {
            return findParameter(code, this.parameters()).value;
        }
    }

    /**
     * Get logo
     * @returns
     */
    getLogo() {
        return `${this.getParameter('APP_STATICS_URL')}/${this.getParameter('LOGO_PRIMARY')}`;
    }
}
